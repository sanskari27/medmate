package com.medmate.server.crm.web;

import java.util.List;

public final class PatientViews {

    private PatientViews() {}

    public record Row(
            String phone,
            String name,
            int orders,
            String spent,
            int units,
            String lastAt,
            boolean rx,
            int points,
            String tier,
            List<String> segments,
            String creditOutstanding,
            int daysSince) {}

    public record Summary(
            int named,
            String lifetimeSales,
            int repeat,
            int chronic,
            String creditOutstanding,
            int active30,
            int atRisk,
            int refillsDue,
            int loyaltyPoints,
            String avgRating) {}

    public record Bucket(String key, String label, String amount, int count) {}

    public record ListResponse(
            List<Row> patients, Summary summary, List<Bucket> aging, int page, int size, int total) {}

    public record ExportResponse(List<Row> patients) {}

    public record Profile(
            Integer age,
            String gender,
            String bloodGroup,
            String dob,
            String address,
            String conditions,
            String allergies,
            String note,
            boolean consent) {}

    public record Purchase(String number, String soldAt, String payable, String payMode, int units) {}

    public record Ledger(String at, String kind, String label, String amount, String ref) {}

    public record Reminder(String id, String phone, String kind, String channel, String at) {}

    public record Feedback(String id, String phone, int rating, Integer nps, String comment, String at) {}

    public record Redemption(String id, String phone, int points, String at) {}

    public record Detail(
            String phone,
            String name,
            String firstAt,
            String lastAt,
            int orders,
            int units,
            String spent,
            boolean rx,
            int points,
            int availablePoints,
            String tier,
            List<String> segments,
            String creditOutstanding,
            String given,
            String repaid,
            String outstanding,
            int daysSince,
            Profile profile,
            List<Purchase> purchases,
            List<Ledger> ledger,
            List<Reminder> reminders,
            List<Feedback> feedback,
            List<Redemption> redemptions) {}

    public record OneResponse(Detail patient) {}

    public record Repayment(String code, String phone, String amount, String mode, String note, String at) {}

    public record RepaymentResponse(Repayment repayment) {}

    public record ReminderResponse(Reminder reminder) {}

    public record RedemptionResponse(Redemption redemption) {}

    public record FeedbackResponse(Feedback feedback) {}

    public record First(String phone, String name) {}

    public record Campaign(
            String id,
            String name,
            String segment,
            String channel,
            String message,
            String offerLabel,
            int reach,
            String sentAt) {}

    public record CampaignResponse(Campaign campaign, First first) {}

    public record CampaignList(List<Campaign> campaigns) {}

    public record ReminderList(List<Reminder> reminders) {}

    public record FeedbackList(List<Feedback> feedback) {}

    public record Leader(
            String phone,
            String name,
            int r,
            int f,
            int m,
            int score,
            int orders,
            String spent,
            List<String> segments) {}

    public record Analytics(
            String averageLifetimeValue,
            int retentionPercent,
            int churnRisk,
            String campaignSales,
            int rfmLeaders,
            List<Leader> leaders) {}
}
