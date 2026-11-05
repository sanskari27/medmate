package com.medmate.servercore.pharmacy.store;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medmate.servercore.kernel.PhoneNumbers;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

public final class StaffPhones {
    private StaffPhones() {
    }

    public static void sync(Connection connection, UUID pharmacyId, ObjectNode state) throws SQLException {
        Map<String, String> hashes = new HashMap<>();
        try (PreparedStatement statement = connection.prepareStatement("SELECT phone, login_pin_hash FROM staff_phones WHERE pharmacy_id = ?")) {
            statement.setObject(1, pharmacyId);
            try (ResultSet rows = statement.executeQuery()) {
                while (rows.next()) {
                    hashes.put(rows.getString("phone"), rows.getString("login_pin_hash"));
                }
            }
        }
        try (PreparedStatement delete = connection.prepareStatement("DELETE FROM staff_phones WHERE pharmacy_id = ?")) {
            delete.setObject(1, pharmacyId);
            delete.executeUpdate();
        }
        JsonNode users = state.get("users");
        if (users == null || !users.isArray()) {
            return;
        }
        for (JsonNode user : users) {
            String phone = user.path("phone").asText("");
            if (phone.isBlank() || (user.has("active") && !user.get("active").asBoolean(true))) {
                continue;
            }
            String normalized = PhoneNumbers.e164(phone);
            try (PreparedStatement savepoint = connection.prepareStatement("SAVEPOINT staff_phone")) {
                savepoint.execute();
            }
            try (PreparedStatement insert = connection.prepareStatement(
                    "INSERT INTO staff_phones (phone, pharmacy_id, user_id, login_pin_hash) VALUES (?,?,?,?)")) {
                insert.setString(1, normalized);
                insert.setObject(2, pharmacyId);
                insert.setString(3, user.path("id").asText());
                insert.setString(4, hashes.get(normalized));
                insert.executeUpdate();
                try (PreparedStatement release = connection.prepareStatement("RELEASE SAVEPOINT staff_phone")) {
                    release.execute();
                }
            } catch (SQLException exception) {
                try (PreparedStatement rollback = connection.prepareStatement("ROLLBACK TO SAVEPOINT staff_phone")) {
                    rollback.execute();
                }
                if (!"23505".equals(exception.getSQLState())) {
                    throw exception;
                }
            }
        }
    }
}
