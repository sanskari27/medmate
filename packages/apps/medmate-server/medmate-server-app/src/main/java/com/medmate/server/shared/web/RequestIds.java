package com.medmate.server.shared.web;

import java.util.UUID;
import java.util.regex.Pattern;

public final class RequestIds {

    public static final String HEADER = "X-Request-Id";
    public static final String ATTRIBUTE = "medmate.requestId";

    private static final Pattern SAFE = Pattern.compile("^[A-Za-z0-9._-]{1,64}$");

    private RequestIds() {}

    public static String resolve(String incoming) {
        if (incoming != null && SAFE.matcher(incoming).matches()) {
            return incoming;
        }
        return UUID.randomUUID().toString();
    }
}
