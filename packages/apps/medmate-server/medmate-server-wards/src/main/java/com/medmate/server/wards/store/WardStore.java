package com.medmate.server.wards.store;

import com.medmate.server.wards.WardRules;
import java.math.BigDecimal;
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
public class WardStore {

    private final JdbcClient jdbc;

    public WardStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public record WardRow(
            UUID id,
            String name,
            String code,
            String floor,
            String category,
            int beds,
            String sister,
            BigDecimal dailyRate,
            int bedsHeld,
            boolean underMaintenance,
            String maintenanceNote) {}

    public record AdmissionRow(
            UUID id,
            UUID wardId,
            String wardName,
            String name,
            String uhid,
            String phone,
            Integer age,
            String gender,
            String bed,
            int bedNumber,
            String doctor,
            String diagnosis,
            String payerType,
            String insurer,
            String policyNo,
            Instant admittedAt,
            String status,
            Instant dischargedAt,
            BigDecimal settledAmount,
            String payMode,
            BigDecimal rateUsed,
            BigDecimal dailyRate) {}

    public boolean lockPharmacy(UUID pharmacyId) {
        return jdbc.sql("SELECT id FROM pharmacy WHERE id = :id FOR UPDATE")
                .param("id", pharmacyId)
                .query(UUID.class)
                .optional()
                .isPresent();
    }

    public boolean codeTaken(UUID pharmacyId, String codeKey, UUID exceptId) {
        String sql = exceptId == null
                ? "SELECT id FROM ward WHERE pharmacy_id = :pharmacy AND code_key = :code"
                : "SELECT id FROM ward WHERE pharmacy_id = :pharmacy AND code_key = :code AND id <> :except";
        JdbcClient.StatementSpec spec =
                jdbc.sql(sql).param("pharmacy", pharmacyId).param("code", codeKey);
        if (exceptId != null) {
            spec = spec.param("except", exceptId);
        }
        return spec.query(UUID.class).optional().isPresent();
    }

    public boolean uhidTaken(UUID pharmacyId, String uhidKey) {
        return jdbc.sql(
                        """
                        SELECT id FROM admission
                        WHERE pharmacy_id = :pharmacy AND uhid_key = :uhid AND status = 'admitted'
                        """)
                .param("pharmacy", pharmacyId)
                .param("uhid", uhidKey)
                .query(UUID.class)
                .optional()
                .isPresent();
    }

    public List<WardRow> listWards(UUID pharmacyId) {
        return jdbc.sql(wardSelect() + " WHERE pharmacy_id = :id ORDER BY lower(name), lower(code), id")
                .param("id", pharmacyId)
                .query(this::ward)
                .list();
    }

    public Optional<WardRow> findWard(UUID pharmacyId, UUID id) {
        return jdbc.sql(wardSelect() + " WHERE pharmacy_id = :pharmacy AND id = :id")
                .param("pharmacy", pharmacyId)
                .param("id", id)
                .query(this::ward)
                .optional();
    }

    public void insertWard(UUID id, UUID pharmacyId, WardRules.WardValues values) {
        bind(
                        jdbc.sql(
                                """
                        INSERT INTO ward (
                          id, pharmacy_id, name, code, code_key, floor, category, beds, sister, daily_rate,
                          beds_held, under_maintenance, maintenance_note)
                        VALUES (
                          :id, :pharmacy, :name, :code, :codeKey, :floor, :category, :beds, :sister, :dailyRate,
                          :bedsHeld, :underMaintenance, :maintenanceNote)
                        """),
                        id,
                        pharmacyId,
                        values)
                .update();
    }

    public void updateWard(UUID id, UUID pharmacyId, WardRules.WardValues values) {
        bind(
                        jdbc.sql(
                                """
                        UPDATE ward SET
                          name = :name, code = :code, code_key = :codeKey, floor = :floor, category = :category,
                          beds = :beds, sister = :sister, daily_rate = :dailyRate, beds_held = :bedsHeld,
                          under_maintenance = :underMaintenance, maintenance_note = :maintenanceNote
                        WHERE pharmacy_id = :pharmacy AND id = :id
                        """),
                        id,
                        pharmacyId,
                        values)
                .update();
    }

    public void rewriteBeds(UUID pharmacyId, UUID wardId, String code) {
        jdbc.sql(
                        """
                        UPDATE admission
                        SET bed = :code || '-' || bed_number
                        WHERE pharmacy_id = :pharmacy AND ward_id = :ward AND status = 'admitted'
                        """)
                .param("code", code)
                .param("pharmacy", pharmacyId)
                .param("ward", wardId)
                .update();
    }

    public List<Integer> occupiedNumbers(UUID pharmacyId, UUID wardId) {
        return jdbc.sql(
                        """
                        SELECT bed_number FROM admission
                        WHERE pharmacy_id = :pharmacy AND ward_id = :ward AND status = 'admitted'
                        """)
                .param("pharmacy", pharmacyId)
                .param("ward", wardId)
                .query((row, number) -> row.getInt("bed_number"))
                .list();
    }

    public boolean bedTaken(UUID pharmacyId, UUID wardId, int bedNumber, UUID exceptAdmission) {
        String sql = exceptAdmission == null
                ? """
                SELECT id FROM admission
                WHERE pharmacy_id = :pharmacy AND ward_id = :ward AND bed_number = :bed AND status = 'admitted'
                """
                : """
                SELECT id FROM admission
                WHERE pharmacy_id = :pharmacy AND ward_id = :ward AND bed_number = :bed
                  AND status = 'admitted' AND id <> :except
                """;
        JdbcClient.StatementSpec spec = jdbc.sql(sql)
                .param("pharmacy", pharmacyId)
                .param("ward", wardId)
                .param("bed", bedNumber);
        if (exceptAdmission != null) {
            spec = spec.param("except", exceptAdmission);
        }
        return spec.query(UUID.class).optional().isPresent();
    }

    public List<AdmissionRow> listAdmissions(UUID pharmacyId) {
        return jdbc.sql(admissionSelect()
                        + " WHERE a.pharmacy_id = :id AND a.status = 'admitted' ORDER BY a.admitted_at DESC, a.id")
                .param("id", pharmacyId)
                .query(this::admission)
                .list();
    }

    public Optional<AdmissionRow> findAdmission(UUID pharmacyId, UUID id) {
        return jdbc.sql(admissionSelect() + " WHERE a.pharmacy_id = :pharmacy AND a.id = :id")
                .param("pharmacy", pharmacyId)
                .param("id", id)
                .query(this::admission)
                .optional();
    }

    public void insertAdmission(
            UUID id, UUID pharmacyId, WardRules.AdmissionValues values, int bedNumber, String bed, Instant admittedAt) {
        jdbc.sql(
                        """
                        INSERT INTO admission (
                          id, pharmacy_id, ward_id, patient_name, uhid, uhid_key, phone, age, gender, bed, bed_number,
                          doctor, diagnosis, payer_type, insurer, policy_no, admitted_at, status)
                        VALUES (
                          :id, :pharmacy, :ward, :name, :uhid, :uhidKey, :phone, :age, :gender, :bed, :bedNumber,
                          :doctor, :diagnosis, :payer, :insurer, :policyNo, :admittedAt, 'admitted')
                        """)
                .param("id", id)
                .param("pharmacy", pharmacyId)
                .param("ward", values.wardId())
                .param("name", values.name())
                .param("uhid", values.uhid())
                .param("uhidKey", WardRules.uhidKey(values.uhid()))
                .param("phone", values.phone(), Types.VARCHAR)
                .param("age", values.age(), Types.INTEGER)
                .param("gender", values.gender(), Types.VARCHAR)
                .param("bed", bed)
                .param("bedNumber", bedNumber)
                .param("doctor", values.doctor(), Types.VARCHAR)
                .param("diagnosis", values.diagnosis(), Types.VARCHAR)
                .param("payer", values.payerType())
                .param("insurer", values.insurer(), Types.VARCHAR)
                .param("policyNo", values.policyNo(), Types.VARCHAR)
                .param("admittedAt", Timestamp.from(admittedAt))
                .update();
    }

    public void moveAdmission(UUID id, UUID pharmacyId, UUID wardId, String bed, int bedNumber) {
        jdbc.sql(
                        """
                        UPDATE admission
                        SET ward_id = :ward, bed = :bed, bed_number = :bedNumber
                        WHERE pharmacy_id = :pharmacy AND id = :id AND status = 'admitted'
                        """)
                .param("ward", wardId)
                .param("bed", bed)
                .param("bedNumber", bedNumber)
                .param("pharmacy", pharmacyId)
                .param("id", id)
                .update();
    }

    public void discharge(
            UUID id,
            UUID pharmacyId,
            Instant dischargedAt,
            BigDecimal settledAmount,
            String payMode,
            BigDecimal rateUsed) {
        jdbc.sql(
                        """
                        UPDATE admission
                        SET status = 'discharged', discharged_at = :dischargedAt, settled_amount = :settled,
                          pay_mode = :payMode, rate_used = :rate
                        WHERE pharmacy_id = :pharmacy AND id = :id AND status = 'admitted'
                        """)
                .param("dischargedAt", Timestamp.from(dischargedAt))
                .param("settled", settledAmount)
                .param("payMode", payMode, Types.VARCHAR)
                .param("rate", rateUsed)
                .param("pharmacy", pharmacyId)
                .param("id", id)
                .update();
    }

    private JdbcClient.StatementSpec bind(
            JdbcClient.StatementSpec spec, UUID id, UUID pharmacyId, WardRules.WardValues values) {
        return spec.param("id", id)
                .param("pharmacy", pharmacyId)
                .param("name", values.name())
                .param("code", values.code())
                .param("codeKey", WardRules.codeKey(values.code()))
                .param("floor", values.floor(), Types.VARCHAR)
                .param("category", values.category())
                .param("beds", values.beds())
                .param("sister", values.sister(), Types.VARCHAR)
                .param("dailyRate", values.dailyRate())
                .param("bedsHeld", values.bedsHeld())
                .param("underMaintenance", values.underMaintenance())
                .param("maintenanceNote", values.maintenanceNote(), Types.VARCHAR);
    }

    private String wardSelect() {
        return """
                SELECT id, name, code, floor, category, beds, sister, daily_rate, beds_held,
                  under_maintenance, maintenance_note
                FROM ward
                """;
    }

    private String admissionSelect() {
        return """
                SELECT a.id, a.ward_id, w.name AS ward_name, a.patient_name, a.uhid, a.phone, a.age, a.gender,
                  a.bed, a.bed_number, a.doctor, a.diagnosis, a.payer_type, a.insurer, a.policy_no, a.admitted_at,
                  a.status, a.discharged_at, a.settled_amount, a.pay_mode, a.rate_used, w.daily_rate
                FROM admission a
                JOIN ward w ON w.id = a.ward_id
                """;
    }

    private WardRow ward(java.sql.ResultSet rs, int row) throws java.sql.SQLException {
        return new WardRow(
                rs.getObject("id", UUID.class),
                rs.getString("name"),
                rs.getString("code"),
                rs.getString("floor"),
                rs.getString("category"),
                rs.getInt("beds"),
                rs.getString("sister"),
                rs.getBigDecimal("daily_rate"),
                rs.getInt("beds_held"),
                rs.getBoolean("under_maintenance"),
                rs.getString("maintenance_note"));
    }

    private AdmissionRow admission(java.sql.ResultSet rs, int row) throws java.sql.SQLException {
        Timestamp admitted = rs.getTimestamp("admitted_at");
        Timestamp discharged = rs.getTimestamp("discharged_at");
        int ageValue = rs.getInt("age");
        Integer age = rs.wasNull() ? null : ageValue;
        return new AdmissionRow(
                rs.getObject("id", UUID.class),
                rs.getObject("ward_id", UUID.class),
                rs.getString("ward_name"),
                rs.getString("patient_name"),
                rs.getString("uhid"),
                rs.getString("phone"),
                age,
                rs.getString("gender"),
                rs.getString("bed"),
                rs.getInt("bed_number"),
                rs.getString("doctor"),
                rs.getString("diagnosis"),
                rs.getString("payer_type"),
                rs.getString("insurer"),
                rs.getString("policy_no"),
                admitted.toInstant(),
                rs.getString("status"),
                discharged == null ? null : discharged.toInstant(),
                rs.getBigDecimal("settled_amount"),
                rs.getString("pay_mode"),
                rs.getBigDecimal("rate_used"),
                rs.getBigDecimal("daily_rate"));
    }
}
