package com.medmate.server.crm.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.server.billing.PatientBills;
import com.medmate.server.crm.PatientRules;
import com.medmate.server.crm.store.CrmStore;
import com.medmate.server.identity.access.Access;
import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.shared.error.ApiProblem;
import com.medmate.server.shared.web.PageQuery;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Profile({"local", "prod", "identity-it"})
public class PatientService {

    private final PatientBills bills;
    private final CrmStore store;

    public PatientService(PatientBills bills, CrmStore store) {
        this.bills = bills;
        this.store = store;
    }

    public PatientViews.ListResponse list(
            AccountPrincipal actor, PageQuery page, String query, String sort, String segment) {
        require(actor, PatientRules.READ, "Patients cannot be read");
        checkQuery(sort, segment);
        Loaded loaded = load(actor.pharmacyId());
        List<PatientRules.Patient> rows = PatientRules.filter(loaded.directory().patients(), query, segment, sort);
        int from = Math.min(page.offset(), rows.size());
        int to = Math.min(from + page.size(), rows.size());
        return new PatientViews.ListResponse(
                rows.subList(from, to).stream().map(PatientService::row).toList(),
                summary(loaded.directory().summary()),
                buckets(loaded.directory().aging()),
                page.page(),
                page.size(),
                rows.size());
    }

    public PatientViews.ExportResponse export(AccountPrincipal actor, String query, String sort, String segment) {
        require(actor, PatientRules.UPDATE, "Patients cannot be updated");
        checkQuery(sort, segment);
        Loaded loaded = load(actor.pharmacyId());
        return new PatientViews.ExportResponse(
                PatientRules.filter(loaded.directory().patients(), query, segment, sort).stream()
                        .map(PatientService::row)
                        .toList());
    }

    public PatientViews.OneResponse read(AccountPrincipal actor, String phone) {
        require(actor, PatientRules.READ, "Patients cannot be read");
        return new PatientViews.OneResponse(detail(find(load(actor.pharmacyId()), phone)));
    }

    @Transactional
    public PatientViews.OneResponse update(AccountPrincipal actor, String phone, JsonNode body) {
        require(actor, PatientRules.UPDATE, "Patients cannot be updated");
        Loaded loaded = load(actor.pharmacyId());
        PatientRules.Patient patient = find(loaded, phone);
        PatientRules.Profile merged =
                PatientRules.merge(patient.profile(), patch(body, patient.profile()), clearAge(body));
        String problem = PatientRules.profileProblem(merged);
        if (problem != null) {
            throw bad(problem);
        }
        store.saveProfile(actor.pharmacyId(), phone, merged);
        return new PatientViews.OneResponse(detail(copyProfile(patient, merged)));
    }

    @Transactional
    public PatientViews.RepaymentResponse repay(AccountPrincipal actor, String phone, JsonNode body) {
        require(actor, PatientRules.UPDATE, "Patients cannot be updated");
        Loaded loaded = load(actor.pharmacyId());
        PatientRules.Patient patient = find(loaded, phone);
        BigDecimal amount = amount(body);
        String mode = text(body, "mode");
        String problem = PatientRules.repaymentProblem(patient.creditOutstanding(), amount, mode);
        if (problem != null) {
            throw bad(problem);
        }
        PatientRules.Repayment repayment = new PatientRules.Repayment(
                store.nextRepayment(actor.pharmacyId()),
                phone,
                amount.setScale(2, RoundingMode.UNNECESSARY),
                mode,
                blank(text(body, "note")),
                Instant.now());
        store.insertRepayment(actor.pharmacyId(), repayment);
        return new PatientViews.RepaymentResponse(repayment(repayment));
    }

    @Transactional
    public PatientViews.ReminderResponse remind(AccountPrincipal actor, String phone, JsonNode body) {
        require(actor, PatientRules.UPDATE, "Patients cannot be updated");
        find(load(actor.pharmacyId()), phone);
        String kind = text(body, "kind");
        String channel = text(body, "channel");
        String problem = PatientRules.reminderProblem(kind, channel);
        if (problem != null) {
            throw bad(problem);
        }
        PatientRules.Reminder reminder =
                new PatientRules.Reminder(UUID.randomUUID().toString(), phone, kind, channel, Instant.now());
        store.insertReminder(actor.pharmacyId(), reminder);
        return new PatientViews.ReminderResponse(reminder(reminder));
    }

    @Transactional
    public PatientViews.RedemptionResponse redeem(AccountPrincipal actor, String phone) {
        require(actor, PatientRules.UPDATE, "Patients cannot be updated");
        PatientRules.Patient patient = find(load(actor.pharmacyId()), phone);
        int points = PatientRules.redeemable(patient.availablePoints());
        if (points <= 0) {
            throw bad("No points to redeem");
        }
        PatientRules.Redemption redemption =
                new PatientRules.Redemption(UUID.randomUUID().toString(), phone, points, Instant.now());
        store.insertRedemption(actor.pharmacyId(), redemption);
        return new PatientViews.RedemptionResponse(redemption(redemption));
    }

    @Transactional
    public PatientViews.FeedbackResponse feedback(AccountPrincipal actor, String phone, JsonNode body) {
        require(actor, PatientRules.UPDATE, "Patients cannot be updated");
        find(load(actor.pharmacyId()), phone);
        Integer rating = whole(body, "rating");
        Integer nps = body != null && body.has("nps") && !body.get("nps").isNull() ? whole(body, "nps") : null;
        String problem = PatientRules.feedbackProblem(rating, nps);
        if (problem != null) {
            throw bad(problem);
        }
        PatientRules.Feedback feedback = new PatientRules.Feedback(
                UUID.randomUUID().toString(), phone, rating, nps, blank(text(body, "comment")), Instant.now());
        store.insertFeedback(actor.pharmacyId(), feedback);
        return new PatientViews.FeedbackResponse(feedback(feedback));
    }

    public PatientViews.CampaignList campaigns(AccountPrincipal actor) {
        require(actor, PatientRules.READ, "Patients cannot be read");
        return new PatientViews.CampaignList(campaigns(actor.pharmacyId()));
    }

    @Transactional
    public PatientViews.CampaignResponse addCampaign(AccountPrincipal actor, JsonNode body) {
        require(actor, PatientRules.UPDATE, "Patients cannot be updated");
        String segment = text(body, "segment");
        String channel = text(body, "channel");
        String message = text(body, "message");
        String problem = PatientRules.campaignProblem(segment, channel, message);
        if (problem != null) {
            throw bad(problem);
        }
        Loaded loaded = load(actor.pharmacyId());
        List<PatientRules.Patient> audience = loaded.directory().patients().stream()
                .filter(patient -> PatientRules.inSegment(patient, segment))
                .toList();
        PatientRules.Campaign campaign = new PatientRules.Campaign(
                UUID.randomUUID().toString(),
                PatientRules.campaignName(segment),
                segment,
                channel,
                message.trim(),
                blank(text(body, "offerLabel")),
                audience.size(),
                Instant.now());
        store.insertCampaign(actor.pharmacyId(), campaign);
        PatientViews.First first = audience.isEmpty()
                ? null
                : new PatientViews.First(
                        audience.get(0).phone(), audience.get(0).name());
        return new PatientViews.CampaignResponse(campaign(campaign), first);
    }

    public PatientViews.ReminderList reminders(AccountPrincipal actor) {
        require(actor, PatientRules.READ, "Patients cannot be read");
        return new PatientViews.ReminderList(store.reminders(actor.pharmacyId()).stream()
                .sorted(Comparator.comparing(PatientRules.Reminder::at).reversed())
                .map(PatientService::reminder)
                .toList());
    }

    public PatientViews.FeedbackList feedbackList(AccountPrincipal actor) {
        require(actor, PatientRules.READ, "Patients cannot be read");
        return new PatientViews.FeedbackList(store.feedback(actor.pharmacyId()).stream()
                .sorted(Comparator.comparing(PatientRules.Feedback::at).reversed())
                .map(PatientService::feedback)
                .toList());
    }

    public PatientViews.Analytics analytics(AccountPrincipal actor) {
        require(actor, PatientRules.READ, "Patients cannot be read");
        Loaded loaded = load(actor.pharmacyId());
        List<PatientRules.Patient> patients = loaded.directory().patients();
        List<PatientRules.Patient> leaders = PatientRules.leaders(patients);
        BigDecimal lifetime = loaded.directory().summary().lifetimeSales();
        String average = patients.isEmpty()
                ? "0.00"
                : money(lifetime.divide(BigDecimal.valueOf(patients.size()), 2, RoundingMode.HALF_UP));
        int repeat = loaded.directory().summary().repeat();
        int retention = patients.isEmpty() ? 0 : (int) Math.round((repeat * 100.0) / patients.size());
        return new PatientViews.Analytics(
                average,
                retention,
                loaded.directory().summary().atRisk(),
                money(PatientRules.campaignSales(store.campaigns(actor.pharmacyId()), patients, loaded.sales())),
                leaders.size(),
                leaders.stream().map(PatientService::leader).toList());
    }

    private Loaded load(UUID pharmacyId) {
        List<PatientRules.Sale> sales = new ArrayList<>();
        for (PatientBills.Sale sale : bills.sales(pharmacyId)) {
            sales.add(new PatientRules.Sale(
                    sale.number(),
                    sale.name(),
                    sale.phone(),
                    sale.payMode(),
                    sale.soldAt(),
                    sale.payable(),
                    sale.units(),
                    sale.prescription()));
        }
        List<PatientRules.Refund> refunds = new ArrayList<>();
        for (PatientBills.Refund refund : bills.refunds(pharmacyId)) {
            refunds.add(new PatientRules.Refund(refund.code(), refund.billNumber(), refund.amount(), refund.at()));
        }
        Map<String, PatientRules.Profile> profiles = new LinkedHashMap<>();
        for (CrmStore.PhoneProfile row : store.profileRows(pharmacyId)) {
            profiles.put(
                    row.phone(),
                    new PatientRules.Profile(
                            row.age(),
                            row.gender(),
                            row.bloodGroup(),
                            row.dob(),
                            row.address(),
                            row.conditions(),
                            row.allergies(),
                            row.note(),
                            row.consent()));
        }
        PatientRules.Directory directory = PatientRules.directory(
                sales,
                refunds,
                store.repayments(pharmacyId),
                profiles,
                store.reminders(pharmacyId),
                store.redemptions(pharmacyId),
                store.feedback(pharmacyId),
                Instant.now());
        return new Loaded(directory, sales);
    }

    private List<PatientViews.Campaign> campaigns(UUID pharmacyId) {
        return store.campaigns(pharmacyId).stream()
                .sorted(Comparator.comparing(PatientRules.Campaign::sentAt).reversed())
                .map(PatientService::campaign)
                .toList();
    }

    private static PatientRules.Patient find(Loaded loaded, String phone) {
        for (PatientRules.Patient patient : loaded.directory().patients()) {
            if (patient.phone().equals(phone)) {
                return patient;
            }
        }
        throw new ApiProblem(HttpStatus.NOT_FOUND, "Not found", "Patient was not found");
    }

    private static void checkQuery(String sort, String segment) {
        if (!PatientRules.sort(sort)) {
            throw bad("Sort is not valid");
        }
        if (!PatientRules.segment(segment)) {
            throw bad("Filter is not valid");
        }
    }

    private static PatientRules.Profile patch(JsonNode body, PatientRules.Profile current) {
        if (body == null || !body.isObject()) {
            throw bad("Profile is not valid");
        }
        return new PatientRules.Profile(
                body.has("age") ? integer(body.get("age")) : current.age(),
                body.has("gender") ? text(body, "gender") : current.gender(),
                body.has("bloodGroup") ? text(body, "bloodGroup") : current.bloodGroup(),
                body.has("dob") ? text(body, "dob") : current.dob(),
                body.has("address") ? text(body, "address") : current.address(),
                body.has("conditions") ? text(body, "conditions") : current.conditions(),
                body.has("allergies") ? text(body, "allergies") : current.allergies(),
                body.has("note") ? text(body, "note") : current.note(),
                body.has("consent") && body.get("consent").isBoolean()
                        ? body.get("consent").booleanValue()
                        : current.consent());
    }

    private static boolean clearAge(JsonNode body) {
        return body != null && body.has("age") && body.get("age").isNull();
    }

    private static Integer integer(JsonNode node) {
        if (node == null || node.isNull()) {
            return null;
        }
        if (!node.isIntegralNumber()) {
            throw bad("Profile is not valid");
        }
        return node.intValue();
    }

    private static BigDecimal amount(JsonNode body) {
        if (body == null || !body.has("amount") || !body.get("amount").isNumber()) {
            return null;
        }
        return body.get("amount").decimalValue();
    }

    private static Integer whole(JsonNode body, String field) {
        if (body == null || !body.has(field) || !body.get(field).isIntegralNumber()) {
            return null;
        }
        return body.get(field).intValue();
    }

    private static String text(JsonNode body, String field) {
        if (body == null || !body.has(field) || body.get(field).isNull()) {
            return "";
        }
        return body.get(field).asText().trim();
    }

    private static String blank(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static PatientRules.Patient copyProfile(PatientRules.Patient patient, PatientRules.Profile profile) {
        return new PatientRules.Patient(
                patient.phone(),
                patient.name(),
                patient.firstAt(),
                patient.lastAt(),
                patient.orders(),
                patient.units(),
                patient.spent(),
                patient.rx(),
                patient.points(),
                patient.availablePoints(),
                patient.tier(),
                patient.segments(),
                patient.creditOutstanding(),
                patient.given(),
                patient.repaid(),
                patient.daysSince(),
                patient.recency(),
                patient.frequency(),
                patient.monetary(),
                patient.rfm(),
                patient.credit(),
                profile,
                patient.purchases(),
                patient.ledger(),
                patient.reminders(),
                patient.feedback(),
                patient.redemptions());
    }

    private static PatientViews.Row row(PatientRules.Patient patient) {
        return new PatientViews.Row(
                patient.phone(),
                patient.name(),
                patient.orders(),
                money(patient.spent()),
                patient.units(),
                patient.lastAt().toString(),
                patient.rx(),
                patient.points(),
                patient.tier(),
                patient.segments(),
                money(patient.creditOutstanding()),
                patient.daysSince());
    }

    private static PatientViews.Detail detail(PatientRules.Patient patient) {
        PatientRules.Profile profile = patient.profile();
        return new PatientViews.Detail(
                patient.phone(),
                patient.name(),
                patient.firstAt().toString(),
                patient.lastAt().toString(),
                patient.orders(),
                patient.units(),
                money(patient.spent()),
                patient.rx(),
                patient.points(),
                patient.availablePoints(),
                patient.tier(),
                patient.segments(),
                money(patient.creditOutstanding()),
                money(patient.given()),
                money(patient.repaid()),
                money(patient.creditOutstanding()),
                patient.daysSince(),
                new PatientViews.Profile(
                        profile.age(),
                        profile.gender(),
                        profile.bloodGroup(),
                        profile.dob(),
                        profile.address(),
                        profile.conditions(),
                        profile.allergies(),
                        profile.note(),
                        profile.consent()),
                patient.purchases().stream()
                        .map(purchase -> new PatientViews.Purchase(
                                purchase.number(),
                                purchase.soldAt().toString(),
                                money(purchase.payable()),
                                purchase.payMode(),
                                purchase.units()))
                        .toList(),
                patient.ledger().stream()
                        .map(line -> new PatientViews.Ledger(
                                line.at().toString(), line.kind(), line.label(), money(line.amount()), line.ref()))
                        .toList(),
                patient.reminders().stream().map(PatientService::reminder).toList(),
                patient.feedback().stream().map(PatientService::feedback).toList(),
                patient.redemptions().stream().map(PatientService::redemption).toList());
    }

    private static PatientViews.Summary summary(PatientRules.Summary summary) {
        return new PatientViews.Summary(
                summary.named(),
                money(summary.lifetimeSales()),
                summary.repeat(),
                summary.chronic(),
                money(summary.creditOutstanding()),
                summary.active30(),
                summary.atRisk(),
                summary.refillsDue(),
                summary.loyaltyPoints(),
                summary.avgRating() == null ? null : money(summary.avgRating()));
    }

    private static List<PatientViews.Bucket> buckets(List<PatientRules.Bucket> buckets) {
        return buckets.stream()
                .map(bucket ->
                        new PatientViews.Bucket(bucket.key(), bucket.label(), money(bucket.amount()), bucket.count()))
                .toList();
    }

    private static PatientViews.Repayment repayment(PatientRules.Repayment repayment) {
        return new PatientViews.Repayment(
                repayment.code(),
                repayment.phone(),
                money(repayment.amount()),
                repayment.mode(),
                repayment.note(),
                repayment.at().toString());
    }

    private static PatientViews.Reminder reminder(PatientRules.Reminder reminder) {
        return new PatientViews.Reminder(
                reminder.id(),
                reminder.phone(),
                reminder.kind(),
                reminder.channel(),
                reminder.at().toString());
    }

    private static PatientViews.Redemption redemption(PatientRules.Redemption redemption) {
        return new PatientViews.Redemption(
                redemption.id(),
                redemption.phone(),
                redemption.points(),
                redemption.at().toString());
    }

    private static PatientViews.Feedback feedback(PatientRules.Feedback feedback) {
        return new PatientViews.Feedback(
                feedback.id(),
                feedback.phone(),
                feedback.rating(),
                feedback.nps(),
                feedback.comment(),
                feedback.at().toString());
    }

    private static PatientViews.Campaign campaign(PatientRules.Campaign campaign) {
        return new PatientViews.Campaign(
                campaign.id(),
                campaign.name(),
                campaign.segment(),
                campaign.channel(),
                campaign.message(),
                campaign.offerLabel(),
                campaign.reach(),
                campaign.sentAt().toString());
    }

    private static PatientViews.Leader leader(PatientRules.Patient patient) {
        return new PatientViews.Leader(
                patient.phone(),
                patient.name(),
                patient.recency(),
                patient.frequency(),
                patient.monetary(),
                patient.rfm(),
                patient.orders(),
                money(patient.spent()),
                patient.segments());
    }

    private static String money(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private void require(AccountPrincipal actor, String key, String detail) {
        if (!Access.pharmacy(
                actor.accountType(),
                actor.disabled(),
                actor.pharmacyRole(),
                actor.pharmacyId(),
                actor.pharmacyId(),
                actor.verificationStatus(),
                actor.permissions(),
                key)) {
            throw new ApiProblem(HttpStatus.FORBIDDEN, "Forbidden", detail);
        }
    }

    private static ApiProblem bad(String detail) {
        return new ApiProblem(HttpStatus.BAD_REQUEST, "Bad request", detail);
    }

    private record Loaded(PatientRules.Directory directory, List<PatientRules.Sale> sales) {}
}
