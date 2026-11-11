package com.medmate.server.identity.config;

import com.medmate.server.identity.documents.DocumentStore;
import com.medmate.server.identity.documents.MemoryDocumentStore;
import com.medmate.server.identity.documents.S3DocumentStore;
import com.medmate.server.identity.mail.MailSender;
import com.medmate.server.identity.mail.RecordingMailSender;
import com.medmate.server.identity.mail.ResendMailSender;
import com.medmate.server.identity.security.JwtFilter;
import com.medmate.server.identity.security.PharmacyGateFilter;
import com.medmate.server.identity.session.AccessTokens;
import com.medmate.server.identity.session.AccountDirectory;
import com.medmate.server.identity.sms.HttpSmsSender;
import com.medmate.server.identity.sms.RecordingSmsSender;
import com.medmate.server.identity.sms.SmsSender;
import com.medmate.server.shared.error.ProblemResponses;
import java.time.Clock;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

@Configuration
@Profile({"local", "prod", "identity-it"})
@EnableConfigurationProperties(MedmateIdentityProperties.class)
@EnableTransactionManagement
public class IdentityConfiguration {

    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    AccessTokens accessTokens(MedmateIdentityProperties properties) {
        return new AccessTokens(properties.jwt().secret(), properties.jwt().accessSeconds());
    }

    @Bean
    @Primary
    SmsSender smsSender(MedmateIdentityProperties properties, RecordingSmsSender recording) {
        String baseUrl = properties.sms() == null ? "" : properties.sms().baseUrl();
        if (baseUrl == null || baseUrl.isBlank()) {
            return recording;
        }
        return new HttpSmsSender(baseUrl);
    }

    @Bean
    @Primary
    MailSender mailSender(MedmateIdentityProperties properties, RecordingMailSender recording) {
        if (properties.mail() != null && "resend".equals(properties.mail().mode())) {
            return new ResendMailSender(
                    properties.mail().resendApiKey(), properties.mail().from());
        }
        return recording;
    }

    @Bean
    DocumentStore documentStore(MedmateIdentityProperties properties) {
        String bucket = properties.uploads() == null ? "" : properties.uploads().bucket();
        if (bucket == null || bucket.isBlank()) {
            return new MemoryDocumentStore();
        }
        String region = properties.uploads().region() == null
                        || properties.uploads().region().isBlank()
                ? "ap-south-1"
                : properties.uploads().region();
        return new S3DocumentStore(S3Client.builder().region(Region.of(region)).build(), bucket);
    }

    @Bean
    JwtFilter jwtFilter(AccessTokens tokens, AccountDirectory directory, Clock clock) {
        return new JwtFilter(tokens, directory, clock);
    }

    @Bean
    PharmacyGateFilter pharmacyGateFilter() {
        return new PharmacyGateFilter();
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, JwtFilter jwtFilter, PharmacyGateFilter pharmacyGate)
            throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth.requestMatchers("/actuator/**", "/auth/**")
                        .permitAll()
                        .anyRequest()
                        .authenticated())
                .exceptionHandling(errors -> errors.authenticationEntryPoint(
                                (request, response, exception) -> ProblemResponses.write(
                                        request,
                                        response,
                                        HttpStatus.UNAUTHORIZED,
                                        "Unauthorized",
                                        "Sign in is required"))
                        .accessDeniedHandler((request, response, exception) -> ProblemResponses.write(
                                request, response, HttpStatus.FORBIDDEN, "Forbidden", "This action is not allowed")))
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(pharmacyGate, JwtFilter.class);
        return http.build();
    }
}
