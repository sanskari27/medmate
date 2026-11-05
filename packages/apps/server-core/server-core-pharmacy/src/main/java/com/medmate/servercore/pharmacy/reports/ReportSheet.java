package com.medmate.servercore.pharmacy.reports;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

final class ReportSheet {
    private final ObjectNode node;
    private final ArrayNode rows;

    ReportSheet(ObjectMapper mapper) {
        node = mapper.createObjectNode();
        node.putArray("columns");
        rows = node.putArray("rows");
    }

    ReportSheet columns(String... specs) {
        ArrayNode columns = (ArrayNode) node.get("columns");
        for (String spec : specs) {
            String[] parts = spec.split("\\|");
            ObjectNode column = columns.addObject();
            column.put("key", parts[0]);
            column.put("label", parts[1]);
            if (parts.length > 2 && "money".equals(parts[2])) {
                column.put("money", true);
            }
            if (parts.length > 2 && "num".equals(parts[2])) {
                column.put("num", true);
            }
        }
        return this;
    }

    ReportSheet row(Object... cells) {
        add(rows, cells);
        return this;
    }

    ReportSheet totals(Object... cells) {
        add(node.putArray("totals"), cells);
        return this;
    }

    ReportSheet note(String note) {
        if (note != null) {
            node.put("note", note);
        }
        return this;
    }

    ObjectNode build() {
        return node;
    }

    private static void add(ArrayNode target, Object[] cells) {
        ArrayNode row = target.addArray();
        for (Object cell : cells) {
            if (cell instanceof Integer number) {
                row.add(number);
            } else if (cell instanceof Long number) {
                row.add(number);
            } else if (cell instanceof Double number) {
                row.add(number);
            } else if (cell == null) {
                row.add("");
            } else {
                row.add(String.valueOf(cell));
            }
        }
    }
}
