package com.medmate.servercore.master;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medmate.servercore.kernel.ApiError;
import com.medmate.servercore.kernel.PhoneNumbers;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class ConsultationService {
    private final JdbcTemplate jdbc;
    private final ObjectMapper mapper;

    public ConsultationService(JdbcTemplate jdbc, ObjectMapper mapper) {
        this.jdbc = jdbc;
        this.mapper = mapper;
    }

    public ObjectNode book(JsonNode body) {
        try {
            if (body != null && !body.path("companyWebsite").asText("").trim().isEmpty()) {
                return mapper.createObjectNode().put("ok", true);
            }
            String name = body == null ? "" : body.path("name").asText("").trim();
            if (name.length() > 80) {
                name = name.substring(0, 80);
            }
            String phone = body == null ? "" : body.path("phone").asText("").replaceAll("\\D", "");
            String area = clip(body == null ? "" : body.path("area").asText(""), 80);
            String note = clip(body == null ? "" : body.path("note").asText(""), 400);
            if (name.length() < 2) {
                throw new ApiError(400, "VALIDATION", "Enter your name");
            }
            if (!phone.matches("[6-9]\\d{9}")) {
                throw new ApiError(400, "VALIDATION", "Enter a 10-digit mobile number");
            }
            jdbc.update("INSERT INTO consultations (name, phone, area, note) VALUES (?,?,?,?)", name, PhoneNumbers.e164(phone), area, note);
            return mapper.createObjectNode().put("ok", true);
        } catch (ApiError error) {
            throw error;
        } catch (RuntimeException exception) {
            throw new ApiError(500, "VALIDATION", "Could not save the booking");
        }
    }

    public JsonNode list() {
        var rows = jdbc.query("SELECT id, name, phone, area, note, status, at FROM consultations ORDER BY at DESC LIMIT 200",
                (row, index) -> {
                    ObjectNode item = mapper.createObjectNode();
                    item.put("id", row.getLong("id"));
                    item.put("name", row.getString("name"));
                    item.put("phone", row.getString("phone"));
                    item.put("area", row.getString("area"));
                    item.put("note", row.getString("note"));
                    item.put("status", row.getString("status"));
                    item.put("at", row.getTimestamp("at").toInstant().toString());
                    return item;
                });
        var list = mapper.createArrayNode();
        rows.forEach(list::add);
        return list;
    }

    public ObjectNode mark(String id, JsonNode body) {
        String status = body == null ? "" : body.path("status").asText();
        if (!"handled".equals(status) && !"open".equals(status)) {
            throw new ApiError(400, "VALIDATION", "Choose a status");
        }
        int updated = jdbc.update("UPDATE consultations SET status = ? WHERE id = ?", status, Long.parseLong(id));
        if (updated == 0) {
            throw new ApiError(404, "NOT_FOUND", "Booking not found");
        }
        return mapper.createObjectNode().put("ok", true);
    }

    private static String clip(String value, int limit) {
        String trimmed = value == null ? "" : value.trim();
        return trimmed.length() > limit ? trimmed.substring(0, limit) : trimmed;
    }
}
