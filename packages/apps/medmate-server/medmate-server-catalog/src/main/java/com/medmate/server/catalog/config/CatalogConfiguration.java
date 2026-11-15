package com.medmate.server.catalog.config;

import com.medmate.server.catalog.store.JdbcCatalogStore;
import com.zaxxer.hikari.HikariDataSource;
import javax.sql.DataSource;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.configuration.FluentConfiguration;
import org.flywaydb.database.postgresql.PostgreSQLConfigurationExtension;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;

@Configuration
@Profile({"local", "prod", "identity-it"})
@ConditionalOnProperty(prefix = "medmate.catalog", name = "url")
public class CatalogConfiguration {

    @Bean(destroyMethod = "close")
    DataSource catalogDataSource(Environment environment) {
        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setPoolName("catalog");
        dataSource.setJdbcUrl(environment.getRequiredProperty("medmate.catalog.url"));
        dataSource.setUsername(environment.getRequiredProperty("medmate.catalog.username"));
        dataSource.setPassword(environment.getRequiredProperty("medmate.catalog.password"));
        dataSource.setMaximumPoolSize(environment.getProperty("medmate.catalog.maximum-pool-size", Integer.class, 12));
        dataSource.setConnectionInitSql("SET plan_cache_mode = force_custom_plan");
        return dataSource;
    }

    @Bean(destroyMethod = "close")
    JdbcCatalogStore catalogStore(@Qualifier("catalogDataSource") DataSource catalogDataSource) {
        FluentConfiguration flyway = Flyway.configure()
                .dataSource(catalogDataSource)
                .locations("classpath:db/catalog")
                .baselineOnMigrate(true)
                .baselineVersion("0");
        // A transactional advisory lock stays open for the migration and blocks CREATE INDEX CONCURRENTLY.
        flyway.getPluginRegister()
                .getPlugin(PostgreSQLConfigurationExtension.class)
                .setTransactionalLock(false);
        flyway.load().migrate();
        return new JdbcCatalogStore(catalogDataSource);
    }
}
