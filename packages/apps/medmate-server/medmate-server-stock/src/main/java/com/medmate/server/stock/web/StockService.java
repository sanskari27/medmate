package com.medmate.server.stock.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.server.distributors.DistributorRules;
import com.medmate.server.distributors.store.DistributorStore;
import com.medmate.server.identity.access.Access;
import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.shared.error.ApiProblem;
import com.medmate.server.stock.CatalogUnavailable;
import com.medmate.server.stock.InventoryRules;
import com.medmate.server.stock.MedicineCatalog;
import com.medmate.server.stock.PurchaseRules;
import com.medmate.server.stock.RackRules;
import com.medmate.server.stock.store.StockStore;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Profile({"local", "prod", "identity-it"})
public class StockService {

    static final ZoneId ZONE = ZoneId.of("Asia/Kolkata");

    private final StockStore stock;
    private final DistributorStore distributors;
    private final MedicineCatalog catalog;

    public StockService(StockStore stock, DistributorStore distributors, MedicineCatalog catalog) {
        this.stock = stock;
        this.distributors = distributors;
        this.catalog = catalog;
    }

    public StockViews.PurchaseList list(AccountPrincipal actor, String productId) {
        require(actor, PurchaseRules.READ, "Purchases cannot be read");
        Books books = books(actor.pharmacyId());
        return new StockViews.PurchaseList(documents(books, productId), stats(actor.pharmacyId(), books));
    }

    public StockViews.PurchaseOne one(AccountPrincipal actor, String id) {
        require(actor, PurchaseRules.READ, "Purchases cannot be read");
        return loaded(actor.pharmacyId(), id);
    }

    public StockViews.InventoryList inventory(AccountPrincipal actor) {
        require(actor, InventoryRules.READ, "Inventory cannot be read");
        return new StockViews.InventoryList(products(actor.pharmacyId()));
    }

    public StockViews.InventoryOne inventoryOne(AccountPrincipal actor, String productId) {
        require(actor, InventoryRules.READ, "Inventory cannot be read");
        return loadedProduct(actor.pharmacyId(), productId);
    }

    public StockViews.SearchResponse search(AccountPrincipal actor, String query, String limit) {
        require(actor, PurchaseRules.CREATE, "Purchases cannot be created");
        String text = query == null ? "" : query.trim();
        if (text.length() < 2 || text.length() > 80) {
            throw bad("q must be 2 to 80 characters");
        }
        Integer capped = PurchaseRules.limit(limit);
        if (capped == null) {
            throw bad("limit must be a whole number");
        }
        List<StockViews.MedicineView> medicines = new ArrayList<>();
        for (MedicineCatalog.MedicineHit hit : lookupSearch(text, capped)) {
            medicines.add(
                    new StockViews.MedicineView(hit.productId(), hit.name(), hit.marketer(), hit.pack(), hit.mrp()));
        }
        return new StockViews.SearchResponse(medicines);
    }

    public StockViews.ValidateResponse validate(AccountPrincipal actor, JsonNode body) {
        require(actor, PurchaseRules.CREATE, "Purchases cannot be created");
        PurchaseRules.IdList ids = PurchaseRules.ids(body);
        if (ids.problem() != null) {
            throw bad(ids.problem());
        }
        MedicineCatalog.Lookup lookup = lookup(ids.ids());
        List<StockViews.SnapshotView> products = new ArrayList<>();
        for (MedicineCatalog.Snapshot snapshot : lookup.products()) {
            products.add(snapshot(snapshot));
        }
        return new StockViews.ValidateResponse(products, lookup.missing(), lookup.ambiguous());
    }

    @Transactional
    public StockViews.PurchaseOne create(AccountPrincipal actor, JsonNode body) {
        require(actor, PurchaseRules.CREATE, "Purchases cannot be created");
        PurchaseRules.Prepared prepared = PurchaseRules.prepare(body, java.time.LocalDate.now(ZONE));
        if (prepared.problem() != null) {
            throw bad(prepared.problem());
        }
        UUID pharmacyId = actor.pharmacyId();
        if (!distributors.lockPharmacy(pharmacyId)) {
            throw missingPharmacy();
        }
        DistributorStore.DistributorRow distributor =
                distributors.find(pharmacyId, prepared.distributorId()).orElseThrow(StockService::missingDistributor);
        if (!distributor.active() || !distributor.showInPurchases()) {
            throw bad("Distributor cannot be used for purchases");
        }
        if (stock.invoiceExists(pharmacyId, distributor.code(), prepared.invoiceNo())) {
            throw bad("Invoice number is already used");
        }
        Map<String, MedicineCatalog.Snapshot> snapshots = requireKnown(prepared.lines());
        String code = DistributorRules.nextCode("PUR", stock.purchaseCodes(pharmacyId));
        Instant now = Instant.now();
        stock.insertPurchase(
                pharmacyId,
                code,
                distributor.code(),
                prepared.invoiceNo(),
                prepared.invoiceDate(),
                now,
                prepared.ledgerAmount());
        int position = 0;
        for (PurchaseRules.Line line : prepared.lines()) {
            MedicineCatalog.Snapshot snapshot = snapshots.get(line.productId());
            stock.insertLine(pharmacyId, code, position, snapshot.name(), line);
            stock.saveProduct(pharmacyId, snapshot);
            stock.addBatch(pharmacyId, line);
            position++;
        }
        if (prepared.ledgerAmount() >= 1) {
            post(pharmacyId, distributor.code(), "purchase", prepared.ledgerAmount(), code, prepared.invoiceNo(), now);
        }
        return loaded(pharmacyId, code);
    }

    @Transactional
    public StockViews.PurchaseOne createReturn(AccountPrincipal actor, String purchaseId, JsonNode body) {
        require(actor, PurchaseRules.RETURN, "Purchases cannot be returned");
        UUID pharmacyId = actor.pharmacyId();
        if (!distributors.lockPharmacy(pharmacyId)) {
            throw missingPharmacy();
        }
        Books books = books(pharmacyId);
        StockStore.PurchaseRow purchase = books.purchases().stream()
                .filter(row -> row.code().equals(purchaseId))
                .findFirst()
                .orElseThrow(StockService::missingPurchase);
        List<PurchaseRules.Source> sources = new ArrayList<>();
        Map<Integer, StockStore.LineRow> sourceRows = new HashMap<>();
        for (StockStore.LineRow line : books.lines().getOrDefault(purchaseId, List.of())) {
            sources.add(new PurchaseRules.Source(
                    line.position(),
                    line.productId(),
                    line.batchNo(),
                    line.qty(),
                    line.freeQty(),
                    line.rate(),
                    line.gst()));
            sourceRows.put(line.position(), line);
        }
        PurchaseRules.ReturnPrepared prepared =
                PurchaseRules.prepareReturn(sources, taken(books, purchaseId), onHand(books), body);
        if (prepared.problem() != null) {
            throw bad(prepared.problem());
        }
        String code = DistributorRules.nextCode("RET", stock.returnCodes(pharmacyId));
        Instant now = Instant.now();
        stock.insertReturn(pharmacyId, code, purchaseId, now, prepared.ledgerAmount());
        for (PurchaseRules.ReturnLine line : prepared.lines()) {
            stock.insertReturnLine(pharmacyId, code, line);
            StockStore.LineRow source = sourceRows.get(line.position());
            int reduced =
                    stock.reduceBatch(pharmacyId, source.productId(), source.batchNo(), line.qty() + line.freeQty());
            if (reduced == 0) {
                throw bad("Return is more than the batch");
            }
        }
        if (prepared.ledgerAmount() >= 1) {
            post(pharmacyId, purchase.distributorCode(), "return", prepared.ledgerAmount(), code, purchaseId, now);
        }
        return loaded(pharmacyId, code);
    }

    @Transactional
    public StockViews.InventoryOne reorder(AccountPrincipal actor, String productId, JsonNode body) {
        require(actor, InventoryRules.UPDATE, "Inventory cannot be updated");
        Integer level = PurchaseRules.reorder(body);
        if (level == null) {
            throw bad("Reorder level must be zero or more");
        }
        if (stock.updateReorder(actor.pharmacyId(), productId, level) == 0) {
            throw missingProduct();
        }
        return loadedProduct(actor.pharmacyId(), productId);
    }

    public StockViews.RackList racks(AccountPrincipal actor) {
        require(actor, RackRules.READ, "Racks cannot be read");
        return rackList(actor.pharmacyId());
    }

    @Transactional
    public StockViews.RackList createRack(AccountPrincipal actor, JsonNode body) {
        require(actor, RackRules.CREATE, "Racks cannot be created");
        RackRules.Code code = RackRules.requiredRack(body);
        if (code.problem() != null) {
            throw bad(code.problem());
        }
        if (RackRules.taken(code.value(), stock.rackCodes(actor.pharmacyId()))
                || stock.insertRack(actor.pharmacyId(), code.value()) == 0) {
            throw rackExists();
        }
        return rackList(actor.pharmacyId());
    }

    @Transactional
    public StockViews.InventoryOne location(AccountPrincipal actor, String productId, JsonNode body) {
        require(actor, RackRules.UPDATE, "Racks cannot be updated");
        StockStore.ProductRow current =
                stock.product(actor.pharmacyId(), productId).orElseThrow(StockService::missingProduct);
        RackRules.Change change = RackRules.location(body, new RackRules.Placement(current.rack(), current.rackAlt()));
        if (change.problem() != null) {
            throw bad(change.problem());
        }
        RackRules.Placement placement = change.placement();
        if (stock.updateLocation(actor.pharmacyId(), productId, placement.rack(), placement.rackAlt()) == 0) {
            throw missingProduct();
        }
        return loadedProduct(actor.pharmacyId(), productId);
    }

    @Transactional
    public StockViews.RackList bulkLocation(AccountPrincipal actor, JsonNode body) {
        require(actor, RackRules.UPDATE, "Racks cannot be updated");
        RackRules.IdList ids = RackRules.ids(body);
        if (ids.problem() != null) {
            throw bad(ids.problem());
        }
        RackRules.Code code = RackRules.requiredRack(body);
        if (code.problem() != null) {
            throw bad(code.problem());
        }
        for (String productId : ids.ids()) {
            StockStore.ProductRow current =
                    stock.product(actor.pharmacyId(), productId).orElseThrow(StockService::missingProduct);
            RackRules.Placement placement =
                    RackRules.assignPrimary(new RackRules.Placement(current.rack(), current.rackAlt()), code.value());
            if (stock.updateLocation(actor.pharmacyId(), productId, placement.rack(), placement.rackAlt()) == 0) {
                throw missingProduct();
            }
        }
        return rackList(actor.pharmacyId());
    }

    private StockViews.PurchaseOne loaded(UUID pharmacyId, String id) {
        return new StockViews.PurchaseOne(document(books(pharmacyId), id));
    }

    private StockViews.InventoryOne loadedProduct(UUID pharmacyId, String productId) {
        return new StockViews.InventoryOne(product(pharmacyId, productId));
    }

    private void post(
            UUID pharmacyId,
            String distributorCode,
            String type,
            int amount,
            String reference,
            String note,
            Instant recordedAt) {
        String txn = DistributorRules.nextCode("TXN", distributors.transactionCodes(pharmacyId));
        distributors.insertTransaction(
                pharmacyId, distributorCode, txn, type, amount, reference, note, null, recordedAt);
    }

    private Map<String, MedicineCatalog.Snapshot> requireKnown(List<PurchaseRules.Line> lines) {
        List<String> ids = new ArrayList<>();
        for (PurchaseRules.Line line : lines) {
            if (!ids.contains(line.productId())) {
                ids.add(line.productId());
            }
        }
        MedicineCatalog.Lookup lookup = lookup(ids);
        if (!lookup.missing().isEmpty()) {
            throw bad("Product was not found");
        }
        if (!lookup.ambiguous().isEmpty()) {
            throw bad("Product id is ambiguous");
        }
        Map<String, MedicineCatalog.Snapshot> byId = new HashMap<>();
        for (MedicineCatalog.Snapshot snapshot : lookup.products()) {
            byId.put(snapshot.productId(), snapshot);
        }
        for (String id : ids) {
            if (!byId.containsKey(id)) {
                throw bad("Product was not found");
            }
        }
        return byId;
    }

    private MedicineCatalog.Lookup lookup(List<String> ids) {
        try {
            return catalog.lookup(ids);
        } catch (CatalogUnavailable exception) {
            throw unavailable();
        }
    }

    private List<MedicineCatalog.MedicineHit> lookupSearch(String query, int limit) {
        try {
            return catalog.search(query, limit);
        } catch (CatalogUnavailable exception) {
            throw unavailable();
        }
    }

    private Books books(UUID pharmacyId) {
        Map<String, List<StockStore.LineRow>> lines = new HashMap<>();
        for (StockStore.LineRow line : stock.lines(pharmacyId)) {
            lines.computeIfAbsent(line.purchaseCode(), key -> new ArrayList<>()).add(line);
        }
        Map<String, List<StockStore.ReturnLineRow>> returnLines = new HashMap<>();
        for (StockStore.ReturnLineRow line : stock.returnLines(pharmacyId)) {
            returnLines
                    .computeIfAbsent(line.returnCode(), key -> new ArrayList<>())
                    .add(line);
        }
        Map<String, Integer> onHand = new HashMap<>();
        for (StockStore.BatchRow batch : stock.batches(pharmacyId)) {
            onHand.put(PurchaseRules.batchKey(batch.productId(), batch.batchNo()), batch.qty());
        }
        return new Books(stock.purchases(pharmacyId), lines, stock.returns(pharmacyId), returnLines, onHand);
    }

    private List<StockViews.DocumentView> documents(Books books, String productId) {
        String filter = productId == null ? "" : productId.trim();
        List<StockViews.DocumentView> documents = new ArrayList<>();
        for (StockStore.PurchaseRow purchase : books.purchases()) {
            StockViews.DocumentView view = purchaseView(books, purchase);
            if (filter.isEmpty() || contains(view, filter)) {
                documents.add(view);
            }
        }
        for (StockStore.ReturnRow row : books.returns()) {
            StockViews.DocumentView view = returnView(books, row);
            if (view != null && (filter.isEmpty() || contains(view, filter))) {
                documents.add(view);
            }
        }
        documents.sort(Comparator.comparing(StockViews.DocumentView::recordedAt)
                .reversed()
                .thenComparing(Comparator.comparing(StockViews.DocumentView::id).reversed()));
        return documents;
    }

    private StockViews.DocumentView document(Books books, String id) {
        for (StockViews.DocumentView view : documents(books, "")) {
            if (view.id().equals(id)) {
                return view;
            }
        }
        throw missingPurchase();
    }

    private StockViews.DocumentView purchaseView(Books books, StockStore.PurchaseRow purchase) {
        List<StockViews.LineView> lines = new ArrayList<>();
        BigDecimal taxable = BigDecimal.ZERO;
        BigDecimal gst = BigDecimal.ZERO;
        int units = 0;
        for (StockStore.LineRow line : books.lines().getOrDefault(purchase.code(), List.of())) {
            PurchaseRules.Taken prior =
                    taken(books, purchase.code()).getOrDefault(line.position(), new PurchaseRules.Taken(0, 0));
            BigDecimal net = PurchaseRules.taxable(line.rate(), line.qty());
            BigDecimal tax = PurchaseRules.gstAmount(net, line.gst());
            taxable = taxable.add(net);
            gst = gst.add(tax);
            units += line.qty() + line.freeQty();
            lines.add(lineView(
                    line,
                    money(net.add(tax)),
                    prior.qty(),
                    prior.freeQty(),
                    onHand(books).getOrDefault(PurchaseRules.batchKey(line.productId(), line.batchNo()), 0)));
        }
        return document(
                purchase.code(),
                "purchase",
                null,
                purchase,
                taxable,
                gst,
                purchase.ledgerAmount(),
                units,
                lines,
                purchase.recordedAt());
    }

    private StockViews.DocumentView returnView(Books books, StockStore.ReturnRow row) {
        StockStore.PurchaseRow purchase = books.purchases().stream()
                .filter(item -> item.code().equals(row.purchaseCode()))
                .findFirst()
                .orElse(null);
        if (purchase == null) {
            return null;
        }
        Map<Integer, StockStore.LineRow> sources = new HashMap<>();
        for (StockStore.LineRow line : books.lines().getOrDefault(purchase.code(), List.of())) {
            sources.put(line.position(), line);
        }
        List<StockViews.LineView> lines = new ArrayList<>();
        BigDecimal taxable = BigDecimal.ZERO;
        BigDecimal gst = BigDecimal.ZERO;
        int units = 0;
        for (StockStore.ReturnLineRow line : books.returnLines().getOrDefault(row.code(), List.of())) {
            StockStore.LineRow source = sources.get(line.position());
            if (source == null) {
                continue;
            }
            BigDecimal net = PurchaseRules.taxable(source.rate(), line.qty());
            BigDecimal tax = PurchaseRules.gstAmount(net, source.gst());
            taxable = taxable.add(net);
            gst = gst.add(tax);
            units += line.qty() + line.freeQty();
            lines.add(new StockViews.LineView(
                    line.position(),
                    source.productId(),
                    source.name(),
                    source.batchNo(),
                    source.expiry(),
                    line.qty(),
                    line.freeQty(),
                    money(source.rate()),
                    money(source.mrp()),
                    source.gst(),
                    money(net.add(tax)),
                    0,
                    0,
                    0));
        }
        return document(
                row.code(),
                "return",
                purchase.code(),
                purchase,
                taxable,
                gst,
                row.ledgerAmount(),
                units,
                lines,
                row.recordedAt());
    }

    private StockViews.DocumentView document(
            String id,
            String type,
            String purchaseId,
            StockStore.PurchaseRow purchase,
            BigDecimal taxable,
            BigDecimal gst,
            int ledgerAmount,
            int units,
            List<StockViews.LineView> lines,
            Instant recordedAt) {
        return new StockViews.DocumentView(
                id,
                type,
                purchaseId,
                purchase.distributorCode(),
                purchase.distributorName(),
                purchase.invoiceNo(),
                purchase.invoiceDate(),
                recordedAt,
                money(taxable),
                money(gst),
                money(taxable.add(gst)),
                ledgerAmount,
                units,
                lines);
    }

    private StockViews.LineView lineView(
            StockStore.LineRow line, String amount, int returnedQty, int returnedFree, int onHand) {
        return new StockViews.LineView(
                line.position(),
                line.productId(),
                line.name(),
                line.batchNo(),
                line.expiry(),
                line.qty(),
                line.freeQty(),
                money(line.rate()),
                money(line.mrp()),
                line.gst(),
                amount,
                returnedQty,
                returnedFree,
                onHand);
    }

    private StockViews.StatsView stats(UUID pharmacyId, Books books) {
        YearMonth month = YearMonth.now(ZONE);
        int purchases = 0;
        int purchaseCount = 0;
        int returns = 0;
        int returnCount = 0;
        for (StockStore.PurchaseRow purchase : books.purchases()) {
            if (inMonth(purchase.recordedAt(), month)) {
                purchases += purchase.ledgerAmount();
                purchaseCount++;
            }
        }
        for (StockStore.ReturnRow row : books.returns()) {
            if (inMonth(row.recordedAt(), month)) {
                returns += row.ledgerAmount();
                returnCount++;
            }
        }
        long outstanding = 0;
        Map<String, List<DistributorRules.Line>> ledger = new HashMap<>();
        for (DistributorStore.TransactionRow line : distributors.transactions(pharmacyId)) {
            ledger.computeIfAbsent(line.distributorCode(), key -> new ArrayList<>())
                    .add(new DistributorRules.Line(line.type(), line.amount()));
        }
        for (DistributorStore.DistributorRow distributor : distributors.list(pharmacyId)) {
            outstanding += DistributorRules.outstanding(
                    distributor.openingBalance(), ledger.getOrDefault(distributor.code(), List.of()));
        }
        if (outstanding > Integer.MAX_VALUE) {
            outstanding = Integer.MAX_VALUE;
        }
        if (outstanding < Integer.MIN_VALUE) {
            outstanding = Integer.MIN_VALUE;
        }
        return new StockViews.StatsView(purchases, purchaseCount, (int) outstanding, returns, returnCount);
    }

    private List<StockViews.ProductView> products(UUID pharmacyId) {
        Map<String, List<StockStore.BatchRow>> batches = new HashMap<>();
        for (StockStore.BatchRow batch : stock.batches(pharmacyId)) {
            batches.computeIfAbsent(batch.productId(), key -> new ArrayList<>()).add(batch);
        }
        List<StockViews.ProductView> products = new ArrayList<>();
        for (StockStore.ProductRow product : stock.products(pharmacyId)) {
            products.add(productView(product, batches.getOrDefault(product.productId(), List.of())));
        }
        return products;
    }

    private StockViews.ProductView product(UUID pharmacyId, String productId) {
        StockStore.ProductRow product = stock.product(pharmacyId, productId).orElseThrow(StockService::missingProduct);
        List<StockStore.BatchRow> batches = new ArrayList<>();
        for (StockStore.BatchRow batch : stock.batches(pharmacyId)) {
            if (batch.productId().equals(productId)) {
                batches.add(batch);
            }
        }
        return productView(product, batches);
    }

    private StockViews.ProductView productView(StockStore.ProductRow product, List<StockStore.BatchRow> batches) {
        List<StockViews.BatchView> views = new ArrayList<>();
        for (StockStore.BatchRow batch : batches) {
            views.add(new StockViews.BatchView(
                    batch.batchNo(), batch.expiry(), batch.qty(), money(batch.rate()), money(batch.mrp())));
        }
        return new StockViews.ProductView(
                product.productId(),
                product.name(),
                product.marketer(),
                product.composition(),
                product.form(),
                product.pack(),
                product.type(),
                product.reorderLevel(),
                product.rack(),
                product.rackAlt(),
                views);
    }

    private static StockViews.SnapshotView snapshot(MedicineCatalog.Snapshot snapshot) {
        return new StockViews.SnapshotView(
                snapshot.productId(),
                snapshot.name(),
                snapshot.marketer(),
                snapshot.composition(),
                snapshot.form(),
                snapshot.pack(),
                snapshot.type(),
                snapshot.mrp());
    }

    private static Map<Integer, PurchaseRules.Taken> taken(Books books, String purchaseCode) {
        Map<Integer, int[]> totals = new HashMap<>();
        for (StockStore.ReturnRow row : books.returns()) {
            if (!row.purchaseCode().equals(purchaseCode)) {
                continue;
            }
            for (StockStore.ReturnLineRow line : books.returnLines().getOrDefault(row.code(), List.of())) {
                int[] total = totals.computeIfAbsent(line.position(), key -> new int[2]);
                total[0] += line.qty();
                total[1] += line.freeQty();
            }
        }
        Map<Integer, PurchaseRules.Taken> taken = new HashMap<>();
        for (Map.Entry<Integer, int[]> entry : totals.entrySet()) {
            taken.put(entry.getKey(), new PurchaseRules.Taken(entry.getValue()[0], entry.getValue()[1]));
        }
        return taken;
    }

    private static Map<String, Integer> onHand(Books books) {
        return books.onHand();
    }

    private static boolean contains(StockViews.DocumentView view, String productId) {
        for (StockViews.LineView line : view.lines()) {
            if (productId.equals(line.productId())) {
                return true;
            }
        }
        return false;
    }

    private static boolean inMonth(Instant recordedAt, YearMonth month) {
        ZonedDateTime time = recordedAt.atZone(ZONE);
        return YearMonth.from(time).equals(month);
    }

    private static String money(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private boolean allowed(AccountPrincipal actor, String key) {
        return Access.pharmacy(
                actor.accountType(),
                actor.disabled(),
                actor.pharmacyRole(),
                actor.pharmacyId(),
                actor.pharmacyId(),
                actor.verificationStatus(),
                actor.permissions(),
                key);
    }

    private void require(AccountPrincipal actor, String key, String detail) {
        if (!allowed(actor, key)) {
            throw new ApiProblem(HttpStatus.FORBIDDEN, "Forbidden", detail);
        }
    }

    private static ApiProblem bad(String detail) {
        return new ApiProblem(HttpStatus.BAD_REQUEST, "Bad request", detail);
    }

    private static ApiProblem unavailable() {
        return new ApiProblem(HttpStatus.SERVICE_UNAVAILABLE, "Service unavailable", "Medicine catalog is unavailable");
    }

    private static ApiProblem missingPurchase() {
        return new ApiProblem(HttpStatus.NOT_FOUND, "Not found", "Purchase was not found");
    }

    private static ApiProblem missingDistributor() {
        return new ApiProblem(HttpStatus.NOT_FOUND, "Not found", "Distributor was not found");
    }

    private static ApiProblem missingProduct() {
        return new ApiProblem(HttpStatus.NOT_FOUND, "Not found", "Product was not found");
    }

    private static ApiProblem rackExists() {
        return new ApiProblem(HttpStatus.CONFLICT, "Conflict", "That rack already exists");
    }

    private StockViews.RackList rackList(UUID pharmacyId) {
        return new StockViews.RackList(stock.rackCodes(pharmacyId), products(pharmacyId));
    }

    private static ApiProblem missingPharmacy() {
        return new ApiProblem(HttpStatus.NOT_FOUND, "Not found", "Pharmacy was not found");
    }

    private record Books(
            List<StockStore.PurchaseRow> purchases,
            Map<String, List<StockStore.LineRow>> lines,
            List<StockStore.ReturnRow> returns,
            Map<String, List<StockStore.ReturnLineRow>> returnLines,
            Map<String, Integer> onHand) {}
}
