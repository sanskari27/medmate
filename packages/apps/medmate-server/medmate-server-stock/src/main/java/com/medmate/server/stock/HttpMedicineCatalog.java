package com.medmate.server.stock;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
@Profile({"local", "prod"})
public class HttpMedicineCatalog implements MedicineCatalog {

    private final RestClient http;
    private final ObjectMapper json;

    public HttpMedicineCatalog(@Value("${medmate.medicine-data.base-url}") String baseUrl, ObjectMapper json) {
        String root = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.http = RestClient.builder().baseUrl(root).build();
        this.json = json;
    }

    @Override
    public List<MedicineHit> search(String query, int limit) {
        JsonNode body = get("/api/search?q=" + encode(query) + "&limit=" + limit);
        List<MedicineHit> hits = new ArrayList<>();
        addHits(hits, body.get("drug"));
        addHits(hits, body.get("fmcg"));
        return hits;
    }

    @Override
    public Lookup lookup(List<String> ids) {
        JsonNode body = get("/api/products?ids=" + encode(String.join(",", ids)));
        List<Snapshot> products = new ArrayList<>();
        List<String> ambiguous = new ArrayList<>();
        for (String id : ids) {
            JsonNode drug = find(body.get("drug"), id);
            JsonNode fmcg = find(body.get("fmcg"), id);
            if (drug != null && fmcg != null) {
                ambiguous.add(id);
            } else if (drug != null) {
                products.add(snapshot(drug, true));
            } else if (fmcg != null) {
                products.add(snapshot(fmcg, false));
            }
        }
        List<String> missing = new ArrayList<>();
        if (body.get("missing") != null && body.get("missing").isArray()) {
            for (JsonNode id : body.get("missing")) {
                missing.add(id.asText());
            }
        }
        return new Lookup(products, missing, ambiguous);
    }

    private JsonNode get(String path) {
        try {
            String raw = http.get().uri(path).retrieve().body(String.class);
            if (raw == null || raw.isBlank()) {
                throw new CatalogUnavailable();
            }
            return json.readTree(raw);
        } catch (CatalogUnavailable exception) {
            throw exception;
        } catch (RestClientException | java.io.IOException exception) {
            throw new CatalogUnavailable();
        }
    }

    private static void addHits(List<MedicineHit> hits, JsonNode rows) {
        if (rows == null || !rows.isArray()) {
            return;
        }
        for (JsonNode row : rows) {
            hits.add(new MedicineHit(
                    text(row, "productId"),
                    name(row),
                    blank(text(row, "marketerName")),
                    blank(text(row, "package")),
                    money(row.get("mrp"))));
        }
    }

    private static Snapshot snapshot(JsonNode row, boolean drug) {
        return new Snapshot(
                text(row, "productId"),
                name(row),
                blank(text(row, "marketerName")),
                drug ? drugComposition(row.get("ingredients")) : textList(row.get("ingredients")),
                blank(text(row, "productForm")),
                pack(row, drug),
                blank(text(row, drug ? "medicineType" : "type")),
                money(row.get("mrp")));
    }

    private static String pack(JsonNode row, boolean drug) {
        String packaged = blank(text(row, "package"));
        if (packaged != null) {
            return packaged;
        }
        return blank(text(row, drug ? "packagingDetail" : "packaging"));
    }

    private static String drugComposition(JsonNode ingredients) {
        if (ingredients == null || !ingredients.isArray()) {
            return null;
        }
        List<String> parts = new ArrayList<>();
        for (JsonNode item : ingredients) {
            String name = text(item, "name");
            if (name.isEmpty()) {
                continue;
            }
            String strength = text(item, "strength");
            parts.add(strength.isEmpty() ? name : name + " " + strength);
        }
        return parts.isEmpty() ? null : String.join(", ", parts);
    }

    private static String textList(JsonNode ingredients) {
        if (ingredients == null || !ingredients.isArray()) {
            return null;
        }
        List<String> parts = new ArrayList<>();
        for (JsonNode item : ingredients) {
            String value = item == null || item.isNull() ? "" : item.asText().trim();
            if (!value.isEmpty()) {
                parts.add(value);
            }
        }
        return parts.isEmpty() ? null : String.join(", ", parts);
    }

    private static JsonNode find(JsonNode rows, String id) {
        if (rows == null || !rows.isArray()) {
            return null;
        }
        for (JsonNode row : rows) {
            if (id.equals(text(row, "productId"))) {
                return row;
            }
        }
        return null;
    }

    private static String name(JsonNode row) {
        String name = text(row, "productName");
        return name.isEmpty() ? text(row, "productId") : name;
    }

    private static BigDecimal money(JsonNode node) {
        if (node == null || node.isNull() || !node.isNumber()) {
            return null;
        }
        return new BigDecimal(node.asText());
    }

    private static String blank(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private static String text(JsonNode body, String field) {
        if (body == null || body.get(field) == null || body.get(field).isNull()) {
            return "";
        }
        return body.get(field).asText().trim();
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
