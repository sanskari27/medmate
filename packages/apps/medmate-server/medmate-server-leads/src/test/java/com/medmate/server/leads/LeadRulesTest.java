package com.medmate.server.leads;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;

class LeadRulesTest {

    private final ObjectMapper json = new ObjectMapper();

    @Test
    void acceptsTheFivePublicForms() {
        assertThat(LeadRules.parse(contact("nammamedmate", "ada@example.com", "9845012345"))
                        .draft())
                .isNotNull();
        assertThat(LeadRules.parse(demo()).draft().type()).isEqualTo("demo");
        assertThat(LeadRules.parse(earlyAccess()).draft().monthlySales()).isEqualTo("Under 5 lakh");
        LeadRules.Draft pharmacy = LeadRules.parse(pharmacyContact()).draft();
        assertThat(pharmacy.consent()).isTrue();
        assertThat(pharmacy.phone()).isEqualTo("9845012345");
        assertThat(LeadRules.parse(partner()).draft().plan()).isEqualTo("Essential");
    }

    @Test
    void rejectsAMissingFieldABadPairAndALongMessage() {
        ObjectNode contact = contact("nammamedmate", "", "");
        contact.remove("email");
        assertThat(LeadRules.parse(contact).problem()).isEqualTo(LeadRules.INVALID);
        assertThat(LeadRules.parse(contact("nammamedmate", "not-an-email", "")).problem())
                .isEqualTo(LeadRules.INVALID);
        ObjectNode partner = partner();
        partner.put("site", "nammamedmate");
        assertThat(LeadRules.parse(partner).problem()).isEqualTo(LeadRules.INVALID);
        ObjectNode pharmacy = pharmacyContact();
        pharmacy.put("phone", "12345");
        pharmacy.put("consent", false);
        assertThat(LeadRules.parse(pharmacy).problem()).isEqualTo(LeadRules.INVALID);
        ObjectNode message = contact("nammamedmate", "ada@example.com", "");
        message.put("message", "x".repeat(LeadRules.LONG_TEXT + 1));
        assertThat(LeadRules.parse(message).problem()).isEqualTo(LeadRules.INVALID);
        assertThat(LeadRules.parse(null).problem()).isEqualTo(LeadRules.INVALID);
    }

    @Test
    void dropsAFilledHoneypot() {
        ObjectNode body = contact("nammamedmate", "ada@example.com", "");
        body.put("companyWebsite", "https://spam.example");
        LeadRules.Parsed parsed = LeadRules.parse(body);
        assertThat(parsed.dropped()).isTrue();
        assertThat(parsed.draft()).isNull();
    }

    @Test
    void statusMovesBothWaysAndFiltersRejectUnknownValues() {
        ObjectNode contacted = json.createObjectNode().put("status", "contacted");
        ObjectNode fresh = json.createObjectNode().put("status", "new");
        assertThat(LeadRules.nextStatus(contacted).value()).isEqualTo("contacted");
        assertThat(LeadRules.nextStatus(fresh).value()).isEqualTo("new");
        assertThat(LeadRules.nextStatus(json.createObjectNode().put("status", "closed"))
                        .problem())
                .isEqualTo(LeadRules.STATUS);
        assertThat(LeadRules.statusFilter(null).value()).isEmpty();
        assertThat(LeadRules.statusFilter("new").value()).isEqualTo("new");
        assertThat(LeadRules.statusFilter("nope").problem()).isEqualTo(LeadRules.STATUS);
        assertThat(LeadRules.siteFilter("other").problem()).isEqualTo(LeadRules.SITE);
        assertThat(LeadRules.formFilter("waitlist").problem()).isEqualTo(LeadRules.FORM);
        assertThat(LeadRules.formFilter("early-access").value()).isEqualTo("early-access");
    }

    private ObjectNode contact(String site, String email, String phone) {
        ObjectNode body = json.createObjectNode();
        body.put("site", site);
        body.put("type", "contact");
        body.put("name", "Ada");
        body.put("email", email);
        body.put("phone", phone);
        body.put("subject", "Order issue");
        body.put("message", "Need help");
        if ("medmatepharmacy".equals(site)) {
            body.put("consent", true);
        }
        return body;
    }

    private ObjectNode pharmacyContact() {
        return contact("medmatepharmacy", "ada@example.com", "9845012345");
    }

    private ObjectNode demo() {
        ObjectNode body = json.createObjectNode();
        body.put("site", "nammamedmate");
        body.put("type", "demo");
        body.put("name", "Ada");
        body.put("phone", "9845012345");
        body.put("pharmacyName", "Sri Sai");
        body.put("cityPincode", "560034");
        body.put("preferredTime", "Morning");
        return body;
    }

    private ObjectNode earlyAccess() {
        ObjectNode body = demo();
        body.put("type", "early-access");
        body.put("monthlySales", "Under 5 lakh");
        body.remove("preferredTime");
        return body;
    }

    private ObjectNode partner() {
        ObjectNode body = json.createObjectNode();
        body.put("site", "medmatepharmacy");
        body.put("type", "pharmacy-partner");
        body.put("name", "Ada");
        body.put("phone", "9845012345");
        body.put("pharmacyName", "Sri Sai");
        body.put("area", "Jayanagar");
        body.put("city", "Bengaluru");
        body.put("plan", "Essential");
        body.put("preferredTime", "WhatsApp video call");
        body.put("consent", true);
        return body;
    }
}
