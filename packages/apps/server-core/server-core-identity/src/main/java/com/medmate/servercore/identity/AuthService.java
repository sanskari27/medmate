package com.medmate.servercore.identity;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medmate.servercore.kernel.ApiError;
import com.medmate.servercore.kernel.PhoneNumbers;
import java.time.Instant;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final PharmacyAccounts accounts;
    private final SessionRepository sessions;
    private final OtpRepository otps;
    private final MasterAccess masters;
    private final OtpDelivery delivery;
    private final ObjectMapper mapper;
    private final String configuredSecret;
    private final boolean configuredProduction;

    public AuthService(PharmacyAccounts accounts, SessionRepository sessions, OtpRepository otps, MasterAccess masters,
                       OtpDelivery delivery, ObjectMapper mapper,
                       @Value("${app.auth-jwt-secret:}") String configuredSecret,
                       @Value("${app.production:false}") boolean configuredProduction) {
        this.accounts = accounts;
        this.sessions = sessions;
        this.otps = otps;
        this.masters = masters;
        this.delivery = delivery;
        this.mapper = mapper;
        this.configuredSecret = configuredSecret;
        this.configuredProduction = configuredProduction;
    }

    public boolean production() {
        if ("production".equals(System.getenv("NODE_ENV"))) {
            return true;
        }
        if ("true".equalsIgnoreCase(System.getenv("APP_PRODUCTION"))) {
            return true;
        }
        return configuredProduction;
    }

    public String secret() {
        return JwtSecrets.current(configuredSecret, production());
    }

    public SessionRow session(String token) {
        return sessions.read(token, secret());
    }

    public ObjectNode loginStart(JsonNode body) {
        String phone = requirePhone(body);
        ObjectNode response = mapper.createObjectNode();
        if ("master".equals(text(body, "portal"))) {
            response.put("mode", "otp");
            return response;
        }
        PharmacyAccounts.Login login = accounts.findLogin(phone);
        response.put("mode", login != null && login.pinHash() != null && !login.pinHash().isBlank() ? "pin" : "otp");
        return response;
    }

    public AuthResult verifyPin(JsonNode body) {
        String phone = PhoneNumbers.e164(text(body, "phone"));
        String pin = pinDigits(body.get("pin"));
        PharmacyAccounts.Login login = accounts.findLogin(phone);
        if (login == null || login.pinHash() == null || !SecretHashes.matches(pin, login.pinHash())) {
            throw new ApiError(401, "UNAUTHENTICATED", "Incorrect PIN", "pin");
        }
        return open(phone, login);
    }

    public ObjectNode savePin(SessionRow session, JsonNode body) {
        if (session == null) {
            throw new ApiError(401, "UNAUTHENTICATED", "Sign in required");
        }
        String pin = pinDigits(body.get("pin"));
        if (!pin.equals(pinDigits(body.get("confirm")))) {
            throw new ApiError(400, "VALIDATION", "PINs do not match", "pin");
        }
        accounts.setLoginPin(session.pharmacyId(), session.phone(), pin);
        ObjectNode response = mapper.createObjectNode();
        response.put("ok", true);
        response.put("needsPin", false);
        return response;
    }

    public ObjectNode sendOtp(JsonNode body) {
        String phone = requirePhone(body);
        if (!"master".equals(text(body, "portal")) && !"reset".equals(text(body, "purpose"))) {
            PharmacyAccounts.Login existing = accounts.findLogin(phone);
            if (existing != null && existing.pinHash() != null && !existing.pinHash().isBlank()) {
                throw new ApiError(403, "FORBIDDEN", "Sign in with your PIN", "pin");
            }
        }
        EnvNumbers.OtpSettings settings = EnvNumbers.otp();
        OtpMachine.Prepared prepared = OtpMachine.prepare(otps.load(phone), System.currentTimeMillis(), settings);
        if (prepared.error() != null) {
            String message = "cooldown".equals(prepared.error()) ? "Wait before requesting another code" : "Too many codes. Try again later.";
            throw new ApiError(429, "VALIDATION", message, "otp");
        }
        otps.save(phone, prepared.state());
        delivery.send(phone, prepared.otp());
        ObjectNode response = mapper.createObjectNode();
        response.put("delivery", production() ? "sms" : "dev");
        return response;
    }

    public AuthResult verifyOtp(JsonNode body) {
        String phone = PhoneNumbers.e164(text(body, "phone"));
        String code = NodesDigits.digits(text(body, "code"));
        int length = EnvNumbers.otp().length();
        if (code.length() != length) {
            throw new ApiError(400, "VALIDATION", "Enter the " + length + "-digit code", "otp");
        }
        if (!( !production() && "123456".equals(code))) {
            String result = otps.check(phone, code, EnvNumbers.otp().maxAttempts());
            if ("expired".equals(result)) {
                throw new ApiError(401, "UNAUTHENTICATED", "That code has expired", "otp");
            }
            if ("locked".equals(result)) {
                throw new ApiError(401, "UNAUTHENTICATED", "Too many attempts. Request a new code", "otp");
            }
            if ("invalid".equals(result)) {
                throw new ApiError(401, "UNAUTHENTICATED", "That code was not accepted", "otp");
            }
            if (!"ok".equals(result)) {
                throw new ApiError(401, "UNAUTHENTICATED", "Request a new code", "otp");
            }
        }
        if ("master".equals(text(body, "portal"))) {
            if (!masters.isMasterPhone(phone)) {
                throw new ApiError(403, "FORBIDDEN", "This phone is not a master login");
            }
            ObjectNode response = mapper.createObjectNode();
            response.put("portal", "master");
            response.put("phone", phone);
            return AuthResult.master(response, masters.createSession(phone));
        }
        PharmacyAccounts.Login login = accounts.findLogin(phone);
        if (login != null && login.pinHash() != null && !login.pinHash().isBlank() && !"reset".equals(text(body, "purpose"))) {
            throw new ApiError(403, "FORBIDDEN", "Sign in with your PIN", "pin");
        }
        if (login == null) {
            String businessType = "hospital".equals(text(body, "businessType")) ? "hospital" : "pharmacy";
            PharmacyAccounts.Created created = accounts.insertOwner(phone, text(body, "name"), businessType);
            login = new PharmacyAccounts.Login(created.id(), "u1", null);
        }
        return open(phone, login);
    }

    public AuthResult refresh(String presented) {
        if (presented == null || presented.isBlank()) {
            throw new ApiError(401, "UNAUTHENTICATED", "Sign in required");
        }
        SessionRepository.Issued issued = sessions.rotate(presented, secret());
        if (issued == null || issued.refresh() == null) {
            String verdict = issued == null ? "invalid" : issued.access();
            throw new ApiError(401, "UNAUTHENTICATED", "reuse".equals(verdict) ? "Session revoked" : "Sign in required");
        }
        ObjectNode response = mapper.createObjectNode();
        response.put("ok", true);
        return AuthResult.session(response, issued.access(), issued.refresh());
    }

    public AuthResult signOut(String token, String refresh) {
        SessionRow session = token == null ? null : sessions.read(token, secret());
        if (session != null && session.impersonator() != null) {
            return AuthResult.audit(session, clear());
        }
        String sessionId = token == null ? null : JwtTokens.sessionId(token, secret());
        if (sessionId != null) {
            sessions.destroy(sessionId);
        }
        if (refresh != null && !refresh.isBlank()) {
            sessions.revokeRefresh(refresh);
        }
        return clear();
    }

    public void destroySession(String sessionId) {
        sessions.destroy(sessionId);
    }

    public void recordEnded(SessionRow session) {
        // The master module records the audit. AuthService only signals it via the session on sign-out.
    }

    private AuthResult open(String phone, PharmacyAccounts.Login login) {
        ObjectNode state = accounts.loadState(login.pharmacyId());
        var users = state.path("users");
        if (users.isArray()) {
            for (JsonNode user : users) {
                if (login.userId().equals(user.path("id").asText()) && user.has("active") && !user.get("active").asBoolean(true)) {
                    throw new ApiError(403, "FORBIDDEN", "This user is inactive");
                }
            }
        }
        SessionRepository.Issued issued = sessions.create(login.pharmacyId(), login.userId(), phone, null, secret());
        SessionRow session = sessions.read(issued.access(), secret());
        if (session == null) {
            throw new ApiError(500, "VALIDATION", "Could not start a session");
        }
        return AuthResult.session(accounts.sessionView(state, session), issued.access(), issued.refresh());
    }

    private AuthResult clear() {
        ObjectNode response = mapper.createObjectNode();
        response.put("ok", true);
        return AuthResult.clearSession(response);
    }

    private static String requirePhone(JsonNode body) {
        String phone = PhoneNumbers.e164(text(body, "phone"));
        if (phone.replaceAll("\\D", "").length() < 12) {
            throw new ApiError(400, "VALIDATION", "Enter a 10-digit mobile number", "phone");
        }
        return phone;
    }

    private static String pinDigits(JsonNode raw) {
        String pin = NodesDigits.digits(raw == null || raw.isNull() ? "" : raw.asText(""));
        if (pin.length() != 4) {
            throw new ApiError(400, "VALIDATION", "Enter a 4-digit PIN", "pin");
        }
        return pin;
    }

    private static String text(JsonNode body, String field) {
        if (body == null || body.get(field) == null || body.get(field).isNull()) {
            return "";
        }
        return body.get(field).asText("");
    }

    public record AuthResult(JsonNode body, String access, String refresh, String master, boolean setAccess, boolean setRefresh, boolean setMaster, SessionRow endedImpersonation) {
        static AuthResult session(JsonNode body, String access, String refresh) {
            return new AuthResult(body, access, refresh, null, true, true, false, null);
        }

        static AuthResult master(JsonNode body, String master) {
            return new AuthResult(body, null, null, master, false, false, true, null);
        }

        static AuthResult clearSession(JsonNode body) {
            return new AuthResult(body, null, null, null, true, true, false, null);
        }

        static AuthResult audit(SessionRow session, AuthResult cleared) {
            return new AuthResult(cleared.body, null, null, null, true, true, false, session);
        }
    }
}
