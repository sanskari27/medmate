package com.medmate.servercore.identity;

import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public final class AuthCookies {
    public static final String SESSION = "namma_session";
    public static final String REFRESH = "namma_refresh";
    public static final String MASTER = "namma_master";

    private AuthCookies() {
    }

    public static void write(HttpServletResponse response, HttpServletRequest request, String name, String token, int maxAge, String path, boolean production) {
        boolean localhost = "localhost".equalsIgnoreCase(request.getServerName()) || "127.0.0.1".equals(request.getServerName());
        boolean secure = production && !localhost;
        String sameSite = secure ? "None" : "Lax";
        String value = token == null ? "" : encode(token);
        int age = token == null ? 0 : maxAge;
        String secureFlag = secure ? "; Secure" : "";
        response.addHeader("Set-Cookie", name + "=" + value + "; HttpOnly; Path=" + path + "; SameSite=" + sameSite + "; Max-Age=" + age + secureFlag);
    }

    public static String read(HttpServletRequest request, String name) {
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if (name.equals(cookie.getName())) {
                    return decode(cookie.getValue());
                }
            }
        }
        String header = request.getHeader("Cookie");
        if (header == null) {
            return null;
        }
        for (String part : header.split(";")) {
            String trimmed = part.trim();
            if (trimmed.startsWith(name + "=")) {
                return decode(trimmed.substring(name.length() + 1));
            }
        }
        return null;
    }

    public static String accessToken(HttpServletRequest request) {
        String cookie = read(request, SESSION);
        if (cookie != null && !cookie.isEmpty()) {
            return cookie;
        }
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring("Bearer ".length()).trim();
        }
        return null;
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
    }

    private static String decode(String value) {
        return URLDecoder.decode(value.replace("+", "%2B"), StandardCharsets.UTF_8);
    }
}
