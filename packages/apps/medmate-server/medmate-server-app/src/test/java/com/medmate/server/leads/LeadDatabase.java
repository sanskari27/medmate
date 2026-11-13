package com.medmate.server.leads;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.testcontainers.containers.PostgreSQLContainer;

final class LeadDatabase {

    static final PostgreSQLContainer<?> POSTGRES = start();

    private LeadDatabase() {}

    static void register(DynamicPropertyRegistry registry) {
        if (POSTGRES != null) {
            registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
            registry.add("spring.datasource.username", POSTGRES::getUsername);
            registry.add("spring.datasource.password", POSTGRES::getPassword);
            return;
        }
        registry.add("spring.datasource.url", () -> "jdbc:postgresql://127.0.0.1:5432/medmate_server_it");
        registry.add("spring.datasource.username", () -> "pharmacy");
        registry.add("spring.datasource.password", () -> "pharmacy");
    }

    private static PostgreSQLContainer<?> start() {
        if (!dockerPresent()) {
            return null;
        }
        PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");
        postgres.start();
        return postgres;
    }

    private static boolean dockerPresent() {
        try {
            Process process = new ProcessBuilder("docker", "info")
                    .redirectOutput(ProcessBuilder.Redirect.DISCARD)
                    .redirectError(ProcessBuilder.Redirect.DISCARD)
                    .start();
            if (!process.waitFor(15, java.util.concurrent.TimeUnit.SECONDS)) {
                process.destroyForcibly();
                return false;
            }
            return process.exitValue() == 0;
        } catch (Exception exception) {
            return false;
        }
    }
}
