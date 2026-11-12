package com.medmate.server.identity.store;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medmate.server.identity.access.VerificationStatus;
import com.medmate.server.identity.pharmacy.PharmacyRules;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
@Profile({"local", "prod", "identity-it"})
public class PharmacyStore {

    private static final ObjectMapper JSON = new ObjectMapper();
    private static final List<String> SLOT_ORDER = List.of(
            "logo", "gst", "pan", "drug-licence", "fssai", "trade-licence", "pharmacist-certificate", "signature");

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

    public record StoredDocument(String slot, String contentType, String objectKey) {}

    public record ApplicationRow(
            UUID id,
            VerificationStatus status,
            String rejectionStage,
            String rejectionComment,
            String phone,
            String name,
            String tagline,
            String email,
            String address,
            String city,
            String state,
            String pincode,
            List<String> businessTypes,
            String industry,
            String registrationType,
            String pharmacyType,
            String gstin,
            String pan,
            String drugLicenceNo,
            String fssaiNo,
            String tradeLicenceNo,
            boolean enableTds,
            boolean enableTcs,
            String pharmacistName,
            String invoicePrefix,
            String terms,
            boolean acceptOnlineOrders,
            boolean selfOrderKiosk,
            boolean eInvoicing,
            boolean looseSelling,
            boolean lowStockAlerts,
            Instant submittedAt,
            List<PharmacyRules.ExtraDetail> extraDetails,
            List<StoredDocument> documents) {

        ApplicationRow withDocuments(List<StoredDocument> documents) {
            return new ApplicationRow(
                    id,
                    status,
                    rejectionStage,
                    rejectionComment,
                    phone,
                    name,
                    tagline,
                    email,
                    address,
                    city,
                    state,
                    pincode,
                    businessTypes,
                    industry,
                    registrationType,
                    pharmacyType,
                    gstin,
                    pan,
                    drugLicenceNo,
                    fssaiNo,
                    tradeLicenceNo,
                    enableTds,
                    enableTcs,
                    pharmacistName,
                    invoicePrefix,
                    terms,
                    acceptOnlineOrders,
                    selfOrderKiosk,
                    eInvoicing,
                    looseSelling,
                    lowStockAlerts,
                    submittedAt,
                    extraDetails,
                    documents);
        }
    }

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

    public Map<UUID, String> names(Collection<UUID> ids) {
        Map<UUID, String> names = new HashMap<>();
        jdbc.sql("SELECT id, name FROM pharmacy WHERE id IN (:ids)")
                .param("ids", ids)
                .query((rs, row) -> names.put(rs.getObject("id", UUID.class), blank(rs.getString("name"))))
                .list();
        return names;
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

    public Optional<ApplicationRow> application(UUID id) {
        Optional<ApplicationRow> found = jdbc.sql(
                        """
                        SELECT p.id, p.verification_status, p.rejection_stage, p.rejection_comment, a.phone,
                          p.name, p.tagline, p.email, p.address, p.city, p.state, p.pincode, p.business_types,
                          p.industry, p.registration_type, p.pharmacy_type, p.gstin, p.pan, p.drug_licence_no, p.fssai_no,
                          p.trade_licence_no, p.enable_tds, p.enable_tcs, p.pharmacist_name, p.invoice_prefix,
                          p.terms, p.accept_online_orders, p.self_order_kiosk, p.e_invoicing, p.loose_selling,
                          p.low_stock_alerts, p.submitted_at, p.extra_details
                        FROM pharmacy p
                        JOIN account a ON a.id = p.owner_account_id
                        WHERE p.id = :id
                        """)
                .param("id", id)
                .query(this::readApplication)
                .optional();
        return found.map(row -> row.withDocuments(documentSlots(id)));
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
                          pharmacy_type = :pharmacyType,
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
                .param("pharmacyType", input.pharmacyType())
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

    public void saveProfile(UUID id, PharmacyRules.ProfileInput input, Instant submittedAt) {
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
                          e_invoicing = :einvoice,
                          pharmacist_name = :pharmacist,
                          terms = :terms,
                          extra_details = :extra
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
                .param("einvoice", Boolean.TRUE.equals(input.eInvoicing()))
                .param("pharmacist", input.pharmacistName().trim())
                .param("terms", blankToNull(input.terms()))
                .param("extra", extraDetails(input.extraDetails()))
                .update();
        if (submittedAt != null) {
            jdbc.sql("UPDATE pharmacy SET submitted_at = :submitted WHERE id = :id")
                    .param("id", id)
                    .param("submitted", Timestamp.from(submittedAt))
                    .update();
        }
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

    public Set<String> storedSlots(UUID pharmacyId) {
        return new LinkedHashSet<>(jdbc.sql("SELECT slot FROM pharmacy_document WHERE pharmacy_id = :id")
                .param("id", pharmacyId)
                .query(String.class)
                .list());
    }

    public void deleteDocument(UUID pharmacyId, String slot) {
        jdbc.sql("DELETE FROM pharmacy_document WHERE pharmacy_id = :id AND slot = :slot")
                .param("id", pharmacyId)
                .param("slot", slot)
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

    private List<StoredDocument> documentSlots(UUID pharmacyId) {
        List<StoredDocument> stored = jdbc.sql(
                        "SELECT slot, content_type, object_key FROM pharmacy_document WHERE pharmacy_id = :id")
                .param("id", pharmacyId)
                .query((rs, row) -> new StoredDocument(
                        rs.getString("slot"), rs.getString("content_type"), rs.getString("object_key")))
                .list();
        return SLOT_ORDER.stream()
                .flatMap(slot ->
                        stored.stream().filter(document -> document.slot().equals(slot)))
                .toList();
    }

    public Optional<DocumentRow> document(UUID pharmacyId, String slot) {
        return jdbc.sql(
                        "SELECT object_key, content_type FROM pharmacy_document WHERE pharmacy_id = :id AND slot = :slot")
                .param("id", pharmacyId)
                .param("slot", slot)
                .query((rs, row) -> new DocumentRow(rs.getString("object_key"), rs.getString("content_type")))
                .optional();
    }

    public record OwnerListing(
            UUID pharmacyId,
            String name,
            String phone,
            VerificationStatus status,
            boolean ownerDisabled,
            boolean openRequest) {}

    public List<OwnerListing> listOwners() {
        return jdbc.sql(
                        """
                        SELECT p.id, p.name, a.phone, p.verification_status, a.disabled AS owner_disabled,
                          EXISTS (
                            SELECT 1 FROM pharmacy_block_request r
                            WHERE r.pharmacy_id = p.id AND r.status = 'open'
                          ) AS open_request
                        FROM pharmacy p
                        JOIN account a ON a.id = p.owner_account_id
                        ORDER BY CASE WHEN p.name IS NULL OR btrim(p.name) = '' THEN 1 ELSE 0 END,
                          lower(p.name),
                          p.id
                        """)
                .query((rs, row) -> new OwnerListing(
                        rs.getObject("id", UUID.class),
                        rs.getString("name"),
                        rs.getString("phone"),
                        VerificationStatus.parse(rs.getString("verification_status")),
                        rs.getBoolean("owner_disabled"),
                        rs.getBoolean("open_request")))
                .list();
    }

    public boolean ownerDisabled(UUID pharmacyId) {
        if (pharmacyId == null) {
            return false;
        }
        return jdbc.sql(
                        """
                        SELECT a.disabled
                        FROM pharmacy p
                        JOIN account a ON a.id = p.owner_account_id
                        WHERE p.id = :id
                        """)
                .param("id", pharmacyId)
                .query(Boolean.class)
                .optional()
                .orElse(false);
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

    private ApplicationRow readApplication(java.sql.ResultSet rs, int row) throws java.sql.SQLException {
        Timestamp submitted = rs.getTimestamp("submitted_at");
        return new ApplicationRow(
                rs.getObject("id", UUID.class),
                VerificationStatus.parse(rs.getString("verification_status")),
                rs.getString("rejection_stage"),
                rs.getString("rejection_comment"),
                rs.getString("phone"),
                rs.getString("name"),
                rs.getString("tagline"),
                rs.getString("email"),
                rs.getString("address"),
                rs.getString("city"),
                rs.getString("state"),
                rs.getString("pincode"),
                readBusinessTypes(rs.getString("business_types")),
                rs.getString("industry"),
                rs.getString("registration_type"),
                rs.getString("pharmacy_type"),
                rs.getString("gstin"),
                rs.getString("pan"),
                rs.getString("drug_licence_no"),
                rs.getString("fssai_no"),
                rs.getString("trade_licence_no"),
                rs.getBoolean("enable_tds"),
                rs.getBoolean("enable_tcs"),
                rs.getString("pharmacist_name"),
                rs.getString("invoice_prefix"),
                rs.getString("terms"),
                rs.getBoolean("accept_online_orders"),
                rs.getBoolean("self_order_kiosk"),
                rs.getBoolean("e_invoicing"),
                rs.getBoolean("loose_selling"),
                rs.getBoolean("low_stock_alerts"),
                submitted == null ? null : submitted.toInstant(),
                readExtra(rs.getString("extra_details")),
                List.of());
    }

    private static List<PharmacyRules.ExtraDetail> readExtra(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            List<PharmacyRules.ExtraDetail> details =
                    JSON.readValue(json, new TypeReference<List<PharmacyRules.ExtraDetail>>() {});
            return details == null ? List.of() : details;
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException(exception);
        }
    }

    private static String extraDetails(List<PharmacyRules.ExtraDetail> details) {
        List<PharmacyRules.ExtraDetail> trimmed = new ArrayList<>();
        if (details != null) {
            for (PharmacyRules.ExtraDetail detail : details) {
                trimmed.add(new PharmacyRules.ExtraDetail(
                        detail.label().trim(), detail.value().trim()));
            }
        }
        try {
            return JSON.writeValueAsString(trimmed);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException(exception);
        }
    }

    private static List<String> readBusinessTypes(String json) {
        try {
            List<String> types = JSON.readValue(json, new TypeReference<List<String>>() {});
            return types == null ? List.of() : types;
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException(exception);
        }
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

    private static String blank(String value) {
        return value == null ? "" : value;
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
