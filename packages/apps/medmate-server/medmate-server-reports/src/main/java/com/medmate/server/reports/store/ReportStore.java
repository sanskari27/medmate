package com.medmate.server.reports.store;

import com.medmate.server.reports.ReportBooks;
import com.medmate.server.reports.ReportRules;
import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
@Profile({"local", "prod", "identity-it"})
public class ReportStore {

    private final JdbcClient jdbc;

    public ReportStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public ReportBooks load(UUID pharmacyId) {
        Map<String, List<ReportBooks.BillLine>> lines = billLines(pharmacyId);
        Map<String, BigDecimal> rates = batchRates(pharmacyId);
        List<ReportBooks.Bill> bills = new ArrayList<>();
        jdbc.sql(
                        """
                        SELECT number, patient_name, patient_phone, pay_mode, sold_at, extra_amount, payable
                        FROM bill WHERE pharmacy_id = :id
                        ORDER BY sold_at, number
                        """)
                .param("id", pharmacyId)
                .query((row, number) -> bill(row, lines, rates))
                .list()
                .forEach(bills::add);
        Map<String, List<ReportBooks.SaleReturnLine>> returnLines = saleReturnLines(pharmacyId);
        List<ReportBooks.SaleReturn> saleReturns = jdbc.sql(
                        """
                        SELECT code, bill_number, recorded_at, amount
                        FROM sale_return WHERE pharmacy_id = :id
                        """)
                .param("id", pharmacyId)
                .query((row, number) -> saleReturn(row, returnLines))
                .list();
        Map<String, List<ReportBooks.PurchaseLine>> purchaseLines = purchaseLines(pharmacyId);
        List<ReportBooks.Purchase> purchases = jdbc.sql(
                        """
                        SELECT purchase.code, distributor.name, purchase.invoice_no, purchase.recorded_at, purchase.ledger_amount
                        FROM purchase
                        JOIN distributor
                          ON distributor.pharmacy_id = purchase.pharmacy_id
                         AND distributor.code = purchase.distributor_code
                        WHERE purchase.pharmacy_id = :id
                        """)
                .param("id", pharmacyId)
                .query((row, number) -> purchase(row, purchaseLines))
                .list();
        Map<String, List<ReportBooks.PurchaseReturnLine>> purchaseReturnLines = purchaseReturnLines(pharmacyId);
        List<ReportBooks.PurchaseReturn> purchaseReturns = jdbc.sql(
                        """
                        SELECT code, purchase_code, recorded_at, ledger_amount
                        FROM purchase_return WHERE pharmacy_id = :id
                        """)
                .param("id", pharmacyId)
                .query((row, number) -> purchaseReturn(row, purchaseReturnLines))
                .list();
        List<ReportBooks.Expense> expenses = jdbc.sql(
                        """
                        SELECT number, spent_on, party, category, payment_mode, amount, gst
                        FROM expense WHERE pharmacy_id = :id
                        """)
                .param("id", pharmacyId)
                .query(this::expense)
                .list();
        List<ReportBooks.Repayment> repayments = jdbc.sql(
                        """
                        SELECT code, phone, amount, mode, recorded_at
                        FROM credit_repayment WHERE pharmacy_id = :id
                        """)
                .param("id", pharmacyId)
                .query(this::repayment)
                .list();
        List<ReportBooks.Payment> payments = jdbc.sql(
                        """
                        SELECT txn.code, distributor.name, txn.amount, txn.mode, txn.recorded_at
                        FROM distributor_transaction txn
                        JOIN distributor
                          ON distributor.pharmacy_id = txn.pharmacy_id
                         AND distributor.code = txn.distributor_code
                        WHERE txn.pharmacy_id = :id AND txn.type = 'payment'
                        """)
                .param("id", pharmacyId)
                .query(this::payment)
                .list();
        Map<String, List<ReportBooks.Batch>> batches = batches(pharmacyId);
        List<ReportBooks.Product> products = jdbc.sql(
                        """
                        SELECT product_id, name, pack, product_type, reorder_level, rack
                        FROM inventory_product WHERE pharmacy_id = :id
                        """)
                .param("id", pharmacyId)
                .query((row, number) -> product(row, batches))
                .list();
        List<ReportBooks.Offer> offers = jdbc.sql(
                        """
                        SELECT code, discount_type, discount_value, scope, product_id
                        FROM offer WHERE pharmacy_id = :id AND active = TRUE
                        """)
                .param("id", pharmacyId)
                .query(this::offer)
                .list();
        return new ReportBooks(
                bills, saleReturns, purchases, purchaseReturns, expenses, repayments, payments, products, offers);
    }

    private Map<String, List<ReportBooks.BillLine>> billLines(UUID pharmacyId) {
        Map<String, List<ReportBooks.BillLine>> lines = new LinkedHashMap<>();
        jdbc.sql(
                        """
                        SELECT bill_number, position, product_id, name, batch_no, qty, returned_qty, unit_price, gst
                        FROM bill_line WHERE pharmacy_id = :id
                        ORDER BY bill_number, position
                        """)
                .param("id", pharmacyId)
                .query((row, number) -> {
                    lines.computeIfAbsent(row.getString("bill_number"), ignored -> new ArrayList<>())
                            .add(new ReportBooks.BillLine(
                                    row.getInt("position"),
                                    row.getString("product_id"),
                                    row.getString("name"),
                                    row.getString("batch_no"),
                                    row.getInt("qty"),
                                    row.getInt("returned_qty"),
                                    row.getBigDecimal("unit_price"),
                                    row.getInt("gst"),
                                    null));
                    return 1;
                })
                .list();
        return lines;
    }

    private Map<String, BigDecimal> batchRates(UUID pharmacyId) {
        Map<String, BigDecimal> rates = new LinkedHashMap<>();
        jdbc.sql(
                        """
                        SELECT product_id, batch_no, rate FROM inventory_batch WHERE pharmacy_id = :id
                        """)
                .param("id", pharmacyId)
                .query((row, number) -> {
                    rates.put(
                            row.getString("product_id") + "\n" + row.getString("batch_no"), row.getBigDecimal("rate"));
                    return 1;
                })
                .list();
        return rates;
    }

    private ReportBooks.Bill bill(
            ResultSet row, Map<String, List<ReportBooks.BillLine>> lines, Map<String, BigDecimal> rates)
            throws SQLException {
        String number = row.getString("number");
        List<ReportBooks.BillLine> source = lines.getOrDefault(number, List.of());
        List<ReportBooks.BillLine> priced = new ArrayList<>();
        for (ReportBooks.BillLine line : source) {
            priced.add(new ReportBooks.BillLine(
                    line.position(),
                    line.productId(),
                    line.name(),
                    line.batchNo(),
                    line.qty(),
                    line.returnedQty(),
                    line.unitPrice(),
                    line.gst(),
                    rates.get(line.productId() + "\n" + line.batchNo())));
        }
        Instant soldAt = instant(row, "sold_at");
        return new ReportBooks.Bill(
                number,
                row.getString("patient_name"),
                row.getString("patient_phone"),
                row.getString("pay_mode"),
                soldAt,
                day(soldAt),
                row.getBigDecimal("extra_amount"),
                row.getBigDecimal("payable"),
                priced);
    }

    private Map<String, List<ReportBooks.SaleReturnLine>> saleReturnLines(UUID pharmacyId) {
        Map<String, List<ReportBooks.SaleReturnLine>> lines = new LinkedHashMap<>();
        jdbc.sql(
                        """
                        SELECT return_code, bill_position, qty, amount
                        FROM sale_return_line WHERE pharmacy_id = :id
                        ORDER BY return_code, position
                        """)
                .param("id", pharmacyId)
                .query((row, number) -> {
                    lines.computeIfAbsent(row.getString("return_code"), ignored -> new ArrayList<>())
                            .add(new ReportBooks.SaleReturnLine(
                                    row.getInt("bill_position"), row.getInt("qty"), row.getBigDecimal("amount")));
                    return 1;
                })
                .list();
        return lines;
    }

    private ReportBooks.SaleReturn saleReturn(ResultSet row, Map<String, List<ReportBooks.SaleReturnLine>> lines)
            throws SQLException {
        Instant at = instant(row, "recorded_at");
        String code = row.getString("code");
        return new ReportBooks.SaleReturn(
                code,
                row.getString("bill_number"),
                at,
                day(at),
                row.getBigDecimal("amount"),
                lines.getOrDefault(code, List.of()));
    }

    private Map<String, List<ReportBooks.PurchaseLine>> purchaseLines(UUID pharmacyId) {
        Map<String, List<ReportBooks.PurchaseLine>> lines = new LinkedHashMap<>();
        jdbc.sql(
                        """
                        SELECT purchase_code, position, product_id, name, qty, rate, mrp, gst
                        FROM purchase_line WHERE pharmacy_id = :id
                        ORDER BY purchase_code, position
                        """)
                .param("id", pharmacyId)
                .query((row, number) -> {
                    lines.computeIfAbsent(row.getString("purchase_code"), ignored -> new ArrayList<>())
                            .add(new ReportBooks.PurchaseLine(
                                    row.getInt("position"),
                                    row.getString("product_id"),
                                    row.getString("name"),
                                    row.getInt("qty"),
                                    row.getBigDecimal("rate"),
                                    row.getBigDecimal("mrp"),
                                    row.getInt("gst")));
                    return 1;
                })
                .list();
        return lines;
    }

    private ReportBooks.Purchase purchase(ResultSet row, Map<String, List<ReportBooks.PurchaseLine>> lines)
            throws SQLException {
        Instant at = instant(row, "recorded_at");
        String code = row.getString("code");
        return new ReportBooks.Purchase(
                code,
                row.getString("name"),
                row.getString("invoice_no"),
                at,
                day(at),
                row.getInt("ledger_amount"),
                lines.getOrDefault(code, List.of()));
    }

    private Map<String, List<ReportBooks.PurchaseReturnLine>> purchaseReturnLines(UUID pharmacyId) {
        Map<String, List<ReportBooks.PurchaseReturnLine>> lines = new LinkedHashMap<>();
        jdbc.sql(
                        """
                        SELECT return_code, position, qty FROM purchase_return_line WHERE pharmacy_id = :id
                        """)
                .param("id", pharmacyId)
                .query((row, number) -> {
                    lines.computeIfAbsent(row.getString("return_code"), ignored -> new ArrayList<>())
                            .add(new ReportBooks.PurchaseReturnLine(row.getInt("position"), row.getInt("qty")));
                    return 1;
                })
                .list();
        return lines;
    }

    private ReportBooks.PurchaseReturn purchaseReturn(
            ResultSet row, Map<String, List<ReportBooks.PurchaseReturnLine>> lines) throws SQLException {
        Instant at = instant(row, "recorded_at");
        String code = row.getString("code");
        return new ReportBooks.PurchaseReturn(
                code,
                row.getString("purchase_code"),
                at,
                day(at),
                row.getInt("ledger_amount"),
                lines.getOrDefault(code, List.of()));
    }

    private ReportBooks.Expense expense(ResultSet row, int number) throws SQLException {
        return new ReportBooks.Expense(
                row.getString("number"),
                row.getDate("spent_on").toLocalDate(),
                row.getString("party"),
                row.getString("category"),
                row.getString("payment_mode"),
                row.getBigDecimal("amount"),
                row.getInt("gst"));
    }

    private ReportBooks.Repayment repayment(ResultSet row, int number) throws SQLException {
        Instant at = instant(row, "recorded_at");
        return new ReportBooks.Repayment(
                row.getString("code"),
                row.getString("phone"),
                at,
                day(at),
                row.getBigDecimal("amount"),
                row.getString("mode"));
    }

    private ReportBooks.Payment payment(ResultSet row, int number) throws SQLException {
        Instant at = instant(row, "recorded_at");
        return new ReportBooks.Payment(
                row.getString("code"),
                row.getString("name"),
                at,
                day(at),
                BigDecimal.valueOf(row.getInt("amount")),
                row.getString("mode"));
    }

    private Map<String, List<ReportBooks.Batch>> batches(UUID pharmacyId) {
        Map<String, List<ReportBooks.Batch>> batches = new LinkedHashMap<>();
        jdbc.sql(
                        """
                        SELECT product_id, batch_no, expiry, qty, rate, mrp, gst
                        FROM inventory_batch WHERE pharmacy_id = :id
                        """)
                .param("id", pharmacyId)
                .query((row, number) -> {
                    Object gst = row.getObject("gst");
                    batches.computeIfAbsent(row.getString("product_id"), ignored -> new ArrayList<>())
                            .add(new ReportBooks.Batch(
                                    row.getString("batch_no"),
                                    row.getString("expiry"),
                                    row.getInt("qty"),
                                    row.getBigDecimal("rate"),
                                    row.getBigDecimal("mrp"),
                                    gst == null ? null : ((Number) gst).intValue()));
                    return 1;
                })
                .list();
        return batches;
    }

    private ReportBooks.Product product(ResultSet row, Map<String, List<ReportBooks.Batch>> batches)
            throws SQLException {
        String id = row.getString("product_id");
        return new ReportBooks.Product(
                id,
                row.getString("name"),
                row.getString("pack"),
                row.getString("product_type"),
                row.getInt("reorder_level"),
                row.getString("rack"),
                batches.getOrDefault(id, List.of()));
    }

    private ReportBooks.Offer offer(ResultSet row, int number) throws SQLException {
        return new ReportBooks.Offer(
                row.getString("code"),
                row.getString("discount_type"),
                row.getBigDecimal("discount_value"),
                row.getString("scope"),
                row.getString("product_id"));
    }

    private static Instant instant(ResultSet row, String column) throws SQLException {
        Timestamp timestamp = row.getTimestamp(column);
        return timestamp.toInstant();
    }

    private static LocalDate day(Instant instant) {
        return instant.atZone(ReportRules.ZONE).toLocalDate();
    }
}
