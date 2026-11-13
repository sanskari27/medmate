package com.medmate.server.billing.store;

import com.medmate.server.billing.PatientBills;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
@Profile({"local", "prod", "identity-it"})
public class JdbcPatientBills implements PatientBills {

    private final JdbcClient jdbc;

    public JdbcPatientBills(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public List<Sale> sales(UUID pharmacyId) {
        return jdbc.sql(
                        """
                        SELECT b.number, b.patient_name, b.patient_phone, b.pay_mode, b.sold_at, b.payable,
                               COALESCE(SUM(l.qty), 0) AS units, b.prescribed_by IS NOT NULL AS rx
                        FROM bill b
                        LEFT JOIN bill_line l ON l.pharmacy_id = b.pharmacy_id AND l.bill_number = b.number
                        WHERE b.pharmacy_id = :pharmacy
                        GROUP BY b.pharmacy_id, b.number
                        """)
                .param("pharmacy", pharmacyId)
                .query(JdbcPatientBills::sale)
                .list();
    }

    @Override
    public List<Refund> refunds(UUID pharmacyId) {
        return jdbc.sql(
                        """
                        SELECT code, bill_number, amount, recorded_at
                        FROM sale_return
                        WHERE pharmacy_id = :pharmacy
                        """)
                .param("pharmacy", pharmacyId)
                .query(JdbcPatientBills::refund)
                .list();
    }

    private static Sale sale(ResultSet row, int number) throws SQLException {
        return new Sale(
                row.getString("number"),
                row.getString("patient_name"),
                row.getString("patient_phone"),
                row.getString("pay_mode"),
                instant(row, "sold_at"),
                row.getBigDecimal("payable"),
                row.getInt("units"),
                row.getBoolean("rx"));
    }

    private static Refund refund(ResultSet row, int number) throws SQLException {
        return new Refund(
                row.getString("code"),
                row.getString("bill_number"),
                row.getBigDecimal("amount"),
                instant(row, "recorded_at"));
    }

    private static Instant instant(ResultSet row, String column) throws SQLException {
        Timestamp stamp = row.getTimestamp(column);
        return stamp.toInstant();
    }
}
