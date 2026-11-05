package com.medmate.servercore.kernel;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public final class PurchaseSheets {
    private static final Map<String, String[]> COLUMNS = columnMap();

    private PurchaseSheets() {
    }

    public static ObjectNode parsePurchase(ObjectMapper mapper, String text, ArrayNode inventory) {
        return parseLines(mapper, text, inventory, true);
    }

    public static ObjectNode parseMedicines(ObjectMapper mapper, String text) {
        List<String[]> rows = CsvTables.parse(text);
        ObjectNode result = mapper.createObjectNode();
        ArrayNode products = result.putArray("products");
        ArrayNode errors = result.putArray("errors");
        if (rows.size() < 2) {
            errors.add("Sheet is empty or has no data rows.");
            return result;
        }
        Map<String, Integer> index = headerIndex(rows.get(0));
        if (index.get("name") < 0) {
            errors.add("No Product column found. Download the sample sheet.");
            return result;
        }
        for (int rowIndex = 1; rowIndex < rows.size(); rowIndex++) {
            String[] row = rows.get(rowIndex);
            String name = cell(row, index, "name");
            if (name.isEmpty()) {
                errors.add("Row " + (rowIndex + 1) + " has no product name.");
                continue;
            }
            double quantity = CsvTables.num(cell(row, index, "qty"));
            String batch = cell(row, index, "batch");
            String gstRaw = cell(row, index, "gst");
            ObjectNode product = products.addObject();
            product.put("id", "");
            product.put("name", name);
            product.put("composition", cell(row, index, "composition"));
            product.put("manufacturer", cell(row, index, "manufacturer"));
            product.put("form", formOf(cell(row, index, "form")));
            product.put("pack", cell(row, index, "pack"));
            product.put("category", categoryOf(cell(row, index, "category")));
            product.put("hsn", blankDefault(cell(row, index, "hsn"), "3004"));
            product.put("gst", gstRaw.isEmpty() ? 12 : CsvTables.num(gstRaw));
            product.put("schedule", scheduleOf(cell(row, index, "schedule")));
            product.put("rack", blankDefault(cell(row, index, "rack"), "—"));
            product.put("reorderLevel", CsvTables.num(cell(row, index, "reorder")) == 0 ? 20 : CsvTables.num(cell(row, index, "reorder")));
            product.put("online", false);
            ArrayNode batches = product.putArray("batches");
            if (!batch.isEmpty() || quantity > 0) {
                ObjectNode lot = batches.addObject();
                lot.put("batchNo", batch.isEmpty() ? "OPENING" : batch);
                lot.put("expiry", blankDefault(cell(row, index, "expiry"), "2027-12"));
                lot.put("qty", quantity);
                lot.put("ptr", CsvTables.num(cell(row, index, "ptr")));
                lot.put("mrp", CsvTables.num(cell(row, index, "mrp")));
            }
        }
        return result;
    }

    public static ObjectNode parseOrders(ObjectMapper mapper, String text) {
        List<String[]> table = CsvTables.parse(text);
        ObjectNode result = mapper.createObjectNode();
        ArrayNode rows = result.putArray("rows");
        ArrayNode errors = result.putArray("errors");
        if (table.size() < 2) {
            errors.add("Sheet is empty or has no data rows.");
            return result;
        }
        String[] header = new String[table.get(0).length];
        for (int index = 0; index < header.length; index++) {
            header[index] = CsvTables.norm(table.get(0)[index]);
        }
        int supplier = at(header, "distributor", "supplier", "suppliername", "vendor");
        int name = at(header, "product", "productname", "name", "medicine", "item");
        int quantity = at(header, "qty", "quantity", "units");
        int note = at(header, "note", "notes", "remark");
        if (supplier < 0 || name < 0 || quantity < 0) {
            errors.add("Need Distributor, Product, and Qty columns. Download the sample sheet.");
            return result;
        }
        for (int index = 1; index < table.size(); index++) {
            String[] row = table.get(index);
            String supplierName = cellAt(row, supplier);
            String productName = cellAt(row, name);
            double count = CsvTables.num(cellAt(row, quantity));
            if (supplierName.isEmpty() || productName.isEmpty() || count <= 0) {
                errors.add("Row " + (index + 1) + " needs a distributor, medicine, and quantity.");
                continue;
            }
            ObjectNode parsed = rows.addObject();
            parsed.put("supplierName", supplierName);
            parsed.put("productName", productName);
            parsed.put("qty", count);
            if (note >= 0) {
                parsed.put("note", cellAt(row, note));
            }
        }
        return result;
    }

    private static ObjectNode parseLines(ObjectMapper mapper, String text, ArrayNode inventory, boolean purchase) {
        List<String[]> rows = CsvTables.parse(text);
        ObjectNode result = mapper.createObjectNode();
        ArrayNode items = result.putArray("items");
        ArrayNode errors = result.putArray("errors");
        result.put("matched", 0);
        result.put("created", 0);
        result.put("skipped", 0);
        if (rows.size() < 2) {
            errors.add("CSV is empty or has no data rows.");
            return result;
        }
        Map<String, Integer> index = headerIndex(rows.get(0));
        if (index.get("name") < 0) {
            errors.add("No 'Product Name' column found. Download the template for the expected format.");
            return result;
        }
        int matched = 0;
        int created = 0;
        int skipped = 0;
        for (int rowIndex = 1; rowIndex < rows.size(); rowIndex++) {
            String[] row = rows.get(rowIndex);
            String name = cell(row, index, "name");
            if (name.isEmpty()) {
                skipped++;
                continue;
            }
            ObjectNode product = findProduct(inventory, name);
            double quantity = CsvTables.num(cell(row, index, "qty"));
            double free = CsvTables.num(cell(row, index, "free"));
            if (quantity <= 0 && free <= 0) {
                errors.add("Row " + (rowIndex + 1) + " (" + name + "): quantity is 0.");
            }
            if (product != null) {
                matched++;
            } else {
                created++;
            }
            ObjectNode item = items.addObject();
            if (product == null) {
                item.putNull("productId");
            } else {
                item.put("productId", product.path("id").asText());
            }
            item.put("name", product == null ? name : product.path("name").asText());
            item.put("batchNo", cell(row, index, "batch"));
            item.put("expiry", blankDefault(cell(row, index, "expiry"), "2027-06"));
            item.put("qty", quantity);
            item.put("freeQty", free);
            item.put("ptr", firstPositive(CsvTables.num(cell(row, index, "ptr")), product == null ? 0 : firstBatch(product, "ptr")));
            item.put("mrp", firstPositive(CsvTables.num(cell(row, index, "mrp")), product == null ? 0 : firstBatch(product, "mrp")));
            item.put("gst", firstPositive(CsvTables.num(cell(row, index, "gst")), product == null ? 12 : product.path("gst").asDouble(12)));
            item.put("hsn", blankDefault(cell(row, index, "hsn"), product == null ? "3004" : blankDefault(product.path("hsn").asText(), "3004")));
            String composition = cell(row, index, "composition");
            if (!composition.isEmpty()) {
                item.put("composition", composition);
            }
            String manufacturer = cell(row, index, "manufacturer");
            if (!manufacturer.isEmpty()) {
                item.put("manufacturer", manufacturer);
            }
            item.put("form", formOf(cell(row, index, "form")));
            String pack = cell(row, index, "pack");
            if (!pack.isEmpty()) {
                item.put("pack", pack);
            }
            item.put("category", categoryOf(cell(row, index, "category")));
            item.put("schedule", scheduleOf(cell(row, index, "schedule")));
            double reorder = CsvTables.num(cell(row, index, "reorder"));
            item.put("reorderLevel", reorder == 0 ? 20 : reorder);
        }
        result.put("matched", matched);
        result.put("created", created);
        result.put("skipped", skipped);
        return result;
    }

    private static double firstPositive(double given, double fallback) {
        return given == 0 ? fallback : given;
    }

    private static double firstBatch(ObjectNode product, String field) {
        var batches = Nodes.array(product, "batches");
        if (batches == null || batches.isEmpty()) {
            return 0;
        }
        return batches.get(0).path(field).asDouble();
    }

    private static ObjectNode findProduct(ArrayNode inventory, String name) {
        if (inventory == null) {
            return null;
        }
        String folded = CsvTables.norm(name);
        for (var node : inventory) {
            if (node instanceof ObjectNode product && CsvTables.norm(product.path("name").asText()).equals(folded)) {
                return product;
            }
        }
        return null;
    }

    private static Map<String, Integer> headerIndex(String[] header) {
        String[] folded = new String[header.length];
        for (int index = 0; index < header.length; index++) {
            folded[index] = CsvTables.norm(header[index]);
        }
        Map<String, Integer> index = new LinkedHashMap<>();
        for (var entry : COLUMNS.entrySet()) {
            int found = -1;
            for (int column = 0; column < folded.length; column++) {
                for (String alias : entry.getValue()) {
                    if (alias.equals(folded[column])) {
                        found = column;
                        break;
                    }
                }
                if (found >= 0) {
                    break;
                }
            }
            index.put(entry.getKey(), found);
        }
        return index;
    }

    private static String cell(String[] row, Map<String, Integer> index, String key) {
        int at = index.getOrDefault(key, -1);
        return cellAt(row, at);
    }

    private static String cellAt(String[] row, int index) {
        if (index < 0 || row == null || index >= row.length || row[index] == null) {
            return "";
        }
        return row[index].trim();
    }

    private static int at(String[] header, String... aliases) {
        for (int index = 0; index < header.length; index++) {
            for (String alias : aliases) {
                if (alias.equals(header[index])) {
                    return index;
                }
            }
        }
        return -1;
    }

    private static String blankDefault(String value, String fallback) {
        return value == null || value.isEmpty() ? fallback : value;
    }

    private static String categoryOf(String value) {
        String folded = CsvTables.norm(value);
        Map<String, String> categories = Map.ofEntries(
                Map.entry("fever", "fever"), Map.entry("feverpain", "fever"),
                Map.entry("cold", "cold"), Map.entry("coughcold", "cold"),
                Map.entry("diabetes", "diabetes"), Map.entry("heart", "heart"), Map.entry("heartbp", "heart"),
                Map.entry("stomach", "stomach"), Map.entry("vitamins", "vitamins"),
                Map.entry("skin", "skin"), Map.entry("skincare", "skin"),
                Map.entry("baby", "baby"), Map.entry("babycare", "baby"),
                Map.entry("devices", "devices"), Map.entry("personal", "personal"),
                Map.entry("ayush", "ayush"), Map.entry("ayurveda", "ayush"),
                Map.entry("firstaid", "firstaid"));
        return categories.getOrDefault(folded, folded.isEmpty() ? "fever" : "fever");
    }

    private static String scheduleOf(String value) {
        String folded = CsvTables.norm(value);
        if (folded.isEmpty()) {
            return "OTC";
        }
        if (folded.contains("otc")) {
            return "OTC";
        }
        if (folded.equals("h1") || folded.contains("h1")) {
            return "H1";
        }
        if (folded.equals("x")) {
            return "X";
        }
        if (folded.startsWith("h")) {
            return "H";
        }
        return "OTC";
    }

    private static String formOf(String value) {
        return switch (CsvTables.norm(value)) {
            case "capsule", "cap" -> "Capsule";
            case "syrup" -> "Syrup";
            case "drops" -> "Drops";
            case "injection", "inj" -> "Injection";
            case "cream", "gel", "ointment" -> "Cream";
            case "device" -> "Device";
            case "other" -> "Other";
            default -> "Tablet";
        };
    }

    private static Map<String, String[]> columnMap() {
        Map<String, String[]> columns = new LinkedHashMap<>();
        columns.put("name", new String[]{"product", "productname", "name", "medicine", "item", "description"});
        columns.put("composition", new String[]{"composition", "salt", "molecule", "generic"});
        columns.put("manufacturer", new String[]{"manufacturer", "mfr", "company", "brand"});
        columns.put("category", new String[]{"category", "cat"});
        columns.put("schedule", new String[]{"schedule", "sch", "scheduletype", "rxscheduletype"});
        columns.put("form", new String[]{"form", "dosageform", "type", "productform"});
        columns.put("pack", new String[]{"pack", "packing", "packsize", "packagingdetail"});
        columns.put("hsn", new String[]{"hsn", "hsncode"});
        columns.put("gst", new String[]{"gst", "gstpercent", "gstrate", "tax"});
        columns.put("batch", new String[]{"batch", "batchno", "batchnumber", "lot"});
        columns.put("expiry", new String[]{"expiry", "exp", "expirydate", "expdate"});
        columns.put("qty", new String[]{"qty", "quantity", "billedqty", "units", "totalquantity"});
        columns.put("free", new String[]{"free", "freeqty", "freegoods", "scheme", "bonus"});
        columns.put("ptr", new String[]{"ptr", "rate", "purchaserate", "cost", "price", "buyprice"});
        columns.put("mrp", new String[]{"mrp", "maxretailprice"});
        columns.put("reorder", new String[]{"reorder", "reorderlevel", "minstock"});
        columns.put("rack", new String[]{"rack", "location", "bin"});
        return columns;
    }
}
