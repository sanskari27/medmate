package com.medmate.server.health;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.server.shared.web.RequestIds;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ActuatorHealthIT {

    @Autowired
    private TestRestTemplate rest;

    @Test
    void healthIsUpAndEchoesRequestId() {
        ResponseEntity<JsonNode> response = exchange("/actuator/health", "req-example-001");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getHeaders().getContentType()).isNotNull();
        assertThat(response.getHeaders().getContentType().isCompatibleWith(MediaType.APPLICATION_JSON))
                .isTrue();
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("status").asText()).isEqualTo("UP");
        assertThat(response.getHeaders().getFirst(RequestIds.HEADER)).isEqualTo("req-example-001");
    }

    @Test
    void livenessAndReadinessAreUp() {
        assertUp("/actuator/health/liveness");
        assertUp("/actuator/health/readiness");
    }

    @Test
    void infoReportsTheBuild() {
        ResponseEntity<JsonNode> response = exchange("/actuator/info", "req-example-001");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().path("build").path("artifact").asText()).isEqualTo("medmate-server-app");
        assertThat(response.getBody().path("build").path("version").asText()).isEqualTo("1.0.0");
    }

    @Test
    void sensitiveEndpointsAreHidden() {
        assertThat(exchange("/actuator/env", "req-example-001").getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(exchange("/actuator/heapdump", "req-example-001").getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void unsafeRequestIdIsReplaced() {
        ResponseEntity<JsonNode> response = exchange("/actuator/health", "not safe");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        String echoed = response.getHeaders().getFirst(RequestIds.HEADER);
        assertThat(echoed).isNotEqualTo("not safe");
        assertThat(echoed).matches("[0-9a-f-]{36}");
    }

    private void assertUp(String path) {
        ResponseEntity<JsonNode> response = exchange(path, "req-example-001");
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("status").asText()).isEqualTo("UP");
    }

    private ResponseEntity<JsonNode> exchange(String path, String requestId) {
        HttpHeaders headers = new HttpHeaders();
        headers.set(RequestIds.HEADER, requestId);
        return rest.exchange(path, HttpMethod.GET, new HttpEntity<>(headers), JsonNode.class);
    }
}
