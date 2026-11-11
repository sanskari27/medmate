package com.medmate.server.support.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medmate.server.identity.session.AccessTokens;
import com.medmate.server.identity.session.AccountDirectory;
import com.medmate.server.support.stream.SupportHub;
import com.medmate.server.support.stream.SupportSocketHandler;
import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@Profile({"local", "prod", "identity-it"})
@EnableWebSocket
@EnableTransactionManagement
public class SupportConfiguration {

    @Bean
    SupportHub supportHub(ObjectMapper json) {
        return new SupportHub(json);
    }

    @Bean
    SupportSocketHandler supportSocketHandler(
            AccessTokens tokens, AccountDirectory directory, Clock clock, SupportHub hub, ObjectMapper json) {
        return new SupportSocketHandler(tokens, directory, clock, hub, json);
    }

    @Bean
    WebSocketConfigurer supportSocket(SupportSocketHandler handler) {
        return new WebSocketConfigurer() {
            @Override
            public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
                registry.addHandler(handler, "/support/stream").setAllowedOriginPatterns("*");
            }
        };
    }
}
