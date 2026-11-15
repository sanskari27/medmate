package com.medmate.server.catalog;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.server.shared.error.ApiProblem;
import com.medmate.server.shared.web.PageQuery;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

public final class CatalogRules {

    public static final int MAX_IDS = 200;
    public static final int MAX_LIST = 200;

    private CatalogRules() {}

    public record Query(String text, int limit, String problem) {}

    public record Ids(List<String> ids, String problem) {}

    public record ParsedDrug(CatalogDocuments.DrugDetail draft, String problem) {}

    public record ParsedFmcg(CatalogDocuments.FmcgDetail draft, String problem) {}

    public enum Kind {
        BOTH,
        DRUG,
        FMCG
    }

    public enum NamePresence {
        ANY,
        MISSING,
        PRESENT
    }

    public enum Rx {
        ANY,
        YES,
        NO
    }

    public record Listing(
            Kind kind,
            String text,
            NamePresence displayName,
            Rx prescription,
            String form,
            String medicineType,
            String fmcgType,
            String marketer,
            int page,
            int size,
            String problem) {

        public boolean includeDrugs() {
            return kind != Kind.FMCG && fmcgType == null;
        }

        public boolean includeFmcg() {
            return kind != Kind.DRUG && prescription == Rx.ANY && medicineType == null;
        }

        private static Listing rejected(String problem) {
            return new Listing(null, null, null, null, null, null, null, null, 0, 0, problem);
        }
    }

    public static Query search(String rawQuery, String rawLimit) {
        String query = rawQuery == null ? "" : rawQuery.trim();
        if (query.length() < 2 || query.length() > 80) {
            return new Query(null, 0, "Query is not valid");
        }
        if (rawLimit == null || rawLimit.isBlank()) {
            return new Query(query, 20, null);
        }
        String limitText = rawLimit.trim();
        if (!limitText.chars().allMatch(Character::isDigit)) {
            return new Query(null, 0, "Query is not valid");
        }
        int limit;
        try {
            limit = Integer.parseInt(limitText);
        } catch (NumberFormatException exception) {
            return new Query(null, 0, "Query is not valid");
        }
        if (limit < 1) {
            return new Query(null, 0, "Query is not valid");
        }
        return new Query(query, Math.min(limit, 50), null);
    }

    public static Ids ids(String raw) {
        if (raw == null) {
            return new Ids(List.of(), "Product ids are not valid");
        }
        Set<String> seen = new LinkedHashSet<>();
        for (String piece : raw.split(",", -1)) {
            String id = piece.trim();
            if (id.isEmpty() || seen.contains(id)) {
                continue;
            }
            if (id.length() > 80 || seen.size() == MAX_IDS) {
                return new Ids(List.of(), "Product ids are not valid");
            }
            seen.add(id);
        }
        if (seen.isEmpty()) {
            return new Ids(List.of(), "Product ids are not valid");
        }
        return new Ids(List.copyOf(seen), null);
    }

    public static Listing list(
            String rawKind,
            String rawQuery,
            String rawDisplayName,
            String rawPrescription,
            String rawForm,
            String rawMedicineType,
            String rawFmcgType,
            String rawMarketer,
            String rawPage,
            String rawSize) {
        int page;
        int size;
        try {
            PageQuery parsed = PageQuery.parse(rawPage, rawSize);
            page = parsed.page();
            size = parsed.size();
        } catch (ApiProblem exception) {
            return Listing.rejected("Page is not valid");
        }
        Kind kind = kind(rawKind);
        if (kind == null) {
            return Listing.rejected("Filter is not valid");
        }
        String text = rawQuery == null ? "" : rawQuery.trim();
        if (text.length() > 80) {
            return Listing.rejected("Query is not valid");
        }
        NamePresence displayName = presence(rawDisplayName);
        Rx prescription = prescription(rawPrescription);
        if (displayName == null || prescription == null) {
            return Listing.rejected("Filter is not valid");
        }
        String form = filterText(rawForm);
        String medicineType = filterText(rawMedicineType);
        String fmcgType = filterText(rawFmcgType);
        String marketer = filterText(rawMarketer);
        if (form == INVALID || medicineType == INVALID || fmcgType == INVALID || marketer == INVALID) {
            return Listing.rejected("Filter is not valid");
        }
        return new Listing(
                kind,
                text.isEmpty() ? null : text,
                displayName,
                prescription,
                form,
                medicineType,
                fmcgType,
                marketer,
                page,
                size,
                null);
    }

    public static String pathId(String raw) {
        if (raw == null) {
            return null;
        }
        String id = raw.trim();
        if (id.isEmpty() || id.length() > 80) {
            return null;
        }
        return id;
    }

    public static String containsPattern(String query) {
        return "%" + likeLiteral(query) + "%";
    }

    public static String prefixPattern(String query) {
        return likeLiteral(query) + "%";
    }

    private static String likeLiteral(String query) {
        return query.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }

    public static ParsedDrug drug(JsonNode body, String expectedId) {
        try {
            return new ParsedDrug(readDrug(body, expectedId), null);
        } catch (Invalid exception) {
            return new ParsedDrug(null, "Product is not valid");
        }
    }

    public static ParsedFmcg fmcg(JsonNode body, String expectedId) {
        try {
            return new ParsedFmcg(readFmcg(body, expectedId), null);
        } catch (Invalid exception) {
            return new ParsedFmcg(null, "Product is not valid");
        }
    }

    private static CatalogDocuments.DrugDetail readDrug(JsonNode body, String expectedId) {
        requireObject(body);
        return new CatalogDocuments.DrugDetail(
                productId(body, expectedId),
                required(body, "productName"),
                optional(body, "displayName"),
                optional(body, "marketerName"),
                optional(body, "marketerAddress"),
                optional(body, "medicineType"),
                optional(body, "introduction"),
                optional(body, "benefits"),
                optional(body, "howToUse"),
                optional(body, "ifMiss"),
                optional(body, "packagingDetail"),
                optional(body, "package"),
                number(body, "qtyAmount"),
                optional(body, "qtyUnit"),
                optional(body, "qtyRaw"),
                optional(body, "productForm"),
                number(body, "mrp"),
                flag(body, "prescriptionRequired"),
                optional(body, "storage"),
                optional(body, "howItWorks"),
                optional(body, "countryOfOrigin"),
                optional(body, "sourceFile"),
                objects(body, "ingredients", CatalogRules::ingredient),
                objects(body, "safety", CatalogRules::safety),
                objects(body, "facts", CatalogRules::fact),
                strings(body, "uses"),
                strings(body, "sideEffects"),
                objects(body, "questions", CatalogRules::question),
                objects(body, "interactions", CatalogRules::interaction),
                strings(body, "images"));
    }

    private static CatalogDocuments.FmcgDetail readFmcg(JsonNode body, String expectedId) {
        requireObject(body);
        return new CatalogDocuments.FmcgDetail(
                productId(body, expectedId),
                required(body, "productName"),
                optional(body, "displayName"),
                optional(body, "marketingCompany"),
                optional(body, "type"),
                optional(body, "packaging"),
                optional(body, "package"),
                number(body, "qtyAmount"),
                optional(body, "qtyUnit"),
                optional(body, "qtyRaw"),
                optional(body, "productForm"),
                number(body, "mrp"),
                optional(body, "information"),
                optional(body, "directionsForUse"),
                optional(body, "countryOfOrigin"),
                optional(body, "marketerName"),
                optional(body, "marketerAddress"),
                optional(body, "sourceFile"),
                strings(body, "categories"),
                strings(body, "highlights"),
                strings(body, "ingredients"),
                strings(body, "benefits"),
                strings(body, "safety"),
                strings(body, "images"));
    }

    private static CatalogDocuments.DrugIngredient ingredient(JsonNode item) {
        return new CatalogDocuments.DrugIngredient(
                required(item, "name"), optional(item, "strength"), number(item, "amount"), optional(item, "unit"));
    }

    private static CatalogDocuments.DrugSafety safety(JsonNode item) {
        return new CatalogDocuments.DrugSafety(
                required(item, "topic"), optional(item, "level"), optional(item, "detail"));
    }

    private static CatalogDocuments.DrugFact fact(JsonNode item) {
        return new CatalogDocuments.DrugFact(required(item, "label"), optional(item, "value"));
    }

    private static CatalogDocuments.DrugQuestion question(JsonNode item) {
        return new CatalogDocuments.DrugQuestion(required(item, "question"), optional(item, "answer"));
    }

    private static CatalogDocuments.DrugInteraction interaction(JsonNode item) {
        return new CatalogDocuments.DrugInteraction(
                optional(item, "drug"),
                optional(item, "route"),
                optional(item, "severity"),
                optional(item, "otherProduct"),
                optional(item, "interactsWith"),
                optional(item, "detail"));
    }

    private static void requireObject(JsonNode body) {
        if (body == null || !body.isObject()) {
            throw new Invalid();
        }
    }

    private static String productId(JsonNode body, String expectedId) {
        String id = required(body, "productId");
        if (id.length() > 80 || (expectedId != null && !expectedId.equals(id))) {
            throw new Invalid();
        }
        return id;
    }

    private static String required(JsonNode node, String field) {
        String value = optional(node, field);
        if (value == null) {
            throw new Invalid();
        }
        return value;
    }

    private static String optional(JsonNode node, String field) {
        if (node == null) {
            throw new Invalid();
        }
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) {
            return null;
        }
        if (!value.isTextual()) {
            throw new Invalid();
        }
        String text = value.asText().trim();
        return text.isEmpty() ? null : text;
    }

    private static boolean flag(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || !value.isBoolean()) {
            throw new Invalid();
        }
        return value.booleanValue();
    }

    private static BigDecimal number(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) {
            return null;
        }
        if (!value.isNumber()) {
            throw new Invalid();
        }
        return value.decimalValue();
    }

    private static List<String> strings(JsonNode body, String field) {
        JsonNode node = list(body, field);
        List<String> values = new ArrayList<>();
        for (JsonNode item : node) {
            if (item == null || !item.isTextual()) {
                throw new Invalid();
            }
            String text = item.asText().trim();
            if (text.isEmpty()) {
                throw new Invalid();
            }
            values.add(text);
        }
        return List.copyOf(values);
    }

    private static <T> List<T> objects(JsonNode body, String field, java.util.function.Function<JsonNode, T> reader) {
        JsonNode node = list(body, field);
        List<T> values = new ArrayList<>();
        for (JsonNode item : node) {
            if (item == null || !item.isObject()) {
                throw new Invalid();
            }
            values.add(reader.apply(item));
        }
        return List.copyOf(values);
    }

    private static JsonNode list(JsonNode body, String field) {
        JsonNode node = body.get(field);
        if (node == null || node.isNull()) {
            return com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.arrayNode();
        }
        if (!node.isArray() || node.size() > MAX_LIST) {
            throw new Invalid();
        }
        return node;
    }

    private static final String INVALID = "\u0000";

    private static Kind kind(String raw) {
        String value = raw == null ? "" : raw.trim();
        return switch (value) {
            case "", "both" -> Kind.BOTH;
            case "drug" -> Kind.DRUG;
            case "fmcg" -> Kind.FMCG;
            default -> null;
        };
    }

    private static NamePresence presence(String raw) {
        String value = raw == null ? "" : raw.trim();
        return switch (value) {
            case "", "any" -> NamePresence.ANY;
            case "missing" -> NamePresence.MISSING;
            case "present" -> NamePresence.PRESENT;
            default -> null;
        };
    }

    private static Rx prescription(String raw) {
        String value = raw == null ? "" : raw.trim();
        return switch (value) {
            case "", "any" -> Rx.ANY;
            case "yes" -> Rx.YES;
            case "no" -> Rx.NO;
            default -> null;
        };
    }

    private static String filterText(String raw) {
        if (raw == null) {
            return null;
        }
        String text = raw.trim();
        if (text.isEmpty()) {
            return null;
        }
        if (text.length() > 80) {
            return INVALID;
        }
        return text;
    }

    private static final class Invalid extends RuntimeException {}
}
