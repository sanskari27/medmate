package com.medmate.clinic.routing;

import com.medmate.clinic.security.ClinicPrincipal;
import javax.sql.DataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.stereotype.Component;

@Component
public class JdbcClinicDataSourceFactory implements ClinicDataSourceFactory {

    private final String host;
    private final int port;
    private final String username;
    private final String password;

    public JdbcClinicDataSourceFactory(
            @Value("${medmate.clinic.db.host:127.0.0.1}") String host,
            @Value("${medmate.clinic.db.port:5432}") int port,
            @Value("${medmate.clinic.db.user:rey}") String username,
            @Value("${medmate.clinic.db.password:}") String password) {
        this.host = host;
        this.port = port;
        this.username = username;
        this.password = password;
    }

    @Override
    public DataSource create(ClinicRegistryRow row, ClinicPrincipal principal) {
        DriverManagerDataSource dataSource = new DriverManagerDataSource();
        dataSource.setDriverClassName("org.postgresql.Driver");
        dataSource.setUrl("jdbc:postgresql://" + host + ":" + port + "/" + row.databaseName());
        dataSource.setUsername(username);
        dataSource.setPassword(password);
        return dataSource;
    }
}
