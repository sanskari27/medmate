package com.medmate.servercore.files;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.TextNode;
import java.sql.Connection;
import java.util.Base64;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class FileStore {
    private static final Pattern DATA_URL = Pattern.compile("^data:([^;,]+)?((?:;[^,]*)*),([\\s\\S]*)$");
    private final JdbcTemplate jdbc;
    private final ObjectStorage storage;

    public FileStore(JdbcTemplate jdbc, ObjectStorage storage) {
        this.jdbc = jdbc;
        this.storage = storage;
    }

    public record StoredFile(String contentType, byte[] bytes) {
    }

    public StoredFile read(String id, UUID pharmacyId) {
        return jdbc.query("""
                SELECT content_type, bytes, s3_key FROM files WHERE id = ? AND pharmacy_id = ?
                """, result -> {
            if (!result.next()) {
                return null;
            }
            String key = result.getString("s3_key");
            byte[] bytes = key != null && storage.enabled() ? storage.read(key) : result.getBytes("bytes");
            return new StoredFile(result.getString("content_type"), bytes == null ? new byte[0] : bytes);
        }, id, pharmacyId);
    }

    public JsonNode absorb(Connection connection, UUID pharmacyId, JsonNode node) throws Exception {
        if (node == null || node.isNull()) {
            return node;
        }
        if (node.isTextual()) {
            String value = node.asText();
            if (value.startsWith("/api/v1/files/")) {
                return TextNode.valueOf("file:" + value.substring("/api/v1/files/".length()));
            }
            if (!value.startsWith("data:")) {
                return node;
            }
            Matcher matcher = DATA_URL.matcher(value);
            if (!matcher.matches()) {
                return node;
            }
            String type = matcher.group(1) == null || matcher.group(1).isEmpty() ? "application/octet-stream" : matcher.group(1);
            String payload = matcher.group(3);
            byte[] bytes = matcher.group(2) != null && matcher.group(2).contains("base64")
                    ? Base64.getDecoder().decode(payload)
                    : java.net.URLDecoder.decode(payload, java.nio.charset.StandardCharsets.UTF_8).getBytes(java.nio.charset.StandardCharsets.UTF_8);
            String id = UUID.randomUUID().toString();
            put(connection, pharmacyId, id, type, bytes);
            return TextNode.valueOf("file:" + id);
        }
        if (node.isArray()) {
            ArrayNode out = JsonNodeFactory.instance.arrayNode();
            for (JsonNode item : node) {
                out.add(absorb(connection, pharmacyId, item));
            }
            return out;
        }
        if (!node.isObject()) {
            return node;
        }
        ObjectNode out = JsonNodeFactory.instance.objectNode();
        var fields = node.fields();
        while (fields.hasNext()) {
            var entry = fields.next();
            out.set(entry.getKey(), absorb(connection, pharmacyId, entry.getValue()));
        }
        return out;
    }

    private void put(Connection connection, UUID pharmacyId, String id, String type, byte[] bytes) throws Exception {
        if (storage.enabled()) {
            String key = storage.put(pharmacyId, id, type, bytes);
            try (var statement = connection.prepareStatement("INSERT INTO files (id, pharmacy_id, content_type, s3_key) VALUES (?,?,?,?)")) {
                statement.setString(1, id);
                statement.setObject(2, pharmacyId);
                statement.setString(3, type);
                statement.setString(4, key);
                statement.executeUpdate();
            }
            return;
        }
        try (var statement = connection.prepareStatement("INSERT INTO files (id, pharmacy_id, content_type, bytes) VALUES (?,?,?,?)")) {
            statement.setString(1, id);
            statement.setObject(2, pharmacyId);
            statement.setString(3, type);
            statement.setBytes(4, bytes);
            statement.executeUpdate();
        }
    }
}
