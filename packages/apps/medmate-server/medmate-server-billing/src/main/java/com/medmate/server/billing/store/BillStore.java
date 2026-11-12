package com.medmate.server.billing.store;

import com.medmate.server.billing.BillRules;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.Instant;
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
}
