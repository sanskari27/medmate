package com.medmate.servercore.identity;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.servercore.kernel.ApiBodies;
import com.medmate.servercore.kernel.ApiError;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService auth;
    private final ImpersonationAudit impersonationAudit;

    public AuthController(AuthService auth, ImpersonationAudit impersonationAudit) {
        this.auth = auth;
        this.impersonationAudit = impersonationAudit;
    }

    @PostMapping("/login")
    public JsonNode login(@RequestBody(required = false) JsonNode body) {
        return ApiBodies.encode(auth.loginStart(body));
    }

    @PostMapping("/pin")
    public JsonNode pin(HttpServletRequest request, HttpServletResponse response, @RequestBody(required = false) JsonNode body) {
        return write(request, response, auth.verifyPin(body));
    }

    @PostMapping("/pin/set")
    public JsonNode savePin(HttpServletRequest request, @RequestBody(required = false) JsonNode body) {
        return ApiBodies.encode(auth.savePin(auth.session(AuthCookies.accessToken(request)), body));
    }

    @PostMapping("/otp/send")
    public JsonNode send(@RequestBody(required = false) JsonNode body) {
        return ApiBodies.encode(auth.sendOtp(body));
    }

    @PostMapping("/otp/verify")
    public JsonNode verify(HttpServletRequest request, HttpServletResponse response, @RequestBody(required = false) JsonNode body) {
        return write(request, response, auth.verifyOtp(body));
    }

    @PostMapping("/token/refresh")
    public JsonNode refresh(HttpServletRequest request, HttpServletResponse response, @RequestBody(required = false) JsonNode body) {
        String presented = body == null ? "" : body.path("refreshToken").asText("");
        if (presented.isBlank()) {
            presented = AuthCookies.read(request, AuthCookies.REFRESH);
        }
        return write(request, response, auth.refresh(presented));
    }

    @PostMapping({"/sign-out", "/logout"})
    public JsonNode signOut(HttpServletRequest request, HttpServletResponse response) {
        String token = AuthCookies.accessToken(request);
        AuthService.AuthResult result = auth.signOut(token, AuthCookies.read(request, AuthCookies.REFRESH));
        if (result.endedImpersonation() != null) {
            impersonationAudit.ended(result.endedImpersonation());
            auth.destroySession(result.endedImpersonation().token());
            String refresh = AuthCookies.read(request, AuthCookies.REFRESH);
            if (refresh != null) {
                auth.signOut(null, refresh);
            }
        }
        return write(request, response, result);
    }

    private JsonNode write(HttpServletRequest request, HttpServletResponse response, AuthService.AuthResult result) {
        if (result.setAccess()) {
            AuthCookies.write(response, request, AuthCookies.SESSION, result.access(), EnvNumbers.accessTtl(), "/", auth.production());
        }
        if (result.setRefresh()) {
            AuthCookies.write(response, request, AuthCookies.REFRESH, result.refresh(), EnvNumbers.refreshTtl(), "/api/v1/auth", auth.production());
        }
        if (result.setMaster()) {
            AuthCookies.write(response, request, AuthCookies.MASTER, result.master(), 30 * 86400, "/", auth.production());
        }
        return ApiBodies.encode(result.body());
    }

    public static void requireSession(SessionRow session) {
        if (session == null) {
            throw new ApiError(401, "UNAUTHENTICATED", "Sign in required");
        }
    }
}
