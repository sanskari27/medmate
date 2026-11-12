package com.medmate.server.distributors.store;

import com.medmate.server.distributors.DistributorRules;
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
public class DistributorStore {

    private final JdbcClient jdbc;

    public DistributorStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public record DistributorRow(
            String code,
            String name,
            String contactPerson,
            String phone,
            String email,
            String gstin,
            String drugLicenceNumber,
            String address,
            String city,
            String state,
            String paymentTerms,
            int openingBalance,
            boolean active,
            boolean showInPurchases) {

        public DistributorRules.Values values() {
            return new DistributorRules.Values(
                    name,
                    contactPerson,
                    phone,
                    email,
                    gstin,
                    drugLicenceNumber,
                    address,
                    city,
                    state,
                    paymentTerms,
                    openingBalance,
                    active,
                    showInPurchases);
        }
    }

    public record TransactionRow(
            String code,
            String distributorCode,
            String type,
            int amount,
            String reference,
            String note,
            String mode,
            Instant recordedAt) {}

    public boolean lockPharmacy(UUID pharmacyId) {
        return jdbc.sql("SELECT id FROM pharmacy WHERE id = :id FOR UPDATE")
                .param("id", pharmacyId)
                .query(UUID.class)
                .optional()
                .isPresent();
    }

    public List<String> codes(UUID pharmacyId) {
        return jdbc.sql("SELECT code FROM distributor WHERE pharmacy_id = :id")
                .param("id", pharmacyId)
                .query(String.class)
                .list();
    }

    public List<String> transactionCodes(UUID pharmacyId) {
        return jdbc.sql("SELECT code FROM distributor_transaction WHERE pharmacy_id = :id")
                .param("id", pharmacyId)
                .query(String.class)
                .list();
    }

    public List<DistributorRow> list(UUID pharmacyId) {
        return jdbc.sql(select() + " WHERE pharmacy_id = :id ORDER BY CAST(SUBSTRING(code FROM 5) AS INTEGER)")
                .param("id", pharmacyId)
                .query(this::distributor)
                .list();
    }

    public Optional<DistributorRow> find(UUID pharmacyId, String code) {
        return jdbc.sql(select() + " WHERE pharmacy_id = :id AND code = :code")
                .param("id", pharmacyId)
                .param("code", code)
                .query(this::distributor)
                .optional();
    }

    public List<TransactionRow> transactions(UUID pharmacyId) {
        return jdbc.sql(
                        """
                        SELECT code, distributor_code, type, amount, reference, note, mode, recorded_at
                        FROM distributor_transaction
                        WHERE pharmacy_id = :id
                        ORDER BY recorded_at, code
                        """)
                .param("id", pharmacyId)
                .query(this::transaction)
                .list();
    }

    public void insert(UUID pharmacyId, String code, DistributorRules.Values values) {
        bind(
                        jdbc.sql(
                                """
                        INSERT INTO distributor (
                          pharmacy_id, code, name, contact_person, phone, email, gstin, drug_licence_number,
                          address, city, state, payment_terms, opening_balance, active, show_in_purchases)
                        VALUES (
                          :pharmacy, :code, :name, :contactPerson, :phone, :email, :gstin, :drugLicence,
                          :address, :city, :state, :terms, :opening, :active, :listed)
                        """),
                        pharmacyId,
                        code,
                        values)
                .update();
    }

    public void update(UUID pharmacyId, String code, DistributorRules.Values values) {
        bind(
                        jdbc.sql(
                                """
                        UPDATE distributor SET
                          name = :name, contact_person = :contactPerson, phone = :phone, email = :email,
                          gstin = :gstin, drug_licence_number = :drugLicence, address = :address, city = :city,
                          state = :state, payment_terms = :terms, opening_balance = :opening, active = :active,
                          show_in_purchases = :listed
                        WHERE pharmacy_id = :pharmacy AND code = :code
                        """),
                        pharmacyId,
                        code,
                        values)
                .update();
    }

    public void insertTransaction(
            UUID pharmacyId,
            String distributorCode,
            String code,
            String type,
            int amount,
            String reference,
            String note,
            String mode,
            Instant recordedAt) {
        jdbc.sql(
                        """
                        INSERT INTO distributor_transaction (
                          pharmacy_id, distributor_code, code, type, amount, reference, note, mode, recorded_at)
                        VALUES (
                          :pharmacy, :distributor, :code, :type, :amount, :reference, :note, :mode, :recorded)
                        """)
                .param("pharmacy", pharmacyId)
                .param("distributor", distributorCode)
                .param("code", code)
                .param("type", type)
                .param("amount", amount)
                .param("reference", reference, Types.VARCHAR)
                .param("note", note, Types.VARCHAR)
                .param("mode", mode, Types.VARCHAR)
                .param("recorded", Timestamp.from(recordedAt))
                .update();
    }

    private JdbcClient.StatementSpec bind(
            JdbcClient.StatementSpec spec, UUID pharmacyId, String code, DistributorRules.Values values) {
        return spec.param("pharmacy", pharmacyId)
                .param("code", code)
                .param("name", values.name(), Types.VARCHAR)
                .param("contactPerson", values.contactPerson(), Types.VARCHAR)
                .param("phone", values.phone(), Types.VARCHAR)
                .param("email", values.email(), Types.VARCHAR)
                .param("gstin", values.gstin(), Types.VARCHAR)
                .param("drugLicence", values.drugLicenceNumber(), Types.VARCHAR)
                .param("address", values.address(), Types.VARCHAR)
                .param("city", values.city(), Types.VARCHAR)
                .param("state", values.state(), Types.VARCHAR)
                .param("terms", values.paymentTerms(), Types.VARCHAR)
                .param("opening", values.openingBalance(), Types.INTEGER)
                .param("active", values.active())
                .param("listed", values.showInPurchases());
    }

    private String select() {
        return """
                SELECT code, name, contact_person, phone, email, gstin, drug_licence_number, address, city, state,
                  payment_terms, opening_balance, active, show_in_purchases
                FROM distributor
                """;
    }

    private DistributorRow distributor(ResultSet rs, int row) throws SQLException {
        return new DistributorRow(
                rs.getString("code"),
                rs.getString("name"),
                rs.getString("contact_person"),
                rs.getString("phone"),
                rs.getString("email"),
                rs.getString("gstin"),
                rs.getString("drug_licence_number"),
                rs.getString("address"),
                rs.getString("city"),
                rs.getString("state"),
                rs.getString("payment_terms"),
                rs.getInt("opening_balance"),
                rs.getBoolean("active"),
                rs.getBoolean("show_in_purchases"));
    }

    private TransactionRow transaction(ResultSet rs, int row) throws SQLException {
        Timestamp recorded = rs.getTimestamp("recorded_at");
        return new TransactionRow(
                rs.getString("code"),
                rs.getString("distributor_code"),
                rs.getString("type"),
                rs.getInt("amount"),
                rs.getString("reference"),
                rs.getString("note"),
                rs.getString("mode"),
                recorded == null ? null : recorded.toInstant());
    }
}
