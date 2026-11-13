package com.medmate.server.billing.store;

import com.medmate.server.billing.BillRules;
import com.medmate.server.billing.SaleReturnRules;
import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
@Profile({"local", "prod", "identity-it"})
public class BillStore {

    private final JdbcClient jdbc;

    public BillStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public int allocate(UUID pharmacyId) {
        Optional<Integer> current = jdbc.sql("SELECT last_number FROM bill_counter WHERE pharmacy_id = :id FOR UPDATE")
                .param("id", pharmacyId)
                .query(Integer.class)
                .optional();
        int next = current.map(number -> number + 1).orElse(1);
        if (current.isEmpty()) {
            jdbc.sql("INSERT INTO bill_counter (pharmacy_id, last_number) VALUES (:id, :number)")
                    .param("id", pharmacyId)
                    .param("number", next)
                    .update();
        } else {
            jdbc.sql("UPDATE bill_counter SET last_number = :number WHERE pharmacy_id = :id")
                    .param("id", pharmacyId)
                    .param("number", next)
                    .update();
        }
        return next;
    }

    public void insert(
            UUID pharmacyId,
            String number,
            String patientName,
            String patientPhone,
            String prescribedBy,
            String prescriptionNumber,
            Instant soldAt,
            BigDecimal subtotal,
            BigDecimal discount,
            BigDecimal payable,
            String extraType,
            BigDecimal extraValue,
            BigDecimal extraAmount) {
        jdbc.sql(
                        """
                        INSERT INTO bill (
                          pharmacy_id, number, patient_name, patient_phone, prescribed_by, prescription_number,
                          pay_mode, sold_at, subtotal, discount, payable, extra_type, extra_value, extra_amount)
                        VALUES (
                          :pharmacy, :number, :name, :phone, :doctor, :prescription,
                          'cash', :sold, :subtotal, :discount, :payable, :extraType, :extraValue, :extraAmount)
                        """)
                .param("pharmacy", pharmacyId)
                .param("number", number)
                .param("name", patientName)
                .param("phone", patientPhone)
                .param("doctor", prescribedBy, Types.VARCHAR)
                .param("prescription", prescriptionNumber, Types.VARCHAR)
                .param("sold", Timestamp.from(soldAt))
                .param("subtotal", subtotal)
                .param("discount", discount)
                .param("payable", payable)
                .param("extraType", extraType)
                .param("extraValue", extraValue)
                .param("extraAmount", extraAmount)
                .update();
    }

    public void insertLine(UUID pharmacyId, String number, int position, BillRules.PricedLine line) {
        jdbc.sql(
                        """
                        INSERT INTO bill_line (
                          pharmacy_id, bill_number, position, product_id, name, composition, batch_no, expiry,
                          qty, mrp, unit_price, gst, offer_id, offer_title, discount)
                        VALUES (
                          :pharmacy, :number, :position, :product, :name, :composition, :batch, :expiry,
                          :qty, :mrp, :price, :gst, :offer, :title, :discount)
                        """)
                .param("pharmacy", pharmacyId)
                .param("number", number)
                .param("position", position)
                .param("product", line.productId())
                .param("name", line.name())
                .param("composition", line.composition(), Types.VARCHAR)
                .param("batch", line.batchNo())
                .param("expiry", line.expiry())
                .param("qty", line.qty())
                .param("mrp", line.mrp())
                .param("price", line.unitPrice())
                .param("gst", line.gst())
                .param("offer", line.offerId(), Types.VARCHAR)
                .param("title", line.offerTitle(), Types.VARCHAR)
                .param("discount", line.discount())
                .update();
    }

    public List<BillRow> bills(UUID pharmacyId) {
        return jdbc.sql(
                        """
                        SELECT number, patient_name, patient_phone, prescribed_by, prescription_number, pay_mode,
                          sold_at, subtotal, discount, payable, extra_type, extra_value, extra_amount
                        FROM bill WHERE pharmacy_id = :pharmacy
                        """)
                .param("pharmacy", pharmacyId)
                .query(this::bill)
                .list();
    }

    public Optional<BillRow> bill(UUID pharmacyId, String number, boolean lock) {
        String sql = lock
                ? """
                SELECT number, patient_name, patient_phone, prescribed_by, prescription_number, pay_mode,
                  sold_at, subtotal, discount, payable, extra_type, extra_value, extra_amount
                FROM bill WHERE pharmacy_id = :pharmacy AND number = :number FOR UPDATE
                """
                : """
                SELECT number, patient_name, patient_phone, prescribed_by, prescription_number, pay_mode,
                  sold_at, subtotal, discount, payable, extra_type, extra_value, extra_amount
                FROM bill WHERE pharmacy_id = :pharmacy AND number = :number
                """;
        return jdbc.sql(sql)
                .param("pharmacy", pharmacyId)
                .param("number", number)
                .query(this::bill)
                .optional();
    }

    public List<BillLineRow> lines(UUID pharmacyId, String number) {
        return jdbc.sql(
                        """
                        SELECT position, product_id, name, composition, batch_no, expiry, qty, returned_qty,
                          mrp, unit_price, gst
                        FROM bill_line
                        WHERE pharmacy_id = :pharmacy AND bill_number = :number
                        ORDER BY position
                        """)
                .param("pharmacy", pharmacyId)
                .param("number", number)
                .query(this::line)
                .list();
    }

    public List<ItemCount> billItems(UUID pharmacyId) {
        return jdbc.sql(
                        """
                        SELECT bill_number AS code, COALESCE(SUM(qty), 0) AS items
                        FROM bill_line WHERE pharmacy_id = :pharmacy GROUP BY bill_number
                        """)
                .param("pharmacy", pharmacyId)
                .query(this::items)
                .list();
    }

    public List<ReturnRow> returns(UUID pharmacyId) {
        return jdbc.sql(
                        """
                        SELECT r.code, r.bill_number, b.patient_name, b.patient_phone, r.recorded_at, r.amount
                        FROM sale_return r
                        JOIN bill b ON b.pharmacy_id = r.pharmacy_id AND b.number = r.bill_number
                        WHERE r.pharmacy_id = :pharmacy
                        """)
                .param("pharmacy", pharmacyId)
                .query(this::returned)
                .list();
    }

    public Optional<ReturnRow> returned(UUID pharmacyId, String code) {
        return jdbc.sql(
                        """
                        SELECT r.code, r.bill_number, b.patient_name, b.patient_phone, r.recorded_at, r.amount
                        FROM sale_return r
                        JOIN bill b ON b.pharmacy_id = r.pharmacy_id AND b.number = r.bill_number
                        WHERE r.pharmacy_id = :pharmacy AND r.code = :code
                        """)
                .param("pharmacy", pharmacyId)
                .param("code", code)
                .query(this::returned)
                .optional();
    }

    public List<ReturnLineRow> returnLines(UUID pharmacyId, String code) {
        return jdbc.sql(
                        """
                        SELECT l.position, bl.name, bl.batch_no, bl.expiry, l.qty, l.amount
                        FROM sale_return_line l
                        JOIN sale_return r
                          ON r.pharmacy_id = l.pharmacy_id AND r.code = l.return_code
                        JOIN bill_line bl
                          ON bl.pharmacy_id = l.pharmacy_id
                         AND bl.bill_number = r.bill_number
                         AND bl.position = l.bill_position
                        WHERE l.pharmacy_id = :pharmacy AND l.return_code = :code
                        ORDER BY l.position
                        """)
                .param("pharmacy", pharmacyId)
                .param("code", code)
                .query(this::returnLine)
                .list();
    }

    public record SaleListRow(
            String id,
            String type,
            String invoiceNumber,
            String patientName,
            Instant recordedAt,
            int items,
            BigDecimal amount) {}

    public record SalePage(List<SaleListRow> rows, int total) {}

    public record SaleMonth(BigDecimal sales, int saleCount, BigDecimal returned, int returnCount) {}

    public SalePage salePage(UUID pharmacyId, String pattern, int limit, int offset) {
        int total = jdbc.sql("SELECT COUNT(*) FROM (" + saleUnion() + ") rows " + saleMatch())
                .param("pharmacy", pharmacyId)
                .param("pattern", pattern)
                .query(Integer.class)
                .single();
        List<SaleListRow> rows = jdbc.sql(
                        "SELECT id, type, invoice_number, patient_name, recorded_at, items, amount FROM ("
                                + saleUnion()
                                + ") rows "
                                + saleMatch()
                                + " ORDER BY recorded_at DESC, id DESC LIMIT :limit OFFSET :offset")
                .param("pharmacy", pharmacyId)
                .param("pattern", pattern)
                .param("limit", limit)
                .param("offset", offset)
                .query(this::saleListRow)
                .list();
        return new SalePage(rows, total);
    }

    public SaleMonth saleMonth(UUID pharmacyId, Instant start, Instant end) {
        MonthPart sales = month(
                """
                SELECT COALESCE(SUM(payable), 0) AS amount, COUNT(*) AS counted
                FROM bill
                WHERE pharmacy_id = :pharmacy AND sold_at >= :start AND sold_at < :end
                """,
                pharmacyId,
                start,
                end);
        MonthPart returned = month(
                """
                SELECT COALESCE(SUM(amount), 0) AS amount, COUNT(*) AS counted
                FROM sale_return
                WHERE pharmacy_id = :pharmacy AND recorded_at >= :start AND recorded_at < :end
                """,
                pharmacyId,
                start,
                end);
        return new SaleMonth(sales.amount(), sales.count(), returned.amount(), returned.count());
    }

    public List<ItemCount> returnItems(UUID pharmacyId) {
        return jdbc.sql(
                        """
                        SELECT return_code AS code, COALESCE(SUM(qty), 0) AS items
                        FROM sale_return_line WHERE pharmacy_id = :pharmacy GROUP BY return_code
                        """)
                .param("pharmacy", pharmacyId)
                .query(this::items)
                .list();
    }

    public List<String> returnCodes(UUID pharmacyId) {
        return jdbc.sql("SELECT code FROM sale_return WHERE pharmacy_id = :pharmacy")
                .param("pharmacy", pharmacyId)
                .query(String.class)
                .list();
    }

    public void insertReturn(UUID pharmacyId, String code, String billNumber, Instant recordedAt, BigDecimal amount) {
        jdbc.sql(
                        """
                        INSERT INTO sale_return (pharmacy_id, code, bill_number, recorded_at, amount)
                        VALUES (:pharmacy, :code, :bill, :recorded, :amount)
                        """)
                .param("pharmacy", pharmacyId)
                .param("code", code)
                .param("bill", billNumber)
                .param("recorded", Timestamp.from(recordedAt))
                .param("amount", amount)
                .update();
    }

    public void insertReturnLine(UUID pharmacyId, String code, int position, SaleReturnRules.QuotedLine line) {
        jdbc.sql(
                        """
                        INSERT INTO sale_return_line (pharmacy_id, return_code, position, bill_position, qty, amount)
                        VALUES (:pharmacy, :code, :position, :billPosition, :qty, :amount)
                        """)
                .param("pharmacy", pharmacyId)
                .param("code", code)
                .param("position", position)
                .param("billPosition", line.position())
                .param("qty", line.qty())
                .param("amount", line.amount())
                .update();
    }

    public int addReturned(UUID pharmacyId, String number, int position, int qty) {
        return jdbc.sql(
                        """
                        UPDATE bill_line
                        SET returned_qty = returned_qty + :qty
                        WHERE pharmacy_id = :pharmacy AND bill_number = :number AND position = :position
                          AND returned_qty + :qty <= qty
                        """)
                .param("pharmacy", pharmacyId)
                .param("number", number)
                .param("position", position)
                .param("qty", qty)
                .update();
    }

    private static String saleUnion() {
        return """
                SELECT b.number AS id, 'sale' AS type, b.number AS invoice_number, b.patient_name,
                       b.sold_at AS recorded_at,
                       COALESCE((SELECT SUM(qty) FROM bill_line l
                                 WHERE l.pharmacy_id = b.pharmacy_id AND l.bill_number = b.number), 0) AS items,
                       b.payable AS amount
                FROM bill b
                WHERE b.pharmacy_id = :pharmacy
                UNION ALL
                SELECT r.code, 'return', r.bill_number, b.patient_name, r.recorded_at,
                       COALESCE((SELECT SUM(qty) FROM sale_return_line l
                                 WHERE l.pharmacy_id = r.pharmacy_id AND l.return_code = r.code), 0),
                       r.amount
                FROM sale_return r
                JOIN bill b ON b.pharmacy_id = r.pharmacy_id AND b.number = r.bill_number
                WHERE r.pharmacy_id = :pharmacy
                """;
    }

    private static String saleMatch() {
        return """
                WHERE (
                  CAST(:pattern AS text) = ''
                  OR lower(id) LIKE :pattern ESCAPE '\\'
                  OR lower(invoice_number) LIKE :pattern ESCAPE '\\'
                  OR lower(patient_name) LIKE :pattern ESCAPE '\\'
                  OR lower(type) LIKE :pattern ESCAPE '\\'
                )
                """;
    }

    private SaleListRow saleListRow(ResultSet row, int number) throws SQLException {
        return new SaleListRow(
                row.getString("id"),
                row.getString("type"),
                row.getString("invoice_number"),
                row.getString("patient_name"),
                row.getTimestamp("recorded_at").toInstant(),
                row.getInt("items"),
                row.getBigDecimal("amount"));
    }

    private MonthPart month(String sql, UUID pharmacyId, Instant start, Instant end) {
        return jdbc.sql(sql)
                .param("pharmacy", pharmacyId)
                .param("start", Timestamp.from(start))
                .param("end", Timestamp.from(end))
                .query((row, number) -> new MonthPart(row.getBigDecimal("amount"), row.getInt("counted")))
                .single();
    }

    private record MonthPart(BigDecimal amount, int count) {}

    private BillRow bill(ResultSet row, int number) throws SQLException {
        return new BillRow(
                row.getString("number"),
                row.getString("patient_name"),
                row.getString("patient_phone"),
                row.getString("prescribed_by"),
                row.getString("prescription_number"),
                row.getString("pay_mode"),
                row.getTimestamp("sold_at").toInstant(),
                row.getBigDecimal("subtotal"),
                row.getBigDecimal("discount"),
                row.getBigDecimal("payable"),
                row.getString("extra_type"),
                row.getBigDecimal("extra_value"),
                row.getBigDecimal("extra_amount"));
    }

    private BillLineRow line(ResultSet row, int number) throws SQLException {
        return new BillLineRow(
                row.getInt("position"),
                row.getString("product_id"),
                row.getString("name"),
                row.getString("composition"),
                row.getString("batch_no"),
                row.getString("expiry"),
                row.getInt("qty"),
                row.getInt("returned_qty"),
                row.getBigDecimal("mrp"),
                row.getBigDecimal("unit_price"),
                row.getInt("gst"));
    }

    private ReturnRow returned(ResultSet row, int number) throws SQLException {
        return new ReturnRow(
                row.getString("code"),
                row.getString("bill_number"),
                row.getString("patient_name"),
                row.getString("patient_phone"),
                row.getTimestamp("recorded_at").toInstant(),
                row.getBigDecimal("amount"));
    }

    private ReturnLineRow returnLine(ResultSet row, int number) throws SQLException {
        return new ReturnLineRow(
                row.getInt("position"),
                row.getString("name"),
                row.getString("batch_no"),
                row.getString("expiry"),
                row.getInt("qty"),
                row.getBigDecimal("amount"));
    }

    private ItemCount items(ResultSet row, int number) throws SQLException {
        return new ItemCount(row.getString("code"), row.getInt("items"));
    }

    public record BillRow(
            String number,
            String patientName,
            String patientPhone,
            String prescribedBy,
            String prescriptionNumber,
            String payMode,
            Instant soldAt,
            BigDecimal subtotal,
            BigDecimal discount,
            BigDecimal payable,
            String extraType,
            BigDecimal extraValue,
            BigDecimal extraAmount) {}

    public record BillLineRow(
            int position,
            String productId,
            String name,
            String composition,
            String batchNo,
            String expiry,
            int qty,
            int returnedQty,
            BigDecimal mrp,
            BigDecimal unitPrice,
            int gst) {}

    public record ReturnRow(
            String code,
            String billNumber,
            String patientName,
            String patientPhone,
            Instant recordedAt,
            BigDecimal amount) {}

    public record ReturnLineRow(int position, String name, String batchNo, String expiry, int qty, BigDecimal amount) {}

    public record ItemCount(String code, int items) {}
}
