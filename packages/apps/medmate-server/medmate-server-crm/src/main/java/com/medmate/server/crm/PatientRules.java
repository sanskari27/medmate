package com.medmate.server.crm;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

public final class PatientRules {

    public static final String READ = "patients:read";
    public static final String UPDATE = "patients:update";
    public static final long DAY = 86_400_000L;

    private static final BigDecimal ZERO = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
    private static final BigDecimal ONE = new BigDecimal("1.00");
    private static final Set<String> SEGMENTS =
            Set.of("all", "chronic", "high-value", "lapsed", "new", "credit", "regular");
    private static final Set<String> MODES = Set.of("cash", "upi", "card");
    private static final Set<String> KINDS = Set.of("refill", "adherence", "followup", "winback");
    private static final Set<String> CHANNELS = Set.of("whatsapp", "sms");
    private static final Set<String> GENDERS = Set.of("Male", "Female", "Other");

    private PatientRules() {}

    public record Sale(
            String number,
            String name,
            String phone,
            String payMode,
            Instant soldAt,
            BigDecimal payable,
            int units,
            boolean prescription) {}

    public record Refund(String code, String billNumber, BigDecimal amount, Instant at) {}

    public record Repayment(String code, String phone, BigDecimal amount, String mode, String note, Instant at) {}

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

    public record Reminder(String id, String phone, String kind, String channel, Instant at) {}

    public record Redemption(String id, String phone, int points, Instant at) {}

    public record Feedback(String id, String phone, int rating, Integer nps, String comment, Instant at) {}

    public record Campaign(
            String id,
            String name,
            String segment,
            String channel,
            String message,
            String offerLabel,
            int reach,
            Instant sentAt) {}

    public record Purchase(String number, Instant soldAt, BigDecimal payable, String payMode, int units) {}

    public record Ledger(Instant at, String kind, String label, BigDecimal amount, String ref) {}

    public record Patient(
            String phone,
            String name,
            Instant firstAt,
            Instant lastAt,
            int orders,
            int units,
            BigDecimal spent,
            boolean rx,
            int points,
            int availablePoints,
            String tier,
            List<String> segments,
            BigDecimal creditOutstanding,
            BigDecimal given,
            BigDecimal repaid,
            int daysSince,
            int recency,
            int frequency,
            int monetary,
            int rfm,
            boolean credit,
            Profile profile,
            List<Purchase> purchases,
            List<Ledger> ledger,
            List<Reminder> reminders,
            List<Feedback> feedback,
            List<Redemption> redemptions) {}

    public record Bucket(String key, String label, BigDecimal amount, int count) {}

    public record Summary(
            int named,
            BigDecimal lifetimeSales,
            int repeat,
            int chronic,
            BigDecimal creditOutstanding,
            int active30,
            int atRisk,
            int refillsDue,
            int loyaltyPoints,
            BigDecimal avgRating) {}

    public record Directory(List<Patient> patients, Summary summary, List<Bucket> aging) {}

    public static boolean included(String name) {
        String trimmed = name == null ? "" : name.trim();
        return !trimmed.isEmpty() && !"Walk-in".equals(trimmed) && !"Kiosk (self-order)".equals(trimmed);
    }

    public static boolean segment(String value) {
        return value == null || value.isBlank() || SEGMENTS.contains(value);
    }

    public static boolean sort(String value) {
        return value == null
                || value.isBlank()
                || "spent".equals(value)
                || "orders".equals(value)
                || "recent".equals(value);
    }

    static String repaymentLabel(Repayment repayment) {
        String mode =
                switch (repayment.mode()) {
                    case "upi" -> "UPI";
                    case "card" -> "Card";
                    default -> "Cash";
                };
        String note = repayment.note() == null ? "" : repayment.note().trim();
        if (note.isEmpty()) {
            return "Repayment · " + mode;
        }
        return "Repayment · " + mode + " · " + note;
    }

    public static String repaymentProblem(BigDecimal outstanding, BigDecimal amount, String mode) {
        if (amount == null
                || amount.signum() <= 0
                || amount.stripTrailingZeros().scale() > 2
                || !MODES.contains(mode)) {
            return "Repayment is not valid";
        }
        if (amount.compareTo(outstanding) > 0) {
            return "Repayment is more than the balance";
        }
        return null;
    }

    public static String reminderProblem(String kind, String channel) {
        if (!KINDS.contains(kind) || !CHANNELS.contains(channel)) {
            return "Reminder is not valid";
        }
        return null;
    }

    public static String feedbackProblem(Integer rating, Integer nps) {
        if (rating == null || rating < 1 || rating > 5 || (nps != null && (nps < 0 || nps > 10))) {
            return "Feedback is not valid";
        }
        return null;
    }

    public static String campaignProblem(String segment, String channel, String message) {
        if (segment == null
                || !SEGMENTS.contains(segment)
                || !CHANNELS.contains(channel)
                || message == null
                || message.isBlank()) {
            return "Campaign is not valid";
        }
        return null;
    }

    public static String campaignName(String segment) {
        if ("all".equals(segment)) {
            return "All blast";
        }
        return switch (segment) {
            case "chronic" -> "Chronic care blast";
            case "high-value" -> "High value blast";
            case "lapsed" -> "Lapsed / at-risk blast";
            case "new" -> "New blast";
            case "credit" -> "On credit blast";
            default -> "Regular blast";
        };
    }

    public static Profile merge(Profile current, Profile patch, boolean clearAge) {
        Profile base = current == null ? emptyProfile() : current;
        return new Profile(
                clearAge ? null : patch.age() == null ? base.age() : patch.age(),
                patch.gender() == null ? base.gender() : blankToNull(patch.gender()),
                patch.bloodGroup() == null ? base.bloodGroup() : blankToNull(patch.bloodGroup()),
                patch.dob() == null ? base.dob() : blankToNull(patch.dob()),
                patch.address() == null ? base.address() : blankToNull(patch.address()),
                patch.conditions() == null ? base.conditions() : blankToNull(patch.conditions()),
                patch.allergies() == null ? base.allergies() : blankToNull(patch.allergies()),
                patch.note() == null ? base.note() : blankToNull(patch.note()),
                patch.consent());
    }

    public static String profileProblem(Profile profile) {
        if (profile.age() != null && (profile.age() < 0 || profile.age() > 120)) {
            return "Profile is not valid";
        }
        if (profile.gender() != null && !GENDERS.contains(profile.gender())) {
            return "Profile is not valid";
        }
        return null;
    }

    public static int redeemable(int available) {
        return Math.min(available, 50);
    }

    public static Directory directory(
            List<Sale> sales,
            List<Refund> refunds,
            List<Repayment> repayments,
            Map<String, Profile> profiles,
            List<Reminder> reminders,
            List<Redemption> redemptions,
            List<Feedback> feedback,
            Instant now) {
        Map<String, Acc> people = new LinkedHashMap<>();
        Map<String, Acc> byBill = new LinkedHashMap<>();
        for (Sale sale : sales) {
            if (!included(sale.name())) {
                continue;
            }
            Acc acc = people.computeIfAbsent(sale.phone(), Acc::new);
            if (acc.firstAt == null
                    || sale.soldAt().isBefore(acc.firstAt)
                    || (sale.soldAt().equals(acc.firstAt) && sale.number().compareTo(acc.firstNumber) < 0)) {
                acc.firstAt = sale.soldAt();
                acc.firstNumber = sale.number();
                acc.name = sale.name().trim();
            }
            if (acc.lastAt == null || sale.soldAt().isAfter(acc.lastAt)) {
                acc.lastAt = sale.soldAt();
            }
            acc.orders++;
            acc.units += sale.units();
            acc.spent = acc.spent.add(money(sale.payable()));
            acc.rx = acc.rx || sale.prescription();
            acc.purchases.add(
                    new Purchase(sale.number(), sale.soldAt(), money(sale.payable()), sale.payMode(), sale.units()));
            if ("credit".equals(sale.payMode())) {
                acc.credit = true;
                acc.given = acc.given.add(money(sale.payable()));
                acc.ledger.add(new Ledger(sale.soldAt(), "debit", "Credit bill", money(sale.payable()), sale.number()));
                acc.creditBills.add(new CreditBill(sale.number(), sale.soldAt(), money(sale.payable())));
            }
            byBill.put(sale.number(), acc);
        }
        for (Refund refund : refunds) {
            Acc acc = byBill.get(refund.billNumber());
            if (acc == null) {
                continue;
            }
            CreditBill bill = acc.bill(refund.billNumber());
            if (bill == null) {
                continue;
            }
            BigDecimal amount = money(refund.amount());
            acc.returned = acc.returned.add(amount);
            acc.refunds.merge(refund.billNumber(), amount, BigDecimal::add);
            acc.ledger.add(new Ledger(refund.at(), "return", "Return", amount, refund.code()));
        }
        Map<String, Integer> redeemed = new LinkedHashMap<>();
        for (Redemption redemption : redemptions) {
            redeemed.merge(redemption.phone(), redemption.points(), Integer::sum);
        }
        for (Repayment repayment : repayments) {
            Acc acc = people.get(repayment.phone());
            if (acc == null) {
                continue;
            }
            acc.credit = true;
            acc.repaid = acc.repaid.add(money(repayment.amount()));
            acc.ledger.add(new Ledger(
                    repayment.at(),
                    "repayment",
                    repaymentLabel(repayment),
                    money(repayment.amount()),
                    repayment.code()));
        }
        BigDecimal maxSpent = ONE;
        for (Acc acc : people.values()) {
            if (acc.spent.compareTo(maxSpent) > 0) {
                maxSpent = acc.spent;
            }
        }
        List<Patient> patients = new ArrayList<>();
        for (Acc acc : people.values()) {
            acc.outstanding =
                    acc.given.subtract(acc.returned).subtract(acc.repaid).max(ZERO);
            int points = acc.spent
                    .divide(new BigDecimal("100"), 0, RoundingMode.DOWN)
                    .intValue();
            int available = Math.max(0, points - redeemed.getOrDefault(acc.phone, 0));
            int days = (int) Math.floorDiv(now.toEpochMilli() - acc.lastAt.toEpochMilli(), DAY);
            int recency = days <= 15 ? 5 : days <= 30 ? 4 : days <= 60 ? 3 : days <= 90 ? 2 : 1;
            int frequency = acc.orders >= 8 ? 5 : acc.orders >= 5 ? 4 : acc.orders >= 3 ? 3 : acc.orders >= 2 ? 2 : 1;
            int monetary = monetary(acc.spent, maxSpent);
            List<String> segments = new ArrayList<>();
            if (monetary >= 4) {
                segments.add("high-value");
            }
            if (days > 60 && acc.orders >= 2) {
                segments.add("lapsed");
            }
            if (acc.credit) {
                segments.add("credit");
            }
            if (acc.orders == 1 && days <= 30) {
                segments.add("new");
            }
            if (segments.isEmpty()) {
                segments.add("regular");
            }
            acc.purchases.sort(Comparator.comparing(Purchase::soldAt)
                    .reversed()
                    .thenComparing(Purchase::number)
                    .reversed());
            acc.ledger.sort(Comparator.comparing(Ledger::at).reversed().thenComparing(Ledger::ref));
            patients.add(new Patient(
                    acc.phone,
                    acc.name,
                    acc.firstAt,
                    acc.lastAt,
                    acc.orders,
                    acc.units,
                    money(acc.spent),
                    acc.rx,
                    points,
                    available,
                    tier(points),
                    List.copyOf(segments),
                    money(acc.outstanding),
                    money(acc.given),
                    money(acc.repaid),
                    days,
                    recency,
                    frequency,
                    monetary,
                    recency + frequency + monetary,
                    acc.credit,
                    profiles.getOrDefault(acc.phone, emptyProfile()),
                    List.copyOf(acc.purchases),
                    List.copyOf(acc.ledger),
                    reminders.stream()
                            .filter(row -> row.phone().equals(acc.phone))
                            .sorted(Comparator.comparing(Reminder::at).reversed())
                            .toList(),
                    feedback.stream()
                            .filter(row -> row.phone().equals(acc.phone))
                            .sorted(Comparator.comparing(Feedback::at).reversed())
                            .toList(),
                    redemptions.stream()
                            .filter(row -> row.phone().equals(acc.phone))
                            .sorted(Comparator.comparing(Redemption::at).reversed())
                            .toList()));
        }
        patients.sort(Comparator.comparing(Patient::spent).reversed().thenComparing(Patient::phone));
        return new Directory(patients, summary(patients, feedback), aging(people.values(), now));
    }

    public static List<Patient> filter(List<Patient> patients, String query, String segment, String sort) {
        String needle = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        String chosen = segment == null || segment.isBlank() ? "all" : segment;
        List<Patient> rows = new ArrayList<>();
        for (Patient patient : patients) {
            if (!needle.isEmpty()
                    && !patient.name().toLowerCase(Locale.ROOT).contains(needle)
                    && !patient.phone().contains(needle)) {
                continue;
            }
            if (!"all".equals(chosen) && !patient.segments().contains(chosen)) {
                continue;
            }
            rows.add(patient);
        }
        Comparator<Patient> order =
                switch (sort == null || sort.isBlank() ? "spent" : sort) {
                    case "orders" -> Comparator.comparingInt(Patient::orders)
                            .reversed()
                            .thenComparing(Patient::phone);
                    case "recent" -> Comparator.comparing(Patient::lastAt)
                            .reversed()
                            .thenComparing(Patient::phone);
                    default -> Comparator.comparing(Patient::spent).reversed().thenComparing(Patient::phone);
                };
        rows.sort(order);
        return rows;
    }

    public static boolean inSegment(Patient patient, String segment) {
        return "all".equals(segment) || patient.segments().contains(segment);
    }

    public static BigDecimal campaignSales(List<Campaign> campaigns, List<Patient> patients, List<Sale> sales) {
        BigDecimal total = ZERO;
        for (Campaign campaign : campaigns) {
            Set<String> phones = new java.util.HashSet<>();
            for (Patient patient : patients) {
                if (inSegment(patient, campaign.segment())) {
                    phones.add(patient.phone());
                }
            }
            for (Sale sale : sales) {
                if (!included(sale.name()) || !phones.contains(sale.phone())) {
                    continue;
                }
                if (!sale.soldAt().isBefore(campaign.sentAt())) {
                    total = total.add(money(sale.payable()));
                }
            }
        }
        return money(total);
    }

    public static List<Patient> leaders(List<Patient> patients) {
        List<Patient> copy = new ArrayList<>(patients);
        copy.sort(Comparator.comparingInt(Patient::rfm).reversed().thenComparing(Patient::phone));
        return copy.subList(0, Math.min(10, copy.size()));
    }

    public static Profile emptyProfile() {
        return new Profile(null, null, null, null, null, null, null, null, false);
    }

    private static Summary summary(List<Patient> patients, List<Feedback> feedback) {
        BigDecimal lifetime = ZERO;
        BigDecimal credit = ZERO;
        int repeat = 0;
        int active = 0;
        int risk = 0;
        int points = 0;
        for (Patient patient : patients) {
            lifetime = lifetime.add(patient.spent());
            credit = credit.add(patient.creditOutstanding());
            if (patient.orders() > 1) {
                repeat++;
            }
            if (patient.daysSince() <= 30) {
                active++;
            }
            if (patient.daysSince() > 60 && patient.orders() >= 2) {
                risk++;
            }
            points += patient.availablePoints();
        }
        BigDecimal rating = null;
        if (!feedback.isEmpty()) {
            BigDecimal sum = BigDecimal.ZERO;
            for (Feedback row : feedback) {
                sum = sum.add(BigDecimal.valueOf(row.rating()));
            }
            rating = sum.divide(BigDecimal.valueOf(feedback.size()), 2, RoundingMode.HALF_UP);
        }
        return new Summary(patients.size(), money(lifetime), repeat, 0, money(credit), active, risk, 0, points, rating);
    }

    private static List<Bucket> aging(Iterable<Acc> people, Instant now) {
        BigDecimal cur = ZERO;
        BigDecimal mid = ZERO;
        BigDecimal old = ZERO;
        int curCount = 0;
        int midCount = 0;
        int oldCount = 0;
        for (Acc acc : people) {
            if (acc.outstanding.signum() <= 0) {
                continue;
            }
            int age = oldestUnpaidAge(acc, now);
            if (age <= 30) {
                cur = cur.add(acc.outstanding);
                curCount++;
            } else if (age <= 60) {
                mid = mid.add(acc.outstanding);
                midCount++;
            } else {
                old = old.add(acc.outstanding);
                oldCount++;
            }
        }
        return List.of(
                new Bucket("cur", "0–30 days", money(cur), curCount),
                new Bucket("d60", "31–60 days", money(mid), midCount),
                new Bucket("d60p", "60+ days", money(old), oldCount));
    }

    private static int oldestUnpaidAge(Acc acc, Instant now) {
        List<CreditBill> bills = new ArrayList<>(acc.creditBills);
        bills.sort(Comparator.comparing(CreditBill::at).thenComparing(CreditBill::number));
        BigDecimal pool = acc.repaid;
        Instant oldest = null;
        for (CreditBill bill : bills) {
            BigDecimal net = bill.amount
                    .subtract(acc.refunds.getOrDefault(bill.number, ZERO))
                    .max(ZERO);
            BigDecimal left = net.subtract(pool).max(ZERO);
            pool = pool.subtract(net).max(ZERO);
            if (left.signum() > 0 && oldest == null) {
                oldest = bill.at;
            }
        }
        if (oldest == null) {
            return 0;
        }
        return (int) Math.floorDiv(now.toEpochMilli() - oldest.toEpochMilli(), DAY);
    }

    private static int monetary(BigDecimal spent, BigDecimal max) {
        if (spent.compareTo(max.multiply(new BigDecimal("0.60"))) >= 0) {
            return 5;
        }
        if (spent.compareTo(max.multiply(new BigDecimal("0.35"))) >= 0) {
            return 4;
        }
        if (spent.compareTo(max.multiply(new BigDecimal("0.18"))) >= 0) {
            return 3;
        }
        if (spent.compareTo(max.multiply(new BigDecimal("0.08"))) >= 0) {
            return 2;
        }
        return 1;
    }

    private static String tier(int points) {
        if (points >= 120) {
            return "Platinum";
        }
        if (points >= 50) {
            return "Gold";
        }
        if (points >= 12) {
            return "Silver";
        }
        return "New";
    }

    private static String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static BigDecimal money(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private record CreditBill(String number, Instant at, BigDecimal amount) {}

    private static final class Acc {
        private final String phone;
        private String name;
        private Instant firstAt;
        private String firstNumber;
        private Instant lastAt;
        private int orders;
        private int units;
        private BigDecimal spent = ZERO;
        private boolean rx;
        private boolean credit;
        private BigDecimal given = ZERO;
        private BigDecimal returned = ZERO;
        private BigDecimal repaid = ZERO;
        private BigDecimal outstanding = ZERO;
        private final List<Purchase> purchases = new ArrayList<>();
        private final List<Ledger> ledger = new ArrayList<>();
        private final List<CreditBill> creditBills = new ArrayList<>();
        private final Map<String, BigDecimal> refunds = new LinkedHashMap<>();

        private Acc(String phone) {
            this.phone = phone;
        }

        private CreditBill bill(String number) {
            for (CreditBill bill : creditBills) {
                if (bill.number.equals(number)) {
                    return bill;
                }
            }
            return null;
        }
    }
}
