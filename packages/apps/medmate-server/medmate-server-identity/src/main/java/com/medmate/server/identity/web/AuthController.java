package com.medmate.server.identity.web;

import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Profile({"local", "prod", "identity-it"})
public class AuthController {

    private final AuthService auth;

    public AuthController(AuthService auth) {
        this.auth = auth;
    }

    @PostMapping("/auth/otp/send")
    public AuthService.OtpSendResponse send(@RequestBody OtpRequest request) {
        return auth.send(request.phone(), request.accountType(), request.purpose());
    }

    @PostMapping("/auth/otp/verify")
    public SessionIssuer.SessionResponse verify(@RequestBody OtpVerifyRequest request) {
        return auth.verify(request.phone(), request.accountType(), request.purpose(), request.code());
    }

    @PostMapping("/auth/pin")
    public SessionIssuer.SessionResponse pin(@RequestBody PinRequest request) {
        return auth.pin(request.phone(), request.accountType(), request.pin());
    }

    @PostMapping("/auth/pin/set")
    public SessionIssuer.AccountResponse setPin(
            org.springframework.security.core.Authentication authentication, @RequestBody PinSetRequest request) {
        return auth.setPin(Current.require(authentication), request.pin());
    }

    @PostMapping("/auth/refresh")
    public SessionIssuer.SessionResponse refresh(@RequestBody RefreshRequest request) {
        return auth.refresh(request.refreshToken());
    }

    @PostMapping("/auth/sign-out")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void signOut(@RequestBody RefreshRequest request) {
        auth.signOut(request.refreshToken());
    }

    @PostMapping("/auth/admin-bootstrap")
    public AuthService.BootstrapResponse bootstrap(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody PhoneRequest request) {
        return auth.bootstrap(bearer(authorization), request.phone());
    }

    private static String bearer(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            return "";
        }
        return authorization.substring("Bearer ".length()).trim();
    }

    public record OtpRequest(String phone, String accountType, String purpose) {}

    public record OtpVerifyRequest(String phone, String accountType, String purpose, String code) {}

    public record PinRequest(String phone, String accountType, String pin) {}

    public record PinSetRequest(String pin) {}

    public record RefreshRequest(String refreshToken) {}

    public record PhoneRequest(String phone) {}
}
