package com.medmate.servercore.kernel;

import java.util.ArrayList;
import java.util.List;

public final class CsvTables {
    private CsvTables() {
    }

    public static List<String[]> parse(String text) {
        List<String[]> rows = new ArrayList<>();
        List<String> row = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean quoted = false;
        String source = text == null ? "" : text.replaceFirst("^\uFEFF", "");
        for (int index = 0; index < source.length(); index++) {
            char character = source.charAt(index);
            if (quoted) {
                if (character == '"') {
                    if (index + 1 < source.length() && source.charAt(index + 1) == '"') {
                        current.append('"');
                        index++;
                    } else {
                        quoted = false;
                    }
                } else {
                    current.append(character);
                }
            } else if (character == '"') {
                quoted = true;
            } else if (character == ',') {
                row.add(current.toString());
                current.setLength(0);
            } else if (character == '\n') {
                row.add(current.toString());
                rows.add(row.toArray(String[]::new));
                row = new ArrayList<>();
                current.setLength(0);
            } else if (character != '\r') {
                current.append(character);
            }
        }
        if (!current.isEmpty() || !row.isEmpty()) {
            row.add(current.toString());
            rows.add(row.toArray(String[]::new));
        }
        return rows.stream().filter(cells -> {
            for (String cell : cells) {
                if (!cell.trim().isEmpty()) {
                    return true;
                }
            }
            return false;
        }).toList();
    }

    public static String norm(String value) {
        return value == null ? "" : value.toLowerCase().replaceAll("[^a-z0-9]", "");
    }

    public static double num(String value) {
        if (value == null) {
            return 0;
        }
        String cleaned = value.replaceAll("[^0-9.]", "");
        if (cleaned.isEmpty()) {
            return 0;
        }
        try {
            return Double.parseDouble(cleaned);
        } catch (NumberFormatException exception) {
            return 0;
        }
    }
}
