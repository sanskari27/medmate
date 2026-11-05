package com.medmate.servercore.kernel;

import java.util.List;
import java.util.regex.Pattern;

public final class FormFaults {
    private static final List<Rule> RULES = List.of(
            new Rule(Pattern.compile("gstin", Pattern.CASE_INSENSITIVE), "gstin"),
            new Rule(Pattern.compile("ifsc", Pattern.CASE_INSENSITIVE), "ifsc"),
            new Rule(Pattern.compile("mobile|phone", Pattern.CASE_INSENSITIVE), "phone"),
            new Rule(Pattern.compile("otp|\\d-digit code|code was not accepted|request a new code|code has expired|another code|too many codes", Pattern.CASE_INSENSITIVE), "otp"),
            new Rule(Pattern.compile("pin", Pattern.CASE_INSENSITIVE), "pin"),
            new Rule(Pattern.compile("e-?mail", Pattern.CASE_INSENSITIVE), "email"),
            new Rule(Pattern.compile("amount|must be positive", Pattern.CASE_INSENSITIVE), "amount"),
            new Rule(Pattern.compile("rack", Pattern.CASE_INSENSITIVE), "rack"),
            new Rule(Pattern.compile("stock|nothing to bill|nothing to issue|nothing to return|out of stock", Pattern.CASE_INSENSITIVE), "qty"),
            new Rule(Pattern.compile("doctor", Pattern.CASE_INSENSITIVE), "doctor"),
            new Rule(Pattern.compile("ward", Pattern.CASE_INSENSITIVE), "ward"),
            new Rule(Pattern.compile("invoice", Pattern.CASE_INSENSITIVE), "invoiceNo"),
            new Rule(Pattern.compile("\\bname\\b", Pattern.CASE_INSENSITIVE), "name"));

    private FormFaults() {
    }

    public static String fieldFrom(String message) {
        if (message == null) {
            return null;
        }
        for (Rule rule : RULES) {
            if (rule.pattern.matcher(message).find()) {
                return rule.field;
            }
        }
        return null;
    }

    private record Rule(Pattern pattern, String field) {
    }
}
