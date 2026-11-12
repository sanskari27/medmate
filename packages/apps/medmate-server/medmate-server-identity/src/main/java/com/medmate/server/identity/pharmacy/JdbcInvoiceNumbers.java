package com.medmate.server.identity.pharmacy;

import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

@Component
@Profile({"local", "prod", "identity-it"})
public class JdbcInvoiceNumbers implements InvoiceNumbers {

    private final JdbcClient jdbc;

    public JdbcInvoiceNumbers(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public String prefix(UUID pharmacyId) {
        String prefix = jdbc.sql("SELECT invoice_prefix FROM pharmacy WHERE id = :id")
                .param("id", pharmacyId)
                .query((row, number) -> row.getString("invoice_prefix"))
                .optional()
                .orElse("");
        return prefix == null ? "" : prefix;
    }
}
