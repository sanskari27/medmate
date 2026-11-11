package com.medmate.server.support.access;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

public final class SupportRules {

    public static final List<String> TICKET_CATEGORIES =
            List.of("Billing", "Inventory", "Online store", "Payments", "Account", "Other");
    public static final String LIVE_CHAT = "Live chat";
    public static final int SUBJECT_LIMIT = 140;
    public static final int MESSAGE_LIMIT = 4000;
    public static final int QUESTION_LIMIT = 300;

    private SupportRules() {}

    public enum Status {
        WAITING,
        OPEN,
        RESOLVED;

        public String wire() {
            return name().toLowerCase(Locale.ROOT);
        }

        public static Status parse(String raw) {
            return valueOf(raw.trim().toUpperCase(Locale.ROOT));
        }
    }

    public record Opened(String subject, String category, String firstMessage) {}

    public record Phase(Status status, UUID assigneeId) {}

    public record FaqText(String question, String answer) {}

    public static Opened open(String kind, String subject, String category, String details) {
        if ("chat".equals(kind)) {
            return new Opened(subject(subject), LIVE_CHAT, null);
        }
        if (!"ticket".equals(kind)) {
            throw bad("Support case kind is not recognised.");
        }
        if (category == null || !TICKET_CATEGORIES.contains(category)) {
            throw bad("Category is not recognised.");
        }
        return new Opened(subject(subject), category, optionalText(details, "Details are too long."));
    }

    public static Phase claim(Phase phase, UUID actor) {
        if (phase.status() != Status.WAITING) {
            throw conflict("This chat has already been picked up.");
        }
        return new Phase(Status.OPEN, actor);
    }

    public static Phase reply(Phase phase) {
        if (phase.status() == Status.RESOLVED) {
            throw conflict("This chat is already resolved.");
        }
        return phase;
    }

    public static Phase resolve(Phase phase) {
        if (phase.status() == Status.RESOLVED) {
            throw conflict("This chat is already resolved.");
        }
        return new Phase(Status.RESOLVED, phase.assigneeId());
    }

    public static String message(String raw) {
        String text = required(raw, "Message is required.");
        if (text.length() > MESSAGE_LIMIT) {
            throw bad("Message is too long.");
        }
        return text;
    }

    public static FaqText faq(String question, String answer) {
        String cleanQuestion = required(question, "Question is required.");
        String cleanAnswer = required(answer, "Answer is required.");
        if (cleanQuestion.length() > QUESTION_LIMIT) {
            throw bad("Question is too long.");
        }
        if (cleanAnswer.length() > MESSAGE_LIMIT) {
            throw bad("Answer is too long.");
        }
        return new FaqText(cleanQuestion, cleanAnswer);
    }

    private static String subject(String raw) {
        String text = required(raw, "Subject is required.");
        if (text.length() > SUBJECT_LIMIT) {
            throw bad("Subject is too long.");
        }
        return text;
    }

    private static String optionalText(String raw, String tooLong) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String text = raw.trim();
        if (text.length() > MESSAGE_LIMIT) {
            throw bad(tooLong);
        }
        return text;
    }

    private static String required(String raw, String detail) {
        if (raw == null || raw.isBlank()) {
            throw bad(detail);
        }
        return raw.trim();
    }

    private static SupportProblem bad(String detail) {
        return new SupportProblem(SupportProblem.Kind.BAD_REQUEST, detail);
    }

    private static SupportProblem conflict(String detail) {
        return new SupportProblem(SupportProblem.Kind.CONFLICT, detail);
    }
}
