package com.medmate.server.identity.sms;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.medmate.server.identity.otp.OtpPurpose;
import org.springframework.web.client.RestClient;

public final class TelinfySmsSender implements SmsSender {

    static final String BASE_URL = "https://hub.telinfy.com/unified/developer/api/v1";
    private static final String SENDER = "MEDMTE";

    private final RestClient client;

    public TelinfySmsSender(String apiKey) {
        this(apiKey, BASE_URL);
    }

    TelinfySmsSender(String apiKey, String baseUrl) {
        String root = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.client = RestClient.builder()
                .baseUrl(root)
                .defaultHeader("x-api-key", apiKey)
                .build();
    }

    @Override
    public void send(String phone, String code, OtpPurpose purpose) {
        client.post()
                .uri("/sms/send")
                .body(new Outbound(SENDER, message(purpose, code), national(phone), templateId(purpose)))
                .retrieve()
                .toBodilessEntity();
    }

    private static String national(String phone) {
        if (phone != null && phone.startsWith("+91") && phone.length() == 13) {
            return phone.substring(3);
        }
        throw new IllegalArgumentException("OTP phone is not an Indian mobile number");
    }

    private static String templateId(OtpPurpose purpose) {
        return switch (purpose) {
            case LOGIN -> "1777179371662098726";
            case SIGNUP -> "1777179371651147672";
            case PIN_RESET -> "1777179371668989529";
        };
    }

    private static String message(OtpPurpose purpose, String code) {
        String template =
                switch (purpose) {
                    case LOGIN -> "{{1}} is your MedMate login OTP, valid for 10 minutes. Never share this OTP with anyone, including MedMate staff. - MedMate India Technology Pvt Ltd";
                    case SIGNUP -> "{{1}} is your OTP to create your MedMate account. It is valid for 10 minutes. Do not share this OTP with anyone. - MedMate India Technology Pvt Ltd";
                    case PIN_RESET -> "{{1}} is your OTP to reset your MedMate account password. Valid for 10 minutes. If you did not request this, please ignore this message. - MedMate India Technology Pvt Ltd";
                };
        return template.replace("{{1}}", code);
    }

    public record Outbound(
            @JsonProperty("Sender_Name") String senderName,
            @JsonProperty("SMS_Message") String smsMessage,
            @JsonProperty("mobile_Number") String mobileNumber,
            @JsonProperty("template_id") String templateId) {}
}
