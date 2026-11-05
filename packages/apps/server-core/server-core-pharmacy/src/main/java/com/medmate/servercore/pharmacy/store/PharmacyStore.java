package com.medmate.servercore.pharmacy.store;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medmate.servercore.files.FileStore;
import com.medmate.servercore.identity.SecretHashes;
import com.medmate.servercore.kernel.ApiBodies;
import com.medmate.servercore.kernel.ApiError;
import com.medmate.servercore.kernel.MoneyCodec;
import com.medmate.servercore.kernel.PhoneNumbers;
import java.security.SecureRandom;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.UUID;
import java.util.function.BiFunction;
import java.util.function.Function;
import javax.sql.DataSource;
import org.postgresql.util.PGobject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class PharmacyStore {
    private final DataSource dataSource;
    private final ObjectMapper mapper;
    private final FileStore files;
    private final boolean configuredProduction;

    public PharmacyStore(DataSource dataSource, ObjectMapper mapper, FileStore files,
                         @Value("${app.production:false}") boolean configuredProduction) {
        this.dataSource = dataSource;
        this.mapper = mapper;
        this.files = files;
        this.configuredProduction = configuredProduction;
    }

    public record Saved(int status, JsonNode body) {
    }

    public boolean production() {
        if ("production".equals(System.getenv("NODE_ENV"))) {
            return true;
        }
        return "true".equalsIgnoreCase(System.getenv("APP_PRODUCTION")) || configuredProduction;
    }

    public Created insert(String phone, String businessType, ObjectNode state) {
        UUID id = UUID.randomUUID();
        String pin = String.valueOf(100000 + new SecureRandom().nextInt(900000));
        try (Connection connection = dataSource.getConnection()) {
            connection.setAutoCommit(false);
            try {
                try (PreparedStatement statement = connection.prepareStatement(
                        "INSERT INTO pharmacies (id, phone, business_type, setup_complete, pricing_pin, state) VALUES (?,?,?,?,?,?)")) {
                    statement.setObject(1, id);
                    statement.setString(2, PhoneNumbers.e164(phone));
                    statement.setString(3, businessType);
                    statement.setBoolean(4, state.path("setupComplete").asBoolean(false));
                    statement.setString(5, pin);
                    statement.setObject(6, jsonb(MoneyCodec.toPaise(state)));
                    statement.executeUpdate();
                }
                StaffPhones.sync(connection, id, state);
                connection.commit();
            } catch (Exception exception) {
                connection.rollback();
                throw exception instanceof RuntimeException runtime ? runtime : new IllegalStateException(exception);
            }
        } catch (RuntimeException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new IllegalStateException(exception);
        }
        return new Created(id, pin);
    }

    public ObjectNode load(UUID pharmacyId) {
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement("SELECT state FROM pharmacies WHERE id = ?")) {
            statement.setObject(1, pharmacyId);
            try (ResultSet rows = statement.executeQuery()) {
                if (!rows.next()) {
                    throw new ApiError(404, "NOT_FOUND", "Pharmacy not found");
                }
                ObjectNode state = readState(rows.getString("state"));
                DocumentMaintenance.touch(state);
                if (DocumentMaintenance.stripDemo(mapper, state, production())) {
                    replace(pharmacyId, state);
                }
                return state;
            }
        } catch (RuntimeException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new IllegalStateException(exception);
        }
    }

    public void replace(UUID pharmacyId, ObjectNode next) {
        withState(pharmacyId, (current, connection) -> {
            ObjectNode copy = next.deepCopy();
            current.removeAll();
            copy.fields().forEachRemaining(entry -> current.set(entry.getKey(), entry.getValue()));
            return null;
        });
    }

    public <T> T withState(UUID pharmacyId, BiFunction<ObjectNode, Connection, T> action) {
        try (Connection connection = dataSource.getConnection()) {
            connection.setAutoCommit(false);
            try {
                ObjectNode state = lockState(connection, pharmacyId);
                DocumentMaintenance.touch(state);
                DocumentMaintenance.stripDemo(mapper, state, production());
                T result = action.apply(state, connection);
                save(connection, pharmacyId, state);
                connection.commit();
                return result;
            } catch (Exception exception) {
                connection.rollback();
                throw exception instanceof RuntimeException runtime ? runtime : new IllegalStateException(exception);
            }
        } catch (RuntimeException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new IllegalStateException(exception);
        }
    }

    public Saved withIdempotent(UUID pharmacyId, String key, String hash, Function<ObjectNode, JsonNode> action) {
        try (Connection connection = dataSource.getConnection()) {
            connection.setAutoCommit(false);
            try {
                ObjectNode state = lockState(connection, pharmacyId);
                try (PreparedStatement previous = connection.prepareStatement(
                        "SELECT request_hash, status, body::text AS body FROM idempotency WHERE pharmacy_id = ? AND key = ?")) {
                    previous.setObject(1, pharmacyId);
                    previous.setString(2, key);
                    try (ResultSet rows = previous.executeQuery()) {
                        if (rows.next()) {
                            if (!hash.equals(rows.getString("request_hash"))) {
                                throw new ApiError(409, "IDEMPOTENCY_REPLAY", "This idempotency key was already used for a different request");
                            }
                            connection.commit();
                            return new Saved(rows.getInt("status"), mapper.readTree(rows.getString("body")));
                        }
                    }
                }
                DocumentMaintenance.touch(state);
                JsonNode result = action.apply(state);
                save(connection, pharmacyId, state);
                JsonNode encoded = ApiBodies.encode(result);
                try (PreparedStatement insert = connection.prepareStatement(
                        "INSERT INTO idempotency (pharmacy_id, key, request_hash, status, body) VALUES (?,?,?,?,?)")) {
                    insert.setObject(1, pharmacyId);
                    insert.setString(2, key);
                    insert.setString(3, hash);
                    insert.setInt(4, 200);
                    insert.setObject(5, jsonb(encoded));
                    insert.executeUpdate();
                }
                connection.commit();
                return new Saved(200, encoded);
            } catch (Exception exception) {
                connection.rollback();
                throw exception instanceof RuntimeException runtime ? runtime : new IllegalStateException(exception);
            }
        } catch (RuntimeException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new IllegalStateException(exception);
        }
    }

    public static String requestHash(String method, String path, String raw) {
        return SecretHashes.sha256(method + " " + path + "\n" + (raw == null ? "" : raw));
    }

    private ObjectNode lockState(Connection connection, UUID pharmacyId) throws Exception {
        try (PreparedStatement statement = connection.prepareStatement("SELECT state::text AS state FROM pharmacies WHERE id = ? FOR UPDATE")) {
            statement.setObject(1, pharmacyId);
            try (ResultSet rows = statement.executeQuery()) {
                if (!rows.next()) {
                    throw new ApiError(404, "NOT_FOUND", "Pharmacy not found");
                }
                return readState(rows.getString("state"));
            }
        }
    }

    private void save(Connection connection, UUID pharmacyId, ObjectNode state) throws Exception {
        JsonNode stored = files.absorb(connection, pharmacyId, state);
        if (!(stored instanceof ObjectNode object)) {
            throw new IllegalStateException("Pharmacy state must stay an object");
        }
        state.removeAll();
        object.fields().forEachRemaining(entry -> state.set(entry.getKey(), entry.getValue()));
        try (PreparedStatement statement = connection.prepareStatement(
                "UPDATE pharmacies SET state = ?, setup_complete = ?, business_type = ?, updated_at = now() WHERE id = ?")) {
            statement.setObject(1, jsonb(MoneyCodec.toPaise(state)));
            statement.setBoolean(2, state.path("setupComplete").asBoolean(false));
            statement.setString(3, state.path("businessType").asText("pharmacy"));
            statement.setObject(4, pharmacyId);
            statement.executeUpdate();
        }
        StaffPhones.sync(connection, pharmacyId, state);
    }

    private ObjectNode readState(String json) throws Exception {
        JsonNode parsed = mapper.readTree(json);
        JsonNode rupees = MoneyCodec.fromPaise(parsed);
        if (!(rupees instanceof ObjectNode object)) {
            throw new ApiError(500, "VALIDATION", "Pharmacy state is unreadable");
        }
        return object;
    }

    private PGobject jsonb(JsonNode node) throws Exception {
        PGobject value = new PGobject();
        value.setType("jsonb");
        value.setValue(mapper.writeValueAsString(node));
        return value;
    }

    public record Created(UUID id, String pricingPin) {
    }
}
