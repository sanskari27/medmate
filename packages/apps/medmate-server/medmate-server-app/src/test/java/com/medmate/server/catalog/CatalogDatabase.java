package com.medmate.server.catalog;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.testcontainers.containers.PostgreSQLContainer;

final class CatalogDatabase {

    static final PostgreSQLContainer<?> POSTGRES = start();

    private CatalogDatabase() {}

    static void register(DynamicPropertyRegistry registry) {
        if (POSTGRES != null) {
            ensure(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword(), "medicine_data");
            registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
            registry.add("spring.datasource.username", POSTGRES::getUsername);
            registry.add("spring.datasource.password", POSTGRES::getPassword);
            registry.add("medmate.catalog.url", () -> withDatabase(POSTGRES.getJdbcUrl(), "medicine_data"));
            registry.add("medmate.catalog.username", POSTGRES::getUsername);
            registry.add("medmate.catalog.password", POSTGRES::getPassword);
            return;
        }
        ensureHost("medicine_data_it");
        registry.add("spring.datasource.url", () -> "jdbc:postgresql://127.0.0.1:5432/medmate_server_it");
        registry.add("spring.datasource.username", () -> "pharmacy");
        registry.add("spring.datasource.password", () -> "pharmacy");
        registry.add("medmate.catalog.url", () -> "jdbc:postgresql://127.0.0.1:5432/medicine_data_it");
        registry.add("medmate.catalog.username", () -> "pharmacy");
        registry.add("medmate.catalog.password", () -> "pharmacy");
    }

    private static void ensure(String adminUrl, String user, String password, String database) {
        try (Connection connection = DriverManager.getConnection(adminUrl, user, password);
                Statement statement = connection.createStatement()) {
            ResultSet existing = statement.executeQuery("SELECT 1 FROM pg_database WHERE datname = '" + database + "'");
            if (!existing.next()) {
                statement.execute("CREATE DATABASE " + database);
            }
        } catch (SQLException exception) {
            throw new IllegalStateException(exception);
        }
        try (Connection connection = DriverManager.getConnection(withDatabase(adminUrl, database), user, password);
                Statement statement = connection.createStatement()) {
            statement.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm");
        } catch (SQLException exception) {
            throw new IllegalStateException(exception);
        }
    }

    private static void ensureHost(String database) {
        String psql = psql();
        String exists = command(
                        psql,
                        "-h",
                        "127.0.0.1",
                        "-p",
                        "5432",
                        "-d",
                        "postgres",
                        "-tAc",
                        "SELECT 1 FROM pg_database WHERE datname = '" + database + "'")
                .trim();
        if (!"1".equals(exists)) {
            command(
                    psql,
                    "-h",
                    "127.0.0.1",
                    "-p",
                    "5432",
                    "-d",
                    "postgres",
                    "-c",
                    "CREATE DATABASE " + database + " OWNER pharmacy");
        }
        command(psql, "-h", "127.0.0.1", "-p", "5432", "-d", database, "-c", "ALTER SCHEMA public OWNER TO pharmacy");
        command(psql, "-h", "127.0.0.1", "-p", "5432", "-d", database, "-c", "GRANT ALL ON SCHEMA public TO pharmacy");
        command(psql, "-h", "127.0.0.1", "-p", "5432", "-d", database, "-c", "CREATE EXTENSION IF NOT EXISTS pg_trgm");
    }

    private static String psql() {
        for (String candidate : java.util.List.of(
                "/opt/homebrew/opt/postgresql@16/bin/psql", "/usr/local/opt/postgresql@16/bin/psql")) {
            if (new java.io.File(candidate).canExecute()) {
                return candidate;
            }
        }
        return "psql";
    }

    private static String command(String... args) {
        try {
            Process process = new ProcessBuilder(args).redirectErrorStream(true).start();
            String output =
                    new String(process.getInputStream().readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
            if (!process.waitFor(30, java.util.concurrent.TimeUnit.SECONDS) || process.exitValue() != 0) {
                throw new IllegalStateException(output);
            }
            return output;
        } catch (IllegalStateException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new IllegalStateException(exception);
        }
    }

    private static String withDatabase(String jdbcUrl, String database) {
        int query = jdbcUrl.indexOf('?');
        String base = query < 0 ? jdbcUrl : jdbcUrl.substring(0, query);
        String suffix = query < 0 ? "" : jdbcUrl.substring(query);
        int slash = base.lastIndexOf('/');
        return base.substring(0, slash + 1) + database + suffix;
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
