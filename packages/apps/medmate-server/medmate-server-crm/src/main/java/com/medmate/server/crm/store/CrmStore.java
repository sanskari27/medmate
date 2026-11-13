package com.medmate.server.crm.store;

import com.medmate.server.crm.PatientRules;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.sql.Types;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
@Profile({"local", "prod", "identity-it"})
public class CrmStore {

    private final JdbcClient jdbc;

    public CrmStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public void saveProfile(UUID pharmacyId, String phone, PatientRules.Profile profile) {
        jdbc.sql(
                        """
                        INSERT INTO patient_profile (
                          pharmacy_id, phone, age, gender, blood_group, dob, address, conditions, allergies, note, consent)
                        VALUES (
                          :pharmacy, :phone, :age, :gender, :blood, :dob, :address, :conditions, :allergies, :note, :consent)
                        ON CONFLICT (pharmacy_id, phone) DO UPDATE SET
                          age = EXCLUDED.age, gender = EXCLUDED.gender, blood_group = EXCLUDED.blood_group,
                          dob = EXCLUDED.dob, address = EXCLUDED.address, conditions = EXCLUDED.conditions,
                          allergies = EXCLUDED.allergies, note = EXCLUDED.note, consent = EXCLUDED.consent
                        """)
                .param("pharmacy", pharmacyId)
                .param("phone", phone)
                .param("age", profile.age(), Types.INTEGER)
                .param("gender", profile.gender(), Types.VARCHAR)
                .param("blood", profile.bloodGroup(), Types.VARCHAR)
                .param("dob", profile.dob(), Types.VARCHAR)
                .param("address", profile.address(), Types.VARCHAR)
                .param("conditions", profile.conditions(), Types.VARCHAR)
                .param("allergies", profile.allergies(), Types.VARCHAR)
                .param("note", profile.note(), Types.VARCHAR)
                .param("consent", profile.consent())
                .update();
    }

    public List<PatientRules.Repayment> repayments(UUID pharmacyId) {
        return jdbc.sql(
                        """
                        SELECT code, phone, amount, mode, note, recorded_at
                        FROM credit_repayment WHERE pharmacy_id = :pharmacy
                        """)
                .param("pharmacy", pharmacyId)
                .query(CrmStore::repayment)
                .list();
    }

    public String nextRepayment(UUID pharmacyId) {
        Optional<Integer> current = jdbc.sql(
                        "SELECT last_number FROM credit_repayment_counter WHERE pharmacy_id = :id FOR UPDATE")
                .param("id", pharmacyId)
                .query(Integer.class)
                .optional();
        int next = current.map(number -> number + 1).orElse(1);
        if (current.isEmpty()) {
            jdbc.sql("INSERT INTO credit_repayment_counter (pharmacy_id, last_number) VALUES (:id, :number)")
                    .param("id", pharmacyId)
                    .param("number", next)
                    .update();
        } else {
            jdbc.sql("UPDATE credit_repayment_counter SET last_number = :number WHERE pharmacy_id = :id")
                    .param("id", pharmacyId)
                    .param("number", next)
                    .update();
        }
        return String.format("CR-%03d", next);
    }

    public void insertRepayment(UUID pharmacyId, PatientRules.Repayment repayment) {
        jdbc.sql(
                        """
                        INSERT INTO credit_repayment (pharmacy_id, code, phone, amount, mode, note, recorded_at)
                        VALUES (:pharmacy, :code, :phone, :amount, :mode, :note, :at)
                        """)
                .param("pharmacy", pharmacyId)
                .param("code", repayment.code())
                .param("phone", repayment.phone())
                .param("amount", repayment.amount())
                .param("mode", repayment.mode())
                .param("note", repayment.note(), Types.VARCHAR)
                .param("at", Timestamp.from(repayment.at()))
                .update();
    }

    public List<PatientRules.Reminder> reminders(UUID pharmacyId) {
        return jdbc.sql(
                        """
                        SELECT id, phone, kind, channel, recorded_at
                        FROM patient_reminder WHERE pharmacy_id = :pharmacy
                        """)
                .param("pharmacy", pharmacyId)
                .query(CrmStore::reminder)
                .list();
    }

    public void insertReminder(UUID pharmacyId, PatientRules.Reminder reminder) {
        jdbc.sql(
                        """
                        INSERT INTO patient_reminder (id, pharmacy_id, phone, kind, channel, recorded_at)
                        VALUES (:id, :pharmacy, :phone, :kind, :channel, :at)
                        """)
                .param("id", UUID.fromString(reminder.id()))
                .param("pharmacy", pharmacyId)
                .param("phone", reminder.phone())
                .param("kind", reminder.kind())
                .param("channel", reminder.channel())
                .param("at", Timestamp.from(reminder.at()))
                .update();
    }

    public List<PatientRules.Redemption> redemptions(UUID pharmacyId) {
        return jdbc.sql(
                        """
                        SELECT id, phone, points, recorded_at FROM loyalty_redemption WHERE pharmacy_id = :pharmacy
                        """)
                .param("pharmacy", pharmacyId)
                .query(CrmStore::redemption)
                .list();
    }

    public void insertRedemption(UUID pharmacyId, PatientRules.Redemption redemption) {
        jdbc.sql(
                        """
                        INSERT INTO loyalty_redemption (id, pharmacy_id, phone, points, recorded_at)
                        VALUES (:id, :pharmacy, :phone, :points, :at)
                        """)
                .param("id", UUID.fromString(redemption.id()))
                .param("pharmacy", pharmacyId)
                .param("phone", redemption.phone())
                .param("points", redemption.points())
                .param("at", Timestamp.from(redemption.at()))
                .update();
    }

    public List<PatientRules.Campaign> campaigns(UUID pharmacyId) {
        return jdbc.sql(
                        """
                        SELECT id, name, segment, channel, message, offer_label, reach, sent_at
                        FROM crm_campaign WHERE pharmacy_id = :pharmacy
                        """)
                .param("pharmacy", pharmacyId)
                .query(CrmStore::campaign)
                .list();
    }

    public void insertCampaign(UUID pharmacyId, PatientRules.Campaign campaign) {
        jdbc.sql(
                        """
                        INSERT INTO crm_campaign (
                          id, pharmacy_id, name, segment, channel, message, offer_label, reach, sent_at)
                        VALUES (:id, :pharmacy, :name, :segment, :channel, :message, :offer, :reach, :at)
                        """)
                .param("id", UUID.fromString(campaign.id()))
                .param("pharmacy", pharmacyId)
                .param("name", campaign.name())
                .param("segment", campaign.segment())
                .param("channel", campaign.channel())
                .param("message", campaign.message())
                .param("offer", campaign.offerLabel(), Types.VARCHAR)
                .param("reach", campaign.reach())
                .param("at", Timestamp.from(campaign.sentAt()))
                .update();
    }

    public List<PatientRules.Feedback> feedback(UUID pharmacyId) {
        return jdbc.sql(
                        """
                        SELECT id, phone, rating, nps, comment, recorded_at
                        FROM patient_feedback WHERE pharmacy_id = :pharmacy
                        """)
                .param("pharmacy", pharmacyId)
                .query(CrmStore::feedback)
                .list();
    }

    public void insertFeedback(UUID pharmacyId, PatientRules.Feedback feedback) {
        jdbc.sql(
                        """
                        INSERT INTO patient_feedback (id, pharmacy_id, phone, rating, nps, comment, recorded_at)
                        VALUES (:id, :pharmacy, :phone, :rating, :nps, :comment, :at)
                        """)
                .param("id", UUID.fromString(feedback.id()))
                .param("pharmacy", pharmacyId)
                .param("phone", feedback.phone())
                .param("rating", feedback.rating())
                .param("nps", feedback.nps(), Types.INTEGER)
                .param("comment", feedback.comment(), Types.VARCHAR)
                .param("at", Timestamp.from(feedback.at()))
                .update();
    }

    public List<PhoneProfile> profileRows(UUID pharmacyId) {
        return jdbc.sql(
                        """
                        SELECT phone, age, gender, blood_group, dob, address, conditions, allergies, note, consent
                        FROM patient_profile WHERE pharmacy_id = :pharmacy
                        """)
                .param("pharmacy", pharmacyId)
                .query(CrmStore::phoneProfile)
                .list();
    }

    private static PhoneProfile phoneProfile(ResultSet row, int number) throws SQLException {
        int age = row.getInt("age");
        return new PhoneProfile(
                row.getString("phone"),
                row.wasNull() ? null : age,
                row.getString("gender"),
                row.getString("blood_group"),
                row.getString("dob"),
                row.getString("address"),
                row.getString("conditions"),
                row.getString("allergies"),
                row.getString("note"),
                row.getBoolean("consent"));
    }

    private static PatientRules.Repayment repayment(ResultSet row, int number) throws SQLException {
        return new PatientRules.Repayment(
                row.getString("code"),
                row.getString("phone"),
                row.getBigDecimal("amount"),
                row.getString("mode"),
                row.getString("note"),
                row.getTimestamp("recorded_at").toInstant());
    }

    private static PatientRules.Reminder reminder(ResultSet row, int number) throws SQLException {
        return new PatientRules.Reminder(
                row.getObject("id", UUID.class).toString(),
                row.getString("phone"),
                row.getString("kind"),
                row.getString("channel"),
                row.getTimestamp("recorded_at").toInstant());
    }

    private static PatientRules.Redemption redemption(ResultSet row, int number) throws SQLException {
        return new PatientRules.Redemption(
                row.getObject("id", UUID.class).toString(),
                row.getString("phone"),
                row.getInt("points"),
                row.getTimestamp("recorded_at").toInstant());
    }

    private static PatientRules.Campaign campaign(ResultSet row, int number) throws SQLException {
        return new PatientRules.Campaign(
                row.getObject("id", UUID.class).toString(),
                row.getString("name"),
                row.getString("segment"),
                row.getString("channel"),
                row.getString("message"),
                row.getString("offer_label"),
                row.getInt("reach"),
                row.getTimestamp("sent_at").toInstant());
    }

    private static PatientRules.Feedback feedback(ResultSet row, int number) throws SQLException {
        int nps = row.getInt("nps");
        return new PatientRules.Feedback(
                row.getObject("id", UUID.class).toString(),
                row.getString("phone"),
                row.getInt("rating"),
                row.wasNull() ? null : nps,
                row.getString("comment"),
                row.getTimestamp("recorded_at").toInstant());
    }

    public record PhoneProfile(
            String phone,
            Integer age,
            String gender,
            String bloodGroup,
            String dob,
            String address,
            String conditions,
            String allergies,
            String note,
            boolean consent) {}
}
