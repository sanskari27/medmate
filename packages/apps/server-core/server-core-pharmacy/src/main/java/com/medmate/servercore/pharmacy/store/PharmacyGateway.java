package com.medmate.servercore.pharmacy.store;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medmate.servercore.identity.AuthCookies;
import com.medmate.servercore.identity.AuthService;
import com.medmate.servercore.identity.SessionRow;
import com.medmate.servercore.kernel.ApiBodies;
import com.medmate.servercore.kernel.ApiError;
import jakarta.servlet.http.HttpServletRequest;
import java.util.function.BiFunction;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

@Service
public class PharmacyGateway {
    public static final String RAW_BODY = "servercore.rawBody";
    private final AuthService auth;
    private final PharmacyStore store;

    public PharmacyGateway(AuthService auth, PharmacyStore store) {
        this.auth = auth;
        this.store = store;
    }

    public JsonNode read(HttpServletRequest request, String plan, String permission, boolean hospital, BiFunction<ObjectNode, SessionRow, JsonNode> action) {
        SessionRow session = require(request);
        ObjectNode state = store.load(session.pharmacyId());
        AccessGuard.check(state, session, plan, permission, hospital);
        return ApiBodies.encode(action.apply(state, session));
    }

    public JsonNode write(HttpServletRequest request, String plan, String permission, boolean hospital, BiFunction<ObjectNode, SessionRow, JsonNode> action) {
        SessionRow session = require(request);
        JsonNode result = store.withState(session.pharmacyId(), (state, connection) -> {
            AccessGuard.check(state, session, plan, permission, hospital);
            return action.apply(state, session);
        });
        return ApiBodies.encode(result);
    }

    public ResponseEntity<JsonNode> idempotent(HttpServletRequest request, String plan, String permission, boolean hospital, BiFunction<ObjectNode, SessionRow, JsonNode> action) {
        SessionRow session = require(request);
        String key = request.getHeader("Idempotency-Key");
        if (key == null || key.isBlank()) {
            throw new ApiError(400, "VALIDATION", "Idempotency-Key is required");
        }
        String path = request.getRequestURI().replaceFirst("^/api/v1", "");
        if (path.isEmpty()) {
            path = "/";
        }
        Object raw = request.getAttribute(RAW_BODY);
        String hash = PharmacyStore.requestHash(request.getMethod(), path, raw == null ? "" : raw.toString());
        PharmacyStore.Saved saved = store.withIdempotent(session.pharmacyId(), key, hash, state -> {
            AccessGuard.check(state, session, plan, permission, hospital);
            return action.apply(state, session);
        });
        return ResponseEntity.status(saved.status()).body(saved.body());
    }

    public SessionRow require(HttpServletRequest request) {
        SessionRow session = auth.session(AuthCookies.accessToken(request));
        if (session == null) {
            throw new ApiError(401, "UNAUTHENTICATED", "Sign in required");
        }
        return session;
    }

    public PharmacyStore store() {
        return store;
    }

    public AuthService auth() {
        return auth;
    }
}
