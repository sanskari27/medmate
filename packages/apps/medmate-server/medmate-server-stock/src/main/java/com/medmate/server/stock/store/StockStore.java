package com.medmate.server.stock.store;

import com.medmate.server.stock.MedicineCatalog;
import com.medmate.server.stock.PurchaseRules;
import java.math.BigDecimal;
import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
@Profile({"local", "prod", "identity-it"})
public class StockStore {

    private final JdbcClient jdbc;

    public StockStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public record PurchaseRow(
            String code,
            String distributorCode,
            String distributorName,
            String invoiceNo,
            LocalDate invoiceDate,
            Instant recordedAt,
            int ledgerAmount) {}

    public record LineRow(
            String purchaseCode,
            int position,
            String productId,
            String name,
            String batchNo,
            String expiry,
            int qty,
            int freeQty,
            BigDecimal rate,
            BigDecimal mrp,
            int gst) {}

    public record ReturnRow(String code, String purchaseCode, Instant recordedAt, int ledgerAmount) {}

    public record ReturnLineRow(String returnCode, int position, int qty, int freeQty) {}

    public record ProductRow(
            String productId,
            String name,
            String marketer,
            String composition,
            String form,
            String pack,
            String type,
            int reorderLevel,
            String rack,
            String rackAlt,
            Boolean prescriptionRequired) {}

    public record BatchRow(
            String productId, String batchNo, String expiry, int qty, BigDecimal rate, BigDecimal mrp, Integer gst) {}

    public boolean lockPharmacy(UUID pharmacyId) {
        return jdbc.sql("SELECT id FROM pharmacy WHERE id = :id FOR UPDATE")
                .param("id", pharmacyId)
                .query(UUID.class)
                .optional()
                .isPresent();
    }

    public List<String> purchaseCodes(UUID pharmacyId) {
        return jdbc.sql("SELECT code FROM purchase WHERE pharmacy_id = :id")
                .param("id", pharmacyId)
                .query(String.class)
                .list();
    }

    public List<String> returnCodes(UUID pharmacyId) {
        return jdbc.sql("SELECT code FROM purchase_return WHERE pharmacy_id = :id")
                .param("id", pharmacyId)
                .query(String.class)
                .list();
    }

    public boolean invoiceExists(UUID pharmacyId, String distributorCode, String invoiceNo) {
        return jdbc.sql(
                        """
                        SELECT code FROM purchase
                        WHERE pharmacy_id = :id AND distributor_code = :distributor AND invoice_no = :invoice
                        """)
                .param("id", pharmacyId)
                .param("distributor", distributorCode)
                .param("invoice", invoiceNo)
                .query(String.class)
                .optional()
                .isPresent();
    }

    public List<PurchaseRow> purchases(UUID pharmacyId) {
        return jdbc.sql(
                        """
                        SELECT p.code, p.distributor_code, d.name, p.invoice_no, p.invoice_date, p.recorded_at, p.ledger_amount
                        FROM purchase p
                        JOIN distributor d ON d.pharmacy_id = p.pharmacy_id AND d.code = p.distributor_code
                        WHERE p.pharmacy_id = :id
                        ORDER BY p.recorded_at DESC, p.code DESC
                        """)
                .param("id", pharmacyId)
                .query(this::purchase)
                .list();
    }

    public Optional<PurchaseRow> purchase(UUID pharmacyId, String code) {
        return jdbc.sql(
                        """
                        SELECT p.code, p.distributor_code, d.name, p.invoice_no, p.invoice_date, p.recorded_at, p.ledger_amount
                        FROM purchase p
                        JOIN distributor d ON d.pharmacy_id = p.pharmacy_id AND d.code = p.distributor_code
                        WHERE p.pharmacy_id = :id AND p.code = :code
                        """)
                .param("id", pharmacyId)
                .param("code", code)
                .query(this::purchase)
                .optional();
    }

    public List<LineRow> lines(UUID pharmacyId) {
        return jdbc.sql(
                        """
                        SELECT purchase_code, position, product_id, name, batch_no, expiry, qty, free_qty, rate, mrp, gst
                        FROM purchase_line
                        WHERE pharmacy_id = :id
                        ORDER BY purchase_code, position
                        """)
                .param("id", pharmacyId)
                .query(this::line)
                .list();
    }

    public List<ReturnRow> returns(UUID pharmacyId) {
        return jdbc.sql(
                        """
                        SELECT code, purchase_code, recorded_at, ledger_amount
                        FROM purchase_return
                        WHERE pharmacy_id = :id
                        ORDER BY recorded_at DESC, code DESC
                        """)
                .param("id", pharmacyId)
                .query(this::returnRow)
                .list();
    }

    public Optional<ReturnRow> returnDocument(UUID pharmacyId, String code) {
        return jdbc.sql(
                        """
                        SELECT code, purchase_code, recorded_at, ledger_amount
                        FROM purchase_return
                        WHERE pharmacy_id = :id AND code = :code
                        """)
                .param("id", pharmacyId)
                .param("code", code)
                .query(this::returnRow)
                .optional();
    }

    public List<ReturnLineRow> returnLines(UUID pharmacyId) {
        return jdbc.sql(
                        """
                        SELECT return_code, position, qty, free_qty
                        FROM purchase_return_line
                        WHERE pharmacy_id = :id
                        ORDER BY return_code, position
                        """)
                .param("id", pharmacyId)
                .query(this::returnLine)
                .list();
    }

    public void insertPurchase(
            UUID pharmacyId,
            String code,
            String distributorCode,
            String invoiceNo,
            LocalDate invoiceDate,
            Instant recordedAt,
            int ledgerAmount) {
        jdbc.sql(
                        """
                        INSERT INTO purchase (
                          pharmacy_id, code, distributor_code, invoice_no, invoice_date, recorded_at, ledger_amount)
                        VALUES (:pharmacy, :code, :distributor, :invoice, :invoiceDate, :recorded, :ledger)
                        """)
                .param("pharmacy", pharmacyId)
                .param("code", code)
                .param("distributor", distributorCode)
                .param("invoice", invoiceNo)
                .param("invoiceDate", Date.valueOf(invoiceDate))
                .param("recorded", Timestamp.from(recordedAt))
                .param("ledger", ledgerAmount)
                .update();
    }

    public void insertLine(UUID pharmacyId, String purchaseCode, int position, String name, PurchaseRules.Line line) {
        jdbc.sql(
                        """
                        INSERT INTO purchase_line (
                          pharmacy_id, purchase_code, position, product_id, name, batch_no, expiry,
                          qty, free_qty, rate, mrp, gst)
                        VALUES (
                          :pharmacy, :purchase, :position, :product, :name, :batch, :expiry,
                          :qty, :free, :rate, :mrp, :gst)
                        """)
                .param("pharmacy", pharmacyId)
                .param("purchase", purchaseCode)
                .param("position", position)
                .param("product", line.productId())
                .param("name", name)
                .param("batch", line.batchNo())
                .param("expiry", line.expiry())
                .param("qty", line.qty())
                .param("free", line.freeQty())
                .param("rate", line.rate())
                .param("mrp", line.mrp())
                .param("gst", line.gst())
                .update();
    }

    public void insertReturn(UUID pharmacyId, String code, String purchaseCode, Instant recordedAt, int ledgerAmount) {
        jdbc.sql(
                        """
                        INSERT INTO purchase_return (pharmacy_id, code, purchase_code, recorded_at, ledger_amount)
                        VALUES (:pharmacy, :code, :purchase, :recorded, :ledger)
                        """)
                .param("pharmacy", pharmacyId)
                .param("code", code)
                .param("purchase", purchaseCode)
                .param("recorded", Timestamp.from(recordedAt))
                .param("ledger", ledgerAmount)
                .update();
    }

    public void insertReturnLine(UUID pharmacyId, String returnCode, PurchaseRules.ReturnLine line) {
        jdbc.sql(
                        """
                        INSERT INTO purchase_return_line (pharmacy_id, return_code, position, qty, free_qty)
                        VALUES (:pharmacy, :returnCode, :position, :qty, :free)
                        """)
                .param("pharmacy", pharmacyId)
                .param("returnCode", returnCode)
                .param("position", line.position())
                .param("qty", line.qty())
                .param("free", line.freeQty())
                .update();
    }

    public List<ProductRow> products(UUID pharmacyId) {
        return jdbc.sql(
                        """
                        SELECT product_id, name, marketer, composition, form, pack, product_type, reorder_level,
                               rack, rack_alt, prescription_required
                        FROM inventory_product
                        WHERE pharmacy_id = :id
                        ORDER BY name, product_id
                        """)
                .param("id", pharmacyId)
                .query(this::product)
                .list();
    }

    public List<ProductRow> productsIn(UUID pharmacyId, List<String> productIds) {
        if (productIds.isEmpty()) {
            return List.of();
        }
        return jdbc.sql(
                        """
                        SELECT product_id, name, marketer, composition, form, pack, product_type, reorder_level,
                               rack, rack_alt, prescription_required
                        FROM inventory_product
                        WHERE pharmacy_id = :id AND product_id IN (:products)
                        """)
                .param("id", pharmacyId)
                .param("products", productIds)
                .query(this::product)
                .list();
    }

    public Optional<ProductRow> product(UUID pharmacyId, String productId) {
        return jdbc.sql(
                        """
                        SELECT product_id, name, marketer, composition, form, pack, product_type, reorder_level,
                               rack, rack_alt, prescription_required
                        FROM inventory_product
                        WHERE pharmacy_id = :id AND product_id = :product
                        """)
                .param("id", pharmacyId)
                .param("product", productId)
                .query(this::product)
                .optional();
    }

    public List<BatchRow> batches(UUID pharmacyId) {
        return jdbc.sql(
                        """
                        SELECT product_id, batch_no, expiry, qty, rate, mrp, gst
                        FROM inventory_batch
                        WHERE pharmacy_id = :id
                        ORDER BY product_id, expiry, batch_no
                        """)
                .param("id", pharmacyId)
                .query(this::batch)
                .list();
    }

    public void saveProduct(UUID pharmacyId, MedicineCatalog.Snapshot snapshot) {
        jdbc.sql(
                        """
                        INSERT INTO inventory_product (
                          pharmacy_id, product_id, name, marketer, composition, form, pack, product_type,
                          reorder_level, prescription_required)
                        VALUES (:pharmacy, :product, :name, :marketer, :composition, :form, :pack, :type, 20, :rx)
                        ON CONFLICT (pharmacy_id, product_id) DO UPDATE SET
                          name = EXCLUDED.name,
                          marketer = EXCLUDED.marketer,
                          composition = EXCLUDED.composition,
                          form = EXCLUDED.form,
                          pack = EXCLUDED.pack,
                          product_type = EXCLUDED.product_type,
                          prescription_required = EXCLUDED.prescription_required
                        """)
                .param("pharmacy", pharmacyId)
                .param("product", snapshot.productId())
                .param("name", snapshot.name())
                .param("marketer", snapshot.marketer(), Types.VARCHAR)
                .param("composition", snapshot.composition(), Types.VARCHAR)
                .param("form", snapshot.form(), Types.VARCHAR)
                .param("pack", snapshot.pack(), Types.VARCHAR)
                .param("type", snapshot.type(), Types.VARCHAR)
                .param("rx", snapshot.prescriptionRequired())
                .update();
    }

    public void savePrescription(UUID pharmacyId, String productId, boolean prescriptionRequired) {
        jdbc.sql(
                        """
                        UPDATE inventory_product
                        SET prescription_required = :rx
                        WHERE pharmacy_id = :pharmacy AND product_id = :product AND prescription_required IS NULL
                        """)
                .param("pharmacy", pharmacyId)
                .param("product", productId)
                .param("rx", prescriptionRequired)
                .update();
    }

    public void addBatch(UUID pharmacyId, PurchaseRules.Line line) {
        jdbc.sql(
                        """
                        INSERT INTO inventory_batch (pharmacy_id, product_id, batch_no, expiry, qty, rate, mrp, gst)
                        VALUES (:pharmacy, :product, :batch, :expiry, :qty, :rate, :mrp, :gst)
                        ON CONFLICT (pharmacy_id, product_id, batch_no) DO UPDATE SET
                          qty = inventory_batch.qty + EXCLUDED.qty,
                          expiry = EXCLUDED.expiry,
                          rate = EXCLUDED.rate,
                          mrp = EXCLUDED.mrp,
                          gst = EXCLUDED.gst
                        """)
                .param("pharmacy", pharmacyId)
                .param("product", line.productId())
                .param("batch", line.batchNo())
                .param("expiry", line.expiry())
                .param("qty", line.qty() + line.freeQty())
                .param("rate", line.rate())
                .param("mrp", line.mrp())
                .param("gst", line.gst())
                .update();
    }

    public int restoreBatch(UUID pharmacyId, String productId, String batchNo, int units) {
        return jdbc.sql(
                        """
                        UPDATE inventory_batch
                        SET qty = qty + :units
                        WHERE pharmacy_id = :pharmacy AND product_id = :product AND batch_no = :batch
                        """)
                .param("pharmacy", pharmacyId)
                .param("product", productId)
                .param("batch", batchNo)
                .param("units", units)
                .update();
    }

    public int reduceBatch(UUID pharmacyId, String productId, String batchNo, int units) {
        return jdbc.sql(
                        """
                        UPDATE inventory_batch
                        SET qty = qty - :units
                        WHERE pharmacy_id = :pharmacy AND product_id = :product AND batch_no = :batch AND qty >= :units
                        """)
                .param("pharmacy", pharmacyId)
                .param("product", productId)
                .param("batch", batchNo)
                .param("units", units)
                .update();
    }

    public List<String> rackCodes(UUID pharmacyId) {
        return jdbc.sql("SELECT code FROM rack WHERE pharmacy_id = :id ORDER BY code")
                .param("id", pharmacyId)
                .query(String.class)
                .list();
    }

    public int insertRack(UUID pharmacyId, String code) {
        return jdbc.sql(
                        """
                        INSERT INTO rack (pharmacy_id, code)
                        VALUES (:pharmacy, :code)
                        ON CONFLICT DO NOTHING
                        """)
                .param("pharmacy", pharmacyId)
                .param("code", code)
                .update();
    }

    public int updateLocation(UUID pharmacyId, String productId, String rack, String rackAlt) {
        return jdbc.sql(
                        """
                        UPDATE inventory_product
                        SET rack = :rack, rack_alt = :alt
                        WHERE pharmacy_id = :pharmacy AND product_id = :product
                        """)
                .param("pharmacy", pharmacyId)
                .param("product", productId)
                .param("rack", rack, Types.VARCHAR)
                .param("alt", rackAlt, Types.VARCHAR)
                .update();
    }

    public int updateReorder(UUID pharmacyId, String productId, int reorderLevel) {
        return jdbc.sql(
                        """
                        UPDATE inventory_product
                        SET reorder_level = :reorder
                        WHERE pharmacy_id = :pharmacy AND product_id = :product
                        """)
                .param("pharmacy", pharmacyId)
                .param("product", productId)
                .param("reorder", reorderLevel)
                .update();
    }

    public record DocumentKey(String id, String type) {}

    public record DocumentPage(List<DocumentKey> keys, int total) {}

    public record InventoryPage(List<ProductRow> products, int total) {}

    public record InventoryTotals(
            int skuCount,
            long unitCount,
            BigDecimal cost,
            BigDecimal retail,
            int lowCount,
            int outCount,
            int expiringCount,
            BigDecimal expiringCost) {}

    public record MonthTotals(int purchases, int purchaseCount, int returns, int returnCount) {}

    public DocumentPage documentPage(
            UUID pharmacyId,
            String productId,
            String pattern,
            String distributorId,
            LocalDate from,
            LocalDate to,
            int limit,
            int offset) {
        String product = productId == null ? "" : productId.trim();
        String distributor = distributorId == null ? "" : distributorId.trim();
        int total = documentQuery(
                        "SELECT COUNT(*) FROM (" + documentUnion() + ") docs",
                        pharmacyId,
                        product,
                        pattern,
                        distributor,
                        from,
                        to)
                .query(Integer.class)
                .single();
        List<DocumentKey> keys = documentQuery(
                        "SELECT id, type FROM ("
                                + documentUnion()
                                + ") docs ORDER BY recorded_at DESC, id DESC LIMIT :limit OFFSET :offset",
                        pharmacyId,
                        product,
                        pattern,
                        distributor,
                        from,
                        to)
                .param("limit", limit)
                .param("offset", offset)
                .query((row, number) -> new DocumentKey(row.getString("id"), row.getString("type")))
                .list();
        return new DocumentPage(keys, total);
    }

    private JdbcClient.StatementSpec documentQuery(
            String sql,
            UUID pharmacyId,
            String product,
            String pattern,
            String distributor,
            LocalDate from,
            LocalDate to) {
        return jdbc.sql(sql)
                .param("id", pharmacyId)
                .param("product", product)
                .param("pattern", pattern == null ? "" : pattern)
                .param("distributor", distributor)
                .param("from", from == null ? null : Date.valueOf(from), Types.DATE)
                .param("to", to == null ? null : Date.valueOf(to), Types.DATE);
    }

    public MonthTotals monthTotals(UUID pharmacyId, Instant start, Instant end) {
        int[] purchases = counted(
                """
                SELECT COALESCE(SUM(ledger_amount), 0) AS amount, COUNT(*) AS counted
                FROM purchase
                WHERE pharmacy_id = :id AND recorded_at >= :start AND recorded_at < :end
                """,
                pharmacyId,
                start,
                end);
        int[] returns = counted(
                """
                SELECT COALESCE(SUM(ledger_amount), 0) AS amount, COUNT(*) AS counted
                FROM purchase_return
                WHERE pharmacy_id = :id AND recorded_at >= :start AND recorded_at < :end
                """,
                pharmacyId,
                start,
                end);
        return new MonthTotals(purchases[0], purchases[1], returns[0], returns[1]);
    }

    public List<PurchaseRow> purchasesIn(UUID pharmacyId, List<String> codes) {
        if (codes.isEmpty()) {
            return List.of();
        }
        return jdbc.sql(
                        """
                        SELECT p.code, p.distributor_code, d.name, p.invoice_no, p.invoice_date, p.recorded_at, p.ledger_amount
                        FROM purchase p
                        JOIN distributor d ON d.pharmacy_id = p.pharmacy_id AND d.code = p.distributor_code
                        WHERE p.pharmacy_id = :id AND p.code IN (:codes)
                        """)
                .param("id", pharmacyId)
                .param("codes", codes)
                .query(this::purchase)
                .list();
    }

    public List<LineRow> linesIn(UUID pharmacyId, List<String> codes) {
        if (codes.isEmpty()) {
            return List.of();
        }
        return jdbc.sql(
                        """
                        SELECT purchase_code, position, product_id, name, batch_no, expiry, qty, free_qty, rate, mrp, gst
                        FROM purchase_line
                        WHERE pharmacy_id = :id AND purchase_code IN (:codes)
                        ORDER BY purchase_code, position
                        """)
                .param("id", pharmacyId)
                .param("codes", codes)
                .query(this::line)
                .list();
    }

    public List<ReturnRow> returnsIn(UUID pharmacyId, List<String> codes) {
        if (codes.isEmpty()) {
            return List.of();
        }
        return jdbc.sql(
                        """
                        SELECT code, purchase_code, recorded_at, ledger_amount
                        FROM purchase_return
                        WHERE pharmacy_id = :id AND code IN (:codes)
                        """)
                .param("id", pharmacyId)
                .param("codes", codes)
                .query(this::returnRow)
                .list();
    }

    public List<ReturnRow> returnsForPurchases(UUID pharmacyId, List<String> codes) {
        if (codes.isEmpty()) {
            return List.of();
        }
        return jdbc.sql(
                        """
                        SELECT code, purchase_code, recorded_at, ledger_amount
                        FROM purchase_return
                        WHERE pharmacy_id = :id AND purchase_code IN (:codes)
                        """)
                .param("id", pharmacyId)
                .param("codes", codes)
                .query(this::returnRow)
                .list();
    }

    public List<ReturnLineRow> returnLinesIn(UUID pharmacyId, List<String> codes) {
        if (codes.isEmpty()) {
            return List.of();
        }
        return jdbc.sql(
                        """
                        SELECT return_code, position, qty, free_qty
                        FROM purchase_return_line
                        WHERE pharmacy_id = :id AND return_code IN (:codes)
                        ORDER BY return_code, position
                        """)
                .param("id", pharmacyId)
                .param("codes", codes)
                .query(this::returnLine)
                .list();
    }

    public List<BatchRow> batchesIn(UUID pharmacyId, List<String> productIds) {
        if (productIds.isEmpty()) {
            return List.of();
        }
        return jdbc.sql(
                        """
                        SELECT product_id, batch_no, expiry, qty, rate, mrp, gst
                        FROM inventory_batch
                        WHERE pharmacy_id = :id AND product_id IN (:products)
                        ORDER BY product_id, expiry, batch_no
                        """)
                .param("id", pharmacyId)
                .param("products", productIds)
                .query(this::batch)
                .list();
    }

    public InventoryPage inventoryPage(
            UUID pharmacyId,
            String pattern,
            String exact,
            String filter,
            String expiryLimit,
            String currentMonth,
            int limit,
            int offset) {
        int total = jdbc.sql("SELECT COUNT(*) FROM (" + inventoryFacts(true) + ") facts " + inventoryMatch())
                .param("id", pharmacyId)
                .param("pattern", pattern)
                .param("limitMonth", expiryLimit)
                .param("currentMonth", currentMonth)
                .param("filter", filter)
                .query(Integer.class)
                .single();
        List<ProductRow> products = jdbc.sql(
                        "SELECT product_id, name, marketer, composition, form, pack, product_type, reorder_level, rack, rack_alt, prescription_required FROM ("
                                + inventoryFacts(true)
                                + ") facts "
                                + inventoryMatch()
                                + " ORDER BY CASE WHEN lower(product_id) = :exact THEN 0 ELSE 1 END, name, product_id"
                                + " LIMIT :limit OFFSET :offset")
                .param("id", pharmacyId)
                .param("pattern", pattern)
                .param("exact", exact)
                .param("limitMonth", expiryLimit)
                .param("currentMonth", currentMonth)
                .param("filter", filter)
                .param("limit", limit)
                .param("offset", offset)
                .query(this::product)
                .list();
        return new InventoryPage(products, total);
    }

    public InventoryTotals inventoryTotals(UUID pharmacyId, String expiryLimit, String currentMonth) {
        return jdbc.sql(
                        """
                        SELECT COUNT(*) AS sku_count,
                               COALESCE(SUM(units), 0) AS unit_count,
                               COALESCE(SUM(cost), 0) AS cost,
                               COALESCE(SUM(retail), 0) AS retail,
                               COUNT(*) FILTER (WHERE units <= reorder_level) AS low_count,
                               COUNT(*) FILTER (WHERE units = 0) AS out_count,
                               COUNT(*) FILTER (WHERE expiring) AS expiring_count,
                               COALESCE(SUM(expiring_cost), 0) AS expiring_cost
                        FROM (
                        """
                                + inventoryFacts(false)
                                + ") facts")
                .param("id", pharmacyId)
                .param("limitMonth", expiryLimit)
                .param("currentMonth", currentMonth)
                .query((row, number) -> new InventoryTotals(
                        row.getInt("sku_count"),
                        row.getLong("unit_count"),
                        row.getBigDecimal("cost"),
                        row.getBigDecimal("retail"),
                        row.getInt("low_count"),
                        row.getInt("out_count"),
                        row.getInt("expiring_count"),
                        row.getBigDecimal("expiring_cost")))
                .single();
    }

    static String documentUnion() {
        return """
                SELECT p.code AS id, 'purchase' AS type, p.recorded_at
                FROM purchase p
                JOIN distributor d ON d.pharmacy_id = p.pharmacy_id AND d.code = p.distributor_code
                WHERE p.pharmacy_id = :id
                  AND (
                    CAST(:product AS text) = ''
                    OR EXISTS (
                      SELECT 1 FROM purchase_line l
                      WHERE l.pharmacy_id = p.pharmacy_id
                        AND l.purchase_code = p.code
                        AND l.product_id = :product
                    )
                  )
                  AND (CAST(:distributor AS text) = '' OR p.distributor_code = :distributor)
                  AND (CAST(:from AS date) IS NULL OR p.invoice_date >= CAST(:from AS date))
                  AND (CAST(:to AS date) IS NULL OR p.invoice_date <= CAST(:to AS date))
                  AND (
                    CAST(:pattern AS text) = ''
                    OR lower(p.code) LIKE :pattern ESCAPE '\\'
                    OR lower(COALESCE(p.invoice_no, '')) LIKE :pattern ESCAPE '\\'
                    OR lower(d.name) LIKE :pattern ESCAPE '\\'
                  )
                UNION ALL
                SELECT r.code, 'return', r.recorded_at
                FROM purchase_return r
                JOIN purchase p ON p.pharmacy_id = r.pharmacy_id AND p.code = r.purchase_code
                JOIN distributor d ON d.pharmacy_id = p.pharmacy_id AND d.code = p.distributor_code
                WHERE r.pharmacy_id = :id
                  AND (
                    CAST(:product AS text) = ''
                    OR EXISTS (
                      SELECT 1
                      FROM purchase_return_line rl
                      JOIN purchase_line l
                        ON l.pharmacy_id = rl.pharmacy_id
                       AND l.purchase_code = r.purchase_code
                       AND l.position = rl.position
                      WHERE rl.pharmacy_id = r.pharmacy_id
                        AND rl.return_code = r.code
                        AND l.product_id = :product
                    )
                  )
                  AND (CAST(:distributor AS text) = '' OR p.distributor_code = :distributor)
                  AND (CAST(:from AS date) IS NULL OR (r.recorded_at AT TIME ZONE 'Asia/Kolkata')::date >= CAST(:from AS date))
                  AND (CAST(:to AS date) IS NULL OR (r.recorded_at AT TIME ZONE 'Asia/Kolkata')::date <= CAST(:to AS date))
                  AND (
                    CAST(:pattern AS text) = ''
                    OR lower(r.code) LIKE :pattern ESCAPE '\\'
                    OR lower(COALESCE(p.invoice_no, '')) LIKE :pattern ESCAPE '\\'
                    OR lower(d.name) LIKE :pattern ESCAPE '\\'
                  )
                """;
    }

    static String inventoryFacts(boolean searchable) {
        String search = searchable
                ? """
                  AND (
                    CAST(:pattern AS text) = ''
                    OR lower(p.name) LIKE :pattern ESCAPE '\\'
                    OR lower(COALESCE(p.composition, '')) LIKE :pattern ESCAPE '\\'
                    OR lower(COALESCE(p.marketer, '')) LIKE :pattern ESCAPE '\\'
                    OR lower(p.product_id) LIKE :pattern ESCAPE '\\'
                    OR lower(COALESCE(p.rack, '')) LIKE :pattern ESCAPE '\\'
                    OR lower(COALESCE(p.rack_alt, '')) LIKE :pattern ESCAPE '\\'
                    OR EXISTS (
                      SELECT 1 FROM inventory_batch found
                      WHERE found.pharmacy_id = p.pharmacy_id
                        AND found.product_id = p.product_id
                        AND lower(found.batch_no) LIKE :pattern ESCAPE '\\'
                    )
                  )
                """
                : "";
        return """
                SELECT p.product_id, p.name, p.marketer, p.composition, p.form, p.pack, p.product_type,
                       p.reorder_level, p.rack, p.rack_alt, p.prescription_required,
                       COALESCE(SUM(CASE WHEN b.qty > 0 THEN b.qty ELSE 0 END), 0) AS units,
                       COALESCE(SUM(CASE WHEN b.qty > 0 THEN b.rate * b.qty ELSE 0 END), 0) AS cost,
                       COALESCE(SUM(CASE WHEN b.qty > 0 THEN b.mrp * b.qty ELSE 0 END), 0) AS retail,
                       COALESCE(SUM(CASE WHEN b.qty > 0 AND b.expiry >= :currentMonth AND b.expiry <= :limitMonth THEN b.rate * b.qty ELSE 0 END), 0) AS expiring_cost,
                       COALESCE(BOOL_OR(b.qty > 0 AND b.expiry >= :currentMonth AND b.expiry <= :limitMonth), FALSE) AS expiring,
                       COALESCE(BOOL_OR(b.qty > 0 AND b.expiry <> '' AND b.expiry < :currentMonth), FALSE) AS expired
                FROM inventory_product p
                LEFT JOIN inventory_batch b
                  ON b.pharmacy_id = p.pharmacy_id AND b.product_id = p.product_id
                WHERE p.pharmacy_id = :id
                """
                + search
                + """
                GROUP BY p.product_id, p.name, p.marketer, p.composition, p.form, p.pack, p.product_type,
                         p.reorder_level, p.rack, p.rack_alt, p.prescription_required
                """;
    }

    static String inventoryMatch() {
        return """
                WHERE :filter = 'all'
                   OR (:filter = 'low' AND units <= reorder_level)
                   OR (:filter = 'out' AND units = 0)
                   OR (:filter = 'expiring' AND expiring)
                   OR (:filter = 'expired' AND expired)
                """;
    }

    private int[] counted(String sql, UUID pharmacyId, Instant start, Instant end) {
        return jdbc.sql(sql)
                .param("id", pharmacyId)
                .param("start", Timestamp.from(start))
                .param("end", Timestamp.from(end))
                .query((row, number) -> new int[] {row.getInt("amount"), row.getInt("counted")})
                .single();
    }

    private PurchaseRow purchase(ResultSet row, int number) throws SQLException {
        return new PurchaseRow(
                row.getString("code"),
                row.getString("distributor_code"),
                row.getString("name"),
                row.getString("invoice_no"),
                row.getDate("invoice_date").toLocalDate(),
                row.getTimestamp("recorded_at").toInstant(),
                row.getInt("ledger_amount"));
    }

    private LineRow line(ResultSet row, int number) throws SQLException {
        return new LineRow(
                row.getString("purchase_code"),
                row.getInt("position"),
                row.getString("product_id"),
                row.getString("name"),
                row.getString("batch_no"),
                row.getString("expiry"),
                row.getInt("qty"),
                row.getInt("free_qty"),
                row.getBigDecimal("rate"),
                row.getBigDecimal("mrp"),
                row.getInt("gst"));
    }

    private ReturnRow returnRow(ResultSet row, int number) throws SQLException {
        return new ReturnRow(
                row.getString("code"),
                row.getString("purchase_code"),
                row.getTimestamp("recorded_at").toInstant(),
                row.getInt("ledger_amount"));
    }

    private ReturnLineRow returnLine(ResultSet row, int number) throws SQLException {
        return new ReturnLineRow(
                row.getString("return_code"), row.getInt("position"), row.getInt("qty"), row.getInt("free_qty"));
    }

    private ProductRow product(ResultSet row, int number) throws SQLException {
        return new ProductRow(
                row.getString("product_id"),
                row.getString("name"),
                row.getString("marketer"),
                row.getString("composition"),
                row.getString("form"),
                row.getString("pack"),
                row.getString("product_type"),
                row.getInt("reorder_level"),
                row.getString("rack"),
                row.getString("rack_alt"),
                flag(row, "prescription_required"));
    }

    private BatchRow batch(ResultSet row, int number) throws SQLException {
        return new BatchRow(
                row.getString("product_id"),
                row.getString("batch_no"),
                row.getString("expiry"),
                row.getInt("qty"),
                row.getBigDecimal("rate"),
                row.getBigDecimal("mrp"),
                integer(row, "gst"));
    }

    private static Boolean flag(ResultSet row, String column) throws SQLException {
        boolean value = row.getBoolean(column);
        return row.wasNull() ? null : value;
    }

    private static Integer integer(ResultSet row, String column) throws SQLException {
        int value = row.getInt(column);
        return row.wasNull() ? null : value;
    }
}
