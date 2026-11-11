package com.medmate.server.support.stream;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.identity.session.AccessTokens;
import com.medmate.server.identity.session.AccountDirectory;
import com.medmate.server.support.access.SupportAccess;
import java.io.IOException;
import java.time.Clock;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

public final class SupportSocketHandler extends TextWebSocketHandler {

    static final String TIMER = "supportAuthTimer";
    static final String READY = "supportReady";

    private final AccessTokens tokens;
    private final AccountDirectory directory;
    private final Clock clock;
    private final SupportHub hub;
    private final ObjectMapper json;
    private final ScheduledExecutorService timers = Executors.newSingleThreadScheduledExecutor(task -> {
        Thread thread = new Thread(task, "support-socket-auth");
        thread.setDaemon(true);
        return thread;
    });

    public SupportSocketHandler(
            AccessTokens tokens, AccountDirectory directory, Clock clock, SupportHub hub, ObjectMapper json) {
        this.tokens = tokens;
        this.directory = directory;
        this.clock = clock;
        this.hub = hub;
        this.json = json;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        ScheduledFuture<?> timer = timers.schedule(() -> closeQuietly(session), 5, TimeUnit.SECONDS);
        session.getAttributes().put(TIMER, timer);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        if (Boolean.TRUE.equals(session.getAttributes().get(READY))) {
            return;
        }
        JsonNode body;
        try {
            body = json.readTree(message.getPayload());
        } catch (IOException exception) {
            closeQuietly(session);
            return;
        }
        if (!"auth".equals(body.path("type").asText())
                || !accept(session, body.path("accessToken").asText(""))) {
            closeQuietly(session);
            return;
        }
        cancelTimer(session);
        session.getAttributes().put(READY, true);
        hub.register(session, principal(session));
        session.sendMessage(new TextMessage("{\"type\":\"ready\"}"));
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        cancelTimer(session);
        hub.unregister(session);
    }

    private boolean accept(WebSocketSession session, String token) {
        UUID accountId = tokens.parse(token, clock.instant());
        if (accountId == null) {
            return false;
        }
        AccountPrincipal principal = directory.load(accountId);
        if (principal == null || directory.ownerAccountDisabled(principal) || !SupportAccess.connect(principal)) {
            return false;
        }
        session.getAttributes().put("principal", principal);
        return true;
    }

    private void closeQuietly(WebSocketSession session) {
        try {
            if (session.isOpen()) {
                session.close(CloseStatus.POLICY_VIOLATION);
            }
        } catch (IOException exception) {
            hub.unregister(session);
        }
    }

    private static AccountPrincipal principal(WebSocketSession session) {
        return (AccountPrincipal) session.getAttributes().get("principal");
    }

    private static void cancelTimer(WebSocketSession session) {
        Object timer = session.getAttributes().remove(TIMER);
        if (timer instanceof ScheduledFuture<?> future) {
            future.cancel(false);
        }
    }
}
