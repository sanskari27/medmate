package com.medmate.server.identity.sms;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile({"local", "prod", "identity-it"})
public class RecordingSmsSender implements SmsSender {

    private final CopyOnWriteArrayList<Message> messages = new CopyOnWriteArrayList<>();

    @Override
    public void send(String phone, String code) {
        messages.add(new Message(phone, code));
    }

    public List<Message> messages() {
        return List.copyOf(messages);
    }

    public void clear() {
        messages.clear();
    }

    public String latestCode(String phone) {
        for (int index = messages.size() - 1; index >= 0; index--) {
            Message message = messages.get(index);
            if (message.phone().equals(phone)) {
                return message.code();
            }
        }
        return null;
    }

    public record Message(String phone, String code) {}
}
