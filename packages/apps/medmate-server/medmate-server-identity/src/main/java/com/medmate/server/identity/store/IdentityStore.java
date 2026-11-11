package com.medmate.server.identity.store;

import com.medmate.server.identity.access.AccountType;
import com.medmate.server.identity.access.StaffSubtype;
import com.medmate.server.identity.otp.OtpMachine;
import com.medmate.server.identity.otp.OtpPurpose;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
@Profile({"local", "prod", "identity-it"})
public class IdentityStore {

    private final JdbcClient jdbc;

    public IdentityStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public record AccountRow(UUID id, String phone, AccountType type, String displayName, boolean disabled) {}

    public record OtpRow(OtpMachine.State state) {}

    public record RefreshRow(UUID accountId, Instant expiresAt, boolean revoked) {}

    public Map<UUID, String> displayNames(Collection<UUID> ids) {
        Map<UUID, String> names = new HashMap<>();
        jdbc.sql("SELECT id, display_name FROM account WHERE id IN (:ids)")
                .param("ids", ids)
                .query((rs, row) -> names.put(rs.getObject("id", UUID.class), blank(rs.getString("display_name"))))
                .list();
        return names;
    }

    public Optional<AccountRow> findAccount(UUID id) {
        return jdbc.sql("SELECT id, phone, account_type, display_name, disabled FROM account WHERE id = :id")
                .param("id", id)
                .query(this::account)
                .optional();
    }

    public Optional<AccountRow> findAccount(String phone, AccountType type) {
        return jdbc.sql(
                        "SELECT id, phone, account_type, display_name, disabled FROM account WHERE phone = :phone AND account_type = :type")
                .param("phone", phone)
                .param("type", type.wire())
                .query(this::account)
                .optional();
    }

    public List<AccountRow> findPlatformAccounts(String phone) {
        return jdbc.sql(
                        "SELECT id, phone, account_type, display_name, disabled FROM account WHERE phone = :phone AND account_type IN ('admin', 'staff')")
                .param("phone", phone)
                .query(this::account)
                .list();
    }

    public void insertAccount(UUID id, String phone, AccountType type, String displayName, Instant now) {
        jdbc.sql(
                        "INSERT INTO account (id, phone, account_type, display_name, disabled, created_at) VALUES (:id, :phone, :type, :name, FALSE, :created)")
                .param("id", id)
                .param("phone", phone)
                .param("type", type.wire())
                .param("name", displayName)
                .param("created", Timestamp.from(now))
                .update();
    }

    public void updateDisplayName(UUID id, String displayName) {
        jdbc.sql("UPDATE account SET display_name = :name WHERE id = :id")
                .param("name", displayName)
                .param("id", id)
                .update();
    }

    public void setDisabled(UUID id, boolean disabled) {
        jdbc.sql("UPDATE account SET disabled = :disabled WHERE id = :id")
                .param("disabled", disabled)
                .param("id", id)
                .update();
    }

    public void upsertOtp(String phone, AccountType type, OtpPurpose purpose, OtpMachine.State state) {
        jdbc.sql(
                        """
                        INSERT INTO otp_challenge (phone, account_type, purpose, code_hash, expires_at, attempts)
                        VALUES (:phone, :type, :purpose, :hash, :expires, :attempts)
                        ON CONFLICT (phone, account_type, purpose)
                        DO UPDATE SET code_hash = EXCLUDED.code_hash, expires_at = EXCLUDED.expires_at, attempts = EXCLUDED.attempts
                        """)
                .param("phone", phone)
                .param("type", type.wire())
                .param("purpose", purpose.wire())
                .param("hash", state.codeHash())
                .param("expires", Timestamp.from(state.expiresAt()))
                .param("attempts", state.attempts())
                .update();
    }

    public Optional<OtpRow> findOtp(String phone, AccountType type, OtpPurpose purpose) {
        return jdbc.sql(
                        "SELECT code_hash, expires_at, attempts FROM otp_challenge WHERE phone = :phone AND account_type = :type AND purpose = :purpose")
                .param("phone", phone)
                .param("type", type.wire())
                .param("purpose", purpose.wire())
                .query((rs, row) -> new OtpRow(new OtpMachine.State(
                        rs.getString("code_hash"), rs.getTimestamp("expires_at").toInstant(), rs.getInt("attempts"))))
                .optional();
    }

    public void incrementOtpAttempts(String phone, AccountType type, OtpPurpose purpose) {
        jdbc.sql(
                        "UPDATE otp_challenge SET attempts = attempts + 1 WHERE phone = :phone AND account_type = :type AND purpose = :purpose")
                .param("phone", phone)
                .param("type", type.wire())
                .param("purpose", purpose.wire())
                .update();
    }

    public void deleteOtp(String phone, AccountType type, OtpPurpose purpose) {
        jdbc.sql("DELETE FROM otp_challenge WHERE phone = :phone AND account_type = :type AND purpose = :purpose")
                .param("phone", phone)
                .param("type", type.wire())
                .param("purpose", purpose.wire())
                .update();
    }

    public void insertRefresh(String tokenHash, UUID accountId, Instant expiresAt) {
        jdbc.sql(
                        "INSERT INTO refresh_session (token_hash, account_id, expires_at, revoked) VALUES (:hash, :account, :expires, FALSE)")
                .param("hash", tokenHash)
                .param("account", accountId)
                .param("expires", Timestamp.from(expiresAt))
                .update();
    }

    public Optional<RefreshRow> findRefresh(String tokenHash) {
        return jdbc.sql("SELECT account_id, expires_at, revoked FROM refresh_session WHERE token_hash = :hash")
                .param("hash", tokenHash)
                .query((rs, row) -> new RefreshRow(
                        rs.getObject("account_id", UUID.class),
                        rs.getTimestamp("expires_at").toInstant(),
                        rs.getBoolean("revoked")))
                .optional();
    }

    public void revokeRefresh(String tokenHash) {
        jdbc.sql("UPDATE refresh_session SET revoked = TRUE WHERE token_hash = :hash")
                .param("hash", tokenHash)
                .update();
    }

    public void savePin(UUID accountId, String pinHash, Instant now) {
        jdbc.sql(
                        """
                        INSERT INTO pin_credential (account_id, pin_hash, updated_at) VALUES (:id, :hash, :updated)
                        ON CONFLICT (account_id) DO UPDATE SET pin_hash = EXCLUDED.pin_hash, updated_at = EXCLUDED.updated_at
                        """)
                .param("id", accountId)
                .param("hash", pinHash)
                .param("updated", Timestamp.from(now))
                .update();
    }

    public Optional<String> pinHash(UUID accountId) {
        return jdbc.sql("SELECT pin_hash FROM pin_credential WHERE account_id = :id")
                .param("id", accountId)
                .query(String.class)
                .optional();
    }

    public void replaceSubtypes(UUID accountId, Set<StaffSubtype> subtypes) {
        jdbc.sql("DELETE FROM staff_subtype WHERE account_id = :id")
                .param("id", accountId)
                .update();
        for (StaffSubtype subtype : subtypes) {
            jdbc.sql("INSERT INTO staff_subtype (account_id, subtype) VALUES (:id, :subtype)")
                    .param("id", accountId)
                    .param("subtype", subtype.wire())
                    .update();
        }
    }

    public Set<StaffSubtype> subtypes(UUID accountId) {
        Set<StaffSubtype> subtypes = new LinkedHashSet<>();
        jdbc.sql("SELECT subtype FROM staff_subtype WHERE account_id = :id ORDER BY subtype")
                .param("id", accountId)
                .query((rs, row) -> StaffSubtype.parse(rs.getString("subtype")))
                .list()
                .forEach(subtype -> {
                    if (subtype != null) {
                        subtypes.add(subtype);
                    }
                });
        return subtypes;
    }

    public void replacePermissions(UUID accountId, Set<String> permissions) {
        jdbc.sql("DELETE FROM pharmacy_permission WHERE account_id = :id")
                .param("id", accountId)
                .update();
        for (String permission : permissions) {
            jdbc.sql("INSERT INTO pharmacy_permission (account_id, permission_key) VALUES (:id, :key)")
                    .param("id", accountId)
                    .param("key", permission)
                    .update();
        }
    }

    public Set<String> permissions(UUID accountId) {
        return new LinkedHashSet<>(jdbc.sql(
                        "SELECT permission_key FROM pharmacy_permission WHERE account_id = :id ORDER BY permission_key")
                .param("id", accountId)
                .query(String.class)
                .list());
    }

    private static String blank(String value) {
        return value == null ? "" : value;
    }

    private AccountRow account(java.sql.ResultSet rs, int row) throws java.sql.SQLException {
        return new AccountRow(
                rs.getObject("id", UUID.class),
                rs.getString("phone"),
                AccountType.parse(rs.getString("account_type")),
                rs.getString("display_name"),
                rs.getBoolean("disabled"));
    }
}
