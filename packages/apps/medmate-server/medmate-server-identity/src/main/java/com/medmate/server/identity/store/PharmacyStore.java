package com.medmate.server.identity.store;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medmate.server.identity.access.VerificationStatus;
import com.medmate.server.identity.pharmacy.PharmacyRules;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
@Profile({"local", "prod", "identity-it"})
public class PharmacyStore {

    private static final ObjectMapper JSON = new ObjectMapper();

    private final JdbcClient jdbc;

    public PharmacyStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public record PharmacyRow(
            UUID id,
            UUID ownerAccountId,
            VerificationStatus status,
            String rejectionStage,
            String rejectionComment,
            String name,
            String email,
            Instant submittedAt) {}

    public record DocumentRow(String objectKey, String contentType) {}

    public record Summary(UUID pharmacyId, String name, String phone, VerificationStatus status, Instant submittedAt) {}

    public void insertPharmacy(UUID id, UUID ownerAccountId, Instant now) {
        jdbc.sql(
                        """
                        INSERT INTO pharmacy (id, owner_account_id, verification_status, business_types, created_at)
                        VALUES (:id, :owner, 'incomplete', '[]', :created)
                        """)
                .param("id", id)
                .param("owner", ownerAccountId)
                .param("created", Timestamp.from(now))
                .update();
    }

    public Optional<PharmacyRow> findById(UUID id) {
        return jdbc.sql(
                        """
                        SELECT id, owner_account_id, verification_status, rejection_stage, rejection_comment, name, email, submitted_at
                        FROM pharmacy WHERE id = :id
                        """)
                .param("id", id)
                .query(this::pharmacy)
                .optional();
    }

    public Optional<PharmacyRow> findByOwner(UUID ownerAccountId) {
        return jdbc.sql(
                        """
                        SELECT id, owner_account_id, verification_status, rejection_stage, rejection_comment, name, email, submitted_at
                        FROM pharmacy WHERE owner_account_id = :owner
                        """)
                .param("owner", ownerAccountId)
                .query(this::pharmacy)
                .optional();
    }

    public Optional<UUID> membership(UUID accountId) {
        return jdbc.sql("SELECT pharmacy_id FROM pharmacy_membership WHERE account_id = :id")
                .param("id", accountId)
                .query(UUID.class)
                .optional();
    }

    public void addMembership(UUID accountId, UUID pharmacyId) {
        jdbc.sql("INSERT INTO pharmacy_membership (account_id, pharmacy_id) VALUES (:account, :pharmacy)")
                .param("account", accountId)
                .param("pharmacy", pharmacyId)
                .update();
    }

    public void saveSubmission(UUID id, PharmacyRules.ApplicationInput input, Instant now) {
        jdbc.sql(
                        """
                        UPDATE pharmacy SET
                          name = :name,
                          tagline = :tagline,
                          email = :email,
                          address = :address,
                          city = :city,
                          state = :state,
                          pincode = :pincode,
                          business_types = :businessTypes,
                          industry = :industry,
                          registration_type = :registration,
                          gstin = :gstin,
                          pan = :pan,
                          drug_licence_no = :drug,
                          fssai_no = :fssai,
                          trade_licence_no = :trade,
                          enable_tds = :tds,
                          enable_tcs = :tcs,
                          pharmacist_name = :pharmacist,
                          invoice_prefix = :prefix,
                          terms = :terms,
                          accept_online_orders = :online,
                          self_order_kiosk = :kiosk,
                          e_invoicing = :einvoice,
                          loose_selling = :loose,
                          low_stock_alerts = TRUE,
                          submitted_at = :submitted
                        WHERE id = :id
                        """)
                .param("id", id)
                .param("name", input.name().trim())
                .param("tagline", blankToNull(input.tagline()))
                .param("email", input.email().trim().toLowerCase(Locale.ROOT))
                .param("address", input.address().trim())
                .param("city", input.city().trim())
                .param("state", input.state())
                .param("pincode", input.pincode().trim())
                .param("businessTypes", businessTypes(input.businessTypes()))
                .param("industry", input.industry())
                .param("registration", input.registrationType())
                .param("gstin", input.gstin().trim().toUpperCase(Locale.ROOT))
                .param("pan", input.pan().trim().toUpperCase(Locale.ROOT))
                .param("drug", input.drugLicenceNo().trim())
                .param("fssai", input.fssaiNo().trim())
                .param("trade", input.tradeLicenceNo().trim())
                .param("tds", Boolean.TRUE.equals(input.enableTds()))
                .param("tcs", Boolean.TRUE.equals(input.enableTcs()))
                .param("pharmacist", input.pharmacistName().trim())
                .param("prefix", input.invoicePrefix().trim())
                .param("terms", blankToNull(input.terms()))
                .param("online", Boolean.TRUE.equals(input.acceptOnlineOrders()))
                .param("kiosk", Boolean.TRUE.equals(input.selfOrderKiosk()))
                .param("einvoice", Boolean.TRUE.equals(input.eInvoicing()))
                .param("loose", Boolean.TRUE.equals(input.looseSelling()))
                .param("submitted", Timestamp.from(now))
                .update();
    }

    public void updateStatus(UUID id, VerificationStatus status, String stage, String comment) {
        jdbc.sql(
                        """
                        UPDATE pharmacy
                        SET verification_status = :status, rejection_stage = :stage, rejection_comment = :comment
                        WHERE id = :id
                        """)
                .param("id", id)
                .param("status", status.wire())
                .param("stage", stage)
                .param("comment", comment)
                .update();
    }

    public List<String> documentKeys(UUID pharmacyId) {
        return jdbc.sql("SELECT object_key FROM pharmacy_document WHERE pharmacy_id = :id")
                .param("id", pharmacyId)
                .query(String.class)
                .list();
    }

    public void deleteDocuments(UUID pharmacyId) {
        jdbc.sql("DELETE FROM pharmacy_document WHERE pharmacy_id = :id")
                .param("id", pharmacyId)
                .update();
    }

    public void insertDocument(UUID pharmacyId, String slot, String objectKey, String contentType) {
        jdbc.sql(
                        "INSERT INTO pharmacy_document (pharmacy_id, slot, object_key, content_type) VALUES (:id, :slot, :key, :type)")
                .param("id", pharmacyId)
                .param("slot", slot)
                .param("key", objectKey)
                .param("type", contentType)
                .update();
    }

    public Optional<DocumentRow> document(UUID pharmacyId, String slot) {
        return jdbc.sql(
                        "SELECT object_key, content_type FROM pharmacy_document WHERE pharmacy_id = :id AND slot = :slot")
                .param("id", pharmacyId)
                .param("slot", slot)
                .query((rs, row) -> new DocumentRow(rs.getString("object_key"), rs.getString("content_type")))
                .optional();
    }

    public List<Summary> list(VerificationStatus status) {
        return jdbc.sql(
                        """
                        SELECT p.id, p.name, a.phone, p.verification_status, p.submitted_at
                        FROM pharmacy p
                        JOIN account a ON a.id = p.owner_account_id
                        WHERE p.verification_status = :status
                        ORDER BY p.submitted_at
                        """)
                .param("status", status.wire())
                .query((rs, row) -> new Summary(
                        rs.getObject("id", UUID.class),
                        rs.getString("name"),
                        rs.getString("phone"),
                        VerificationStatus.parse(rs.getString("verification_status")),
                        rs.getTimestamp("submitted_at").toInstant()))
                .list();
    }

    public void insertDecision(
            UUID id, UUID pharmacyId, String stage, String decision, String comment, UUID actorId, Instant now) {
        jdbc.sql(
                        """
                        INSERT INTO review_decision (id, pharmacy_id, stage, decision, comment, actor_account_id, created_at)
                        VALUES (:id, :pharmacy, :stage, :decision, :comment, :actor, :created)
                        """)
                .param("id", id)
                .param("pharmacy", pharmacyId)
                .param("stage", stage)
                .param("decision", decision)
                .param("comment", comment)
                .param("actor", actorId)
                .param("created", Timestamp.from(now))
                .update();
    }

    private PharmacyRow pharmacy(java.sql.ResultSet rs, int row) throws java.sql.SQLException {
        Timestamp submitted = rs.getTimestamp("submitted_at");
        return new PharmacyRow(
                rs.getObject("id", UUID.class),
                rs.getObject("owner_account_id", UUID.class),
                VerificationStatus.parse(rs.getString("verification_status")),
                rs.getString("rejection_stage"),
                rs.getString("rejection_comment"),
                rs.getString("name"),
                rs.getString("email"),
                submitted == null ? null : submitted.toInstant());
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private static String businessTypes(List<String> types) {
        try {
            return JSON.writeValueAsString(types == null ? List.of() : types);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException(exception);
        }
    }
}
