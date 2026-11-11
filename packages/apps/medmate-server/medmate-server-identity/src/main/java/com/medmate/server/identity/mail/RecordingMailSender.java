package com.medmate.server.identity.mail;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile({"local", "prod", "identity-it"})
public class RecordingMailSender implements MailSender {

    private static final Logger log = LoggerFactory.getLogger(RecordingMailSender.class);
    private final CopyOnWriteArrayList<Message> messages = new CopyOnWriteArrayList<>();

    @Override
    public void send(String to, String subject, String text) {
        messages.add(new Message(to, subject, text));
        log.info("Recorded mail to {} subject {}", to, subject);
    }

    public List<Message> messages() {
        return List.copyOf(messages);
    }

    public void clear() {
        messages.clear();
    }

    public record Message(String to, String subject, String text) {}
}
