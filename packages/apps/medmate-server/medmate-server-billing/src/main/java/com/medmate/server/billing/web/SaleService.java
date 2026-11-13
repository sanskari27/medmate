package com.medmate.server.billing.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.server.billing.SaleReturnRules;
import com.medmate.server.billing.store.BillStore;
import com.medmate.server.identity.access.Access;
import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.shared.error.ApiProblem;
import com.medmate.server.shared.web.PageQuery;
import com.medmate.server.stock.CounterStock;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.ArrayList;
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
public class SaleService {

    static final ZoneId ZONE = ZoneId.of("Asia/Kolkata");

    private final BillStore bills;
    private final CounterStock stock;

    public SaleService(BillStore bills, CounterStock stock) {
        this.bills = bills;
        this.stock = stock;
    }

    @Transactional(readOnly = true)
    public SaleViews.ListResponse list(AccountPrincipal actor, PageQuery page, String query) {
        require(actor, SaleReturnRules.READ, "Sales cannot be read");
        UUID pharmacyId = actor.pharmacyId();
        BillStore.SalePage slice = bills.salePage(pharmacyId, PageQuery.like(query), page.size(), page.offset());
        List<SaleViews.Row> rows = new ArrayList<>();
        for (BillStore.SaleListRow row : slice.rows()) {
            rows.add(new SaleViews.Row(
                    row.id(),
                    row.type(),
                    row.invoiceNumber(),
                    row.patientName(),
                    row.recordedAt(),
                    row.items(),
                    money(row.amount()).toPlainString()));
        }
        YearMonth month = YearMonth.now(ZONE);
        Instant start = month.atDay(1).atStartOfDay(ZONE).toInstant();
        Instant end = month.plusMonths(1).atDay(1).atStartOfDay(ZONE).toInstant();
        BillStore.SaleMonth totals = bills.saleMonth(pharmacyId, start, end);
        BigDecimal sales = money(totals.sales());
        BigDecimal returned = money(totals.returned());
        return new SaleViews.ListResponse(
                rows,
                new SaleViews.Stats(
                        sales.toPlainString(),
                        totals.saleCount(),
                        returned.toPlainString(),
                        totals.returnCount(),
                        money(sales.subtract(returned)).toPlainString()),
                page.page(),
                page.size(),
                slice.total());
    }

    @Transactional(readOnly = true)
    public SaleViews.OneResponse read(AccountPrincipal actor, String id) {
        require(actor, SaleReturnRules.READ, "Sales cannot be read");
        UUID pharmacyId = actor.pharmacyId();
        return bills.bill(pharmacyId, id, false)
                .map(bill -> new SaleViews.OneResponse(saleDocument(bill, bills.lines(pharmacyId, bill.number()))))
                .or(() -> bills.returned(pharmacyId, id)
                        .map(row -> new SaleViews.OneResponse(
                                returnDocument(row, bills.returnLines(pharmacyId, row.code())))))
                .orElseThrow(() -> missing("Sale was not found"));
    }

    @Transactional
    public SaleViews.OneResponse createReturn(AccountPrincipal actor, String invoiceNumber, JsonNode body) {
        require(actor, SaleReturnRules.RETURN, "Sales cannot be returned");
        UUID pharmacyId = actor.pharmacyId();
        if (!stock.lockPharmacy(pharmacyId)) {
            throw missing("Pharmacy was not found");
        }
        BillStore.BillRow bill =
                bills.bill(pharmacyId, invoiceNumber, true).orElseThrow(() -> missing("Sale was not found"));
        SaleReturnRules.Prepared prepared = SaleReturnRules.prepare(body);
        if (prepared.problem() != null) {
            throw problem(prepared.problem());
        }
        List<BillStore.BillLineRow> stored = bills.lines(pharmacyId, bill.number());
        List<SaleReturnRules.SoldLine> sold = new ArrayList<>();
        Map<Integer, BillStore.BillLineRow> byPosition = new HashMap<>();
        for (BillStore.BillLineRow line : stored) {
            sold.add(new SaleReturnRules.SoldLine(
                    line.position(),
                    line.productId(),
                    line.batchNo(),
                    line.qty(),
                    line.returnedQty(),
                    line.unitPrice()));
            byPosition.put(line.position(), line);
        }
        SaleReturnRules.Quote quote = SaleReturnRules.quote(sold, bill.extraAmount(), prepared.lines());
        if (quote.problem() != null) {
            throw problem(quote.problem());
        }
        for (SaleReturnRules.QuotedLine line : quote.lines()) {
            if (!stock.increment(pharmacyId, line.productId(), line.batchNo(), line.qty())) {
                throw missing("Batch was not found");
            }
            if (bills.addReturned(pharmacyId, bill.number(), line.position(), line.qty()) != 1) {
                throw problem("Return is more than the quantity sold");
            }
        }
        String code = SaleReturnRules.nextCode(bills.returnCodes(pharmacyId));
        Instant recordedAt = Instant.now();
        bills.insertReturn(pharmacyId, code, bill.number(), recordedAt, quote.amount());
        List<SaleViews.LineView> lines = new ArrayList<>();
        int position = 0;
        for (SaleReturnRules.QuotedLine line : quote.lines()) {
            bills.insertReturnLine(pharmacyId, code, position, line);
            BillStore.BillLineRow source = byPosition.get(line.position());
            lines.add(new SaleViews.LineView(
                    position,
                    null,
                    source.name(),
                    null,
                    source.batchNo(),
                    source.expiry(),
                    line.qty(),
                    null,
                    null,
                    null,
                    null,
                    money(line.amount()).toPlainString()));
            position++;
        }
        return new SaleViews.OneResponse(new SaleViews.DocumentView(
                "return",
                code,
                bill.number(),
                bill.patientName(),
                bill.patientPhone(),
                null,
                null,
                null,
                recordedAt,
                null,
                null,
                null,
                null,
                null,
                null,
                money(quote.amount()).toPlainString(),
                lines));
    }

    private static SaleViews.DocumentView saleDocument(BillStore.BillRow bill, List<BillStore.BillLineRow> lines) {
        List<BigDecimal> nets = new ArrayList<>();
        for (BillStore.BillLineRow line : lines) {
            nets.add(money(line.unitPrice().multiply(BigDecimal.valueOf(line.qty()))));
        }
        List<BigDecimal> shares = SaleReturnRules.extraShares(nets, bill.extraAmount());
        List<SaleViews.LineView> views = new ArrayList<>();
        for (int index = 0; index < lines.size(); index++) {
            BillStore.BillLineRow line = lines.get(index);
            views.add(new SaleViews.LineView(
                    line.position(),
                    line.productId(),
                    line.name(),
                    line.composition(),
                    line.batchNo(),
                    line.expiry(),
                    line.qty(),
                    line.returnedQty(),
                    money(line.mrp()).toPlainString(),
                    money(line.unitPrice()).toPlainString(),
                    line.gst(),
                    money(nets.get(index).subtract(shares.get(index))).toPlainString()));
        }
        return new SaleViews.DocumentView(
                "sale",
                bill.number(),
                bill.number(),
                bill.patientName(),
                bill.patientPhone(),
                bill.prescribedBy(),
                bill.prescriptionNumber(),
                bill.payMode(),
                bill.soldAt(),
                money(bill.subtotal()).toPlainString(),
                money(bill.discount()).toPlainString(),
                money(bill.payable()).toPlainString(),
                bill.extraType(),
                money(bill.extraValue()).toPlainString(),
                money(bill.extraAmount()).toPlainString(),
                money(bill.payable()).toPlainString(),
                views);
    }

    private static SaleViews.DocumentView returnDocument(BillStore.ReturnRow row, List<BillStore.ReturnLineRow> lines) {
        List<SaleViews.LineView> views = new ArrayList<>();
        for (BillStore.ReturnLineRow line : lines) {
            views.add(new SaleViews.LineView(
                    line.position(),
                    null,
                    line.name(),
                    null,
                    line.batchNo(),
                    line.expiry(),
                    line.qty(),
                    null,
                    null,
                    null,
                    null,
                    money(line.amount()).toPlainString()));
        }
        return new SaleViews.DocumentView(
                "return",
                row.code(),
                row.billNumber(),
                row.patientName(),
                row.patientPhone(),
                null,
                null,
                null,
                row.recordedAt(),
                null,
                null,
                null,
                null,
                null,
                null,
                money(row.amount()).toPlainString(),
                views);
    }

    private static BigDecimal money(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
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

    private static ApiProblem problem(String detail) {
        return new ApiProblem(HttpStatus.BAD_REQUEST, "Bad request", detail);
    }

    private static ApiProblem missing(String detail) {
        return new ApiProblem(HttpStatus.NOT_FOUND, "Not found", detail);
    }
}
