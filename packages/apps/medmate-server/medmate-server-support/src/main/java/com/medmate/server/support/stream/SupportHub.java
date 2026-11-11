package com.medmate.server.support.stream;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.support.access.SupportAccess;
import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

public final class SupportHub {

    private final ObjectMapper json;
    private final ConcurrentHashMap<String, Connection> connections = new ConcurrentHashMap<>();

    public SupportHub(ObjectMapper json) {
        this.json = json;
    }

    public void register(WebSocketSession session, AccountPrincipal principal) {
        connections.put(session.getId(), new Connection(session, principal));
    }

    public void unregister(WebSocketSession session) {
        connections.remove(session.getId());
    }

    public void caseUpdated(UUID caseId, UUID pharmacyId) {
        send("case.updated", caseId, pharmacyId);
    }

    public void messageCreated(UUID caseId, UUID pharmacyId) {
        send("message.created", caseId, pharmacyId);
    }

    private void send(String type, UUID caseId, UUID pharmacyId) {
        String payload;
        try {
            payload = json.writeValueAsString(
                    Map.of("type", type, "caseId", caseId.toString(), "pharmacyId", pharmacyId.toString()));
        } catch (IOException exception) {
            return;
        }
        for (Connection connection : connections.values()) {
            if (!SupportAccess.readCase(connection.principal, pharmacyId)) {
                continue;
            }
            try {
                connection.session.sendMessage(new TextMessage(payload));
            } catch (IOException | IllegalStateException exception) {
                connections.remove(connection.session.getId());
            }
        }
    }

    private record Connection(WebSocketSession session, AccountPrincipal principal) {}
}
