package com.medmate.server.oversight;

import com.medmate.server.dashboard.DashboardRules;
import com.medmate.server.oversight.store.InsightStore;
import com.medmate.server.reports.ReportBooks;
import com.medmate.server.reports.ReportRules;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class InsightRules {

    private static final BigDecimal ZERO = BigDecimal.ZERO.setScale(2);
    private static final Pattern BILLS = Pattern.compile("(\\d+) bills · (\\d+) units");
    private static final List<String> AGE = List.of("0–30", "31–60", "61–90", "90+");
    private static final List<String> REMINDERS = List.of("refill", "adherence", "followup", "winback");

    private InsightRules() {}

    public record Score(
            InsightStore.Profile profile,
            String netSales,
            String outstanding,
            String returnRate,
            String expiringValue) {}

    public static InsightViews.Fleet fleet(
            List<InsightStore.Profile> profiles,
            List<Double> resolveHours,
            int openCases,
            List<InsightStore.TicketRank> tickets,
            List<Score> scores,
            String rankingRange) {
        int approved = 0;
        int blocked = 0;
        int compliance = 0;
        int fin = 0;
        int incomplete = 0;
        int rejected = 0;
        int online = 0;
        int kiosk = 0;
        int eInvoicing = 0;
        int loose = 0;
        int lowStock = 0;
        List<String> statuses = new ArrayList<>();
        List<String> types = new ArrayList<>();
        List<String> cities = new ArrayList<>();
        List<String> states = new ArrayList<>();
        List<String> industries = new ArrayList<>();
        List<String> registrations = new ArrayList<>();
        List<String> businessTypes = new ArrayList<>();
        List<Double> toSubmit = new ArrayList<>();
        List<Double> toDecision = new ArrayList<>();
        List<InsightStore.Profile> dormant = new ArrayList<>();
        for (InsightStore.Profile profile : profiles) {
            String status = profile.status() == null ? "" : profile.status();
            statuses.add(statusLabel(status));
            types.add(typeLabel(profile.pharmacyType()));
            cities.add(blank(profile.city()));
            states.add(blank(profile.state()));
            industries.add(blank(profile.industry()));
            registrations.add(blank(profile.registrationType()));
            if (profile.businessTypes().isEmpty()) {
                businessTypes.add("—");
            } else {
                businessTypes.addAll(profile.businessTypes());
            }
            if (profile.onlineOrders()) {
                online++;
            }
            if (profile.kiosk()) {
                kiosk++;
            }
            if (profile.eInvoicing()) {
                eInvoicing++;
            }
            if (profile.looseSelling()) {
                loose++;
            }
            if (profile.lowStockAlerts()) {
                lowStock++;
            }
            if (profile.ownerDisabled()) {
                blocked++;
            }
            switch (status) {
                case "approved" -> approved++;
                case "pending_compliance" -> compliance++;
                case "pending_admin" -> fin++;
                case "rejected" -> rejected++;
                default -> incomplete++;
            }
            if (profile.createdAt() != null && profile.submittedAt() != null) {
                toSubmit.add(days(profile.createdAt(), profile.submittedAt()));
            }
            if (profile.submittedAt() != null && profile.decidedAt() != null) {
                toDecision.add(days(profile.submittedAt(), profile.decidedAt()));
            }
            if (dormant(profile)) {
                dormant.add(profile);
            }
        }
        dormant.sort(Comparator.comparing(InsightStore.Profile::name, Comparator.nullsLast(String::compareTo)));
        List<InsightViews.DormantPharmacy> shown = new ArrayList<>();
        for (InsightStore.Profile profile : dormant) {
            if (shown.size() == 8) {
                break;
            }
            shown.add(new InsightViews.DormantPharmacy(
                    profile.id(),
                    label(profile),
                    profile.approvedAt() == null ? profile.createdAt() : profile.approvedAt()));
        }
        return new InsightViews.Fleet(
                profiles.size(),
                new InsightViews.StatusCounts(approved, blocked, compliance, fin, incomplete, rejected),
                counts(statuses),
                counts(types),
                counts(cities),
                counts(states),
                counts(industries),
                counts(registrations),
                counts(businessTypes),
                new InsightViews.Features(profiles.size(), online, kiosk, eInvoicing, loose, lowStock),
                new InsightViews.Timing(median(toSubmit, 1), median(toDecision, 1)),
                new InsightViews.Dormant(dormant.size(), List.copyOf(shown)),
                new InsightViews.Support(openCases, median(resolveHours, 1)),
                rankingRange,
                new InsightViews.Rankings(
                        top(scores, Score::netSales),
                        top(scores, Score::outstanding),
                        top(scores, Score::returnRate),
                        top(scores, Score::expiringValue),
                        tickets.stream()
                                .map(ticket -> new InsightViews.Rank(
                                        ticket.pharmacyId(), ticket.name(), Integer.toString(ticket.open())))
                                .toList()));
    }

    public static Score score(
            InsightStore.Profile profile, ReportBooks books, DashboardRules.Parsed range, LocalDate today) {
        DashboardRules.Snapshot snapshot = DashboardRules.build(books, range, today);
        ReportRules.Result sales = ReportRules.run("sales-summary", books, range.from(), range.to(), today);
        String net = amount(sales, "Total sales");
        String returns = snapshot.window().returns();
        return new Score(
                profile,
                net,
                snapshot.dues().outstanding(),
                returnRate(net, returns),
                txt(expiringValue(books, today)));
    }

    public static InsightViews.One one(
            DashboardRules.Snapshot snapshot,
            ReportBooks books,
            ReportRules.Result sales,
            ReportRules.Result pnl,
            ReportRules.Result monthPnl,
            ReportRules.Result gst,
            ReportRules.Result ageing,
            InsightStore.Activity activity,
            LocalDate today) {
        int[] counted = billsUnits(sales == null ? null : sales.note());
        String net = amount(sales, "Total sales");
        String taxable = amount(pnl, "Taxable sales");
        String gross = amount(pnl, "Gross profit");
        String expenses = amount(pnl, "Expenses");
        Held held = held(books, today);
        List<InsightViews.ExpenseBar> bars = new ArrayList<>();
        for (DashboardRules.ExpenseBar bar : snapshot.window().expenses()) {
            if (bars.size() == 5) {
                break;
            }
            bars.add(new InsightViews.ExpenseBar(bar.category(), bar.amount()));
        }
        return new InsightViews.One(
                snapshot.range(),
                snapshot.from(),
                snapshot.to(),
                new InsightViews.Commercial(
                        new InsightViews.Today(
                                snapshot.today().netSales(),
                                snapshot.today().bills(),
                                snapshot.today().averageBill(),
                                snapshot.today().units(),
                                snapshot.today().cash(),
                                snapshot.today().credit(),
                                snapshot.today().returns(),
                                snapshot.today().returnCount()),
                        new InsightViews.Month(
                                snapshot.month().netSales(),
                                snapshot.month().purchases(),
                                snapshot.month().expenses(),
                                amount(monthPnl, "Net profit")),
                        new InsightViews.Window(
                                net,
                                counted[0],
                                amount(sales, "Average bill"),
                                counted[1],
                                amount(sales, "Cash sales"),
                                amount(sales, "Credit sales"),
                                new InsightViews.Collected(
                                        snapshot.window().collected().cash(),
                                        snapshot.window().collected().upi(),
                                        snapshot.window().collected().card()),
                                taxable,
                                amount(pnl, "COGS"),
                                gross,
                                margin(taxable, gross),
                                expenses,
                                amount(pnl, "Net profit"),
                                snapshot.window().returns(),
                                returnCount(books, LocalDate.parse(snapshot.from()), LocalDate.parse(snapshot.to())),
                                returnRate(net, snapshot.window().returns()),
                                List.copyOf(bars),
                                gst(gst),
                                new InsightViews.Credit(
                                        snapshot.dues().bills(), snapshot.dues().outstanding(), ageBuckets(ageing)),
                                distributorOutstanding(activity.openingRupees(), books),
                                last(books.bills().stream()
                                        .map(ReportBooks.Bill::soldOn)
                                        .toList()),
                                last(books.purchases().stream()
                                        .map(ReportBooks.Purchase::on)
                                        .toList()))),
                new InsightViews.Stock(
                        activity.products(),
                        held.batches,
                        snapshot.stock().cost(),
                        snapshot.stock().retail(),
                        snapshot.stock().low(),
                        snapshot.stock().out(),
                        held.expiringBatches,
                        held.expiredQty,
                        txt(held.expiredValue),
                        txt(held.expiringValue),
                        share(activity.prescriptionProducts(), activity.products()),
                        activity.racksInUse(),
                        activity.emptyRacks(),
                        snapshot.stock().attention().stream()
                                .map(row -> new InsightViews.Attention(row.name(), row.onHand(), row.reorder()))
                                .toList(),
                        snapshot.stock().expiringSoon().stream()
                                .map(row -> new InsightViews.Expiring(
                                        row.name(),
                                        row.batchNo(),
                                        row.expiry(),
                                        row.qty(),
                                        row.months(),
                                        row.expired()))
                                .toList()),
                people(activity),
                activity.cases());
    }

    public static boolean dormant(InsightStore.Profile profile) {
        if (!"approved".equals(profile.status())) {
            return false;
        }
        Instant since = profile.approvedAt() == null ? profile.createdAt() : profile.approvedAt();
        return profile.lastSale() == null
                || (since != null && profile.lastSale().isBefore(since));
    }

    public static String median(List<Double> values, int scale) {
        List<Double> sorted = new ArrayList<>();
        for (Double value : values) {
            if (value != null && !value.isNaN()) {
                sorted.add(value);
            }
        }
        sorted.sort(Comparator.naturalOrder());
        if (sorted.isEmpty()) {
            return null;
        }
        double mid = sorted.size() % 2 == 1
                ? sorted.get(sorted.size() / 2)
                : (sorted.get(sorted.size() / 2 - 1) + sorted.get(sorted.size() / 2)) / 2.0;
        return BigDecimal.valueOf(mid).setScale(scale, RoundingMode.HALF_UP).toPlainString();
    }

    public static List<InsightViews.Count> counts(List<String> labels) {
        Map<String, Integer> grouped = new LinkedHashMap<>();
        for (String label : labels) {
            grouped.merge(blank(label), 1, Integer::sum);
        }
        List<InsightViews.Count> counts = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : grouped.entrySet()) {
            counts.add(new InsightViews.Count(entry.getKey(), entry.getValue()));
        }
        counts.sort(
                Comparator.comparingInt(InsightViews.Count::count).reversed().thenComparing(InsightViews.Count::label));
        return List.copyOf(counts);
    }

    static String distributorOutstanding(long openingRupees, ReportBooks books) {
        BigDecimal total = BigDecimal.valueOf(openingRupees).setScale(2, RoundingMode.HALF_UP);
        for (ReportBooks.Purchase purchase : books.purchases()) {
            total = total.add(BigDecimal.valueOf(purchase.ledger()));
        }
        for (ReportBooks.PurchaseReturn returned : books.purchaseReturns()) {
            total = total.subtract(BigDecimal.valueOf(returned.ledger()));
        }
        for (ReportBooks.Payment payment : books.payments()) {
            total = total.subtract(payment.amount() == null ? ZERO : payment.amount());
        }
        return money(total).toPlainString();
    }

    private static InsightViews.People people(InsightStore.Activity activity) {
        Map<String, Integer> reminders = new LinkedHashMap<>();
        for (String kind : REMINDERS) {
            reminders.put(kind, 0);
        }
        for (InsightStore.KindCount count : activity.reminders()) {
            reminders.merge(count.kind(), count.count(), Integer::sum);
        }
        List<InsightViews.Reminder> rows = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : reminders.entrySet()) {
            rows.add(new InsightViews.Reminder(entry.getKey(), entry.getValue()));
        }
        return new InsightViews.People(
                new InsightViews.Staff(
                        activity.staff().size(),
                        (int) activity.staff().stream()
                                .filter(InsightStore.StaffMember::disabled)
                                .count(),
                        activity.staff().stream()
                                .map(member -> new InsightViews.StaffMember(
                                        member.name().isBlank() ? "—" : member.name(),
                                        member.disabled(),
                                        member.permissions()))
                                .toList()),
                new InsightViews.Employees(
                        activity.activeEmployees(),
                        activity.inactiveEmployees(),
                        activity.fullTime(),
                        activity.partTime(),
                        activity.contract()),
                new InsightViews.Patients(activity.buyers(), activity.repeatBuyers(), activity.consented()),
                new InsightViews.Crm(
                        List.copyOf(rows),
                        activity.points(),
                        activity.campaigns(),
                        activity.reach(),
                        activity.rating(),
                        activity.nps()),
                new InsightViews.Offers(activity.offerPercent(), activity.offerFlat(), activity.stampedLines()));
    }

    private static InsightViews.Gst gst(ReportRules.Result result) {
        String outward = "0.00";
        String inward = "0.00";
        if (result != null && result.rows().size() > 0 && result.rows().get(0).size() > 2) {
            outward = String.valueOf(result.rows().get(0).get(2));
        }
        if (result != null && result.rows().size() > 1 && result.rows().get(1).size() > 2) {
            inward = String.valueOf(result.rows().get(1).get(2));
        }
        String position = "payable";
        String amount = "0.00";
        if (result != null && result.totals() != null && !result.totals().isEmpty()) {
            String label = String.valueOf(result.totals().get(0));
            if (label.toLowerCase(Locale.ROOT).contains("credit")) {
                position = "credit";
            }
            if (result.totals().size() > 2 && result.totals().get(2) != null) {
                amount = String.valueOf(result.totals().get(2));
            }
        }
        return new InsightViews.Gst(outward, inward, position, amount);
    }

    private static List<InsightViews.AgeBucket> ageBuckets(ReportRules.Result result) {
        Map<String, BucketAcc> grouped = new LinkedHashMap<>();
        for (String bucket : AGE) {
            grouped.put(bucket, new BucketAcc());
        }
        if (result != null) {
            for (List<Object> row : result.rows()) {
                if (row.size() < 5 || row.get(4) == null) {
                    continue;
                }
                BucketAcc acc = grouped.computeIfAbsent(String.valueOf(row.get(4)), ignored -> new BucketAcc());
                acc.bills++;
                if (row.get(2) != null) {
                    acc.amount = money(acc.amount.add(new BigDecimal(String.valueOf(row.get(2)))));
                }
            }
        }
        List<InsightViews.AgeBucket> buckets = new ArrayList<>();
        for (String bucket : AGE) {
            BucketAcc acc = grouped.get(bucket);
            buckets.add(new InsightViews.AgeBucket(bucket, acc.bills, txt(acc.amount)));
        }
        return List.copyOf(buckets);
    }

    private static int returnCount(ReportBooks books, LocalDate from, LocalDate to) {
        int count = 0;
        for (ReportBooks.SaleReturn returned : books.saleReturns()) {
            if (returned.on() != null
                    && !returned.on().isBefore(from)
                    && !returned.on().isAfter(to)) {
                count++;
            }
        }
        return count;
    }

    private static String returnRate(String netSales, String returns) {
        BigDecimal net = money(new BigDecimal(netSales));
        BigDecimal returned = money(new BigDecimal(returns));
        BigDecimal base = money(net.add(returned));
        if (base.signum() <= 0) {
            return "0.00";
        }
        return returned.multiply(new BigDecimal("100"))
                .divide(base, 2, RoundingMode.HALF_UP)
                .toPlainString();
    }

    private static String margin(String taxable, String gross) {
        BigDecimal tax = money(new BigDecimal(taxable));
        if (tax.signum() == 0) {
            return "0.00";
        }
        return new BigDecimal(gross)
                .multiply(new BigDecimal("100"))
                .divide(tax, 2, RoundingMode.HALF_UP)
                .toPlainString();
    }

    private static BigDecimal expiringValue(ReportBooks books, LocalDate today) {
        return held(books, today).expiringValue.add(held(books, today).expiredValue);
    }

    private static Held held(ReportBooks books, LocalDate today) {
        YearMonth month = YearMonth.from(today);
        Held held = new Held();
        for (ReportBooks.Product product : books.products()) {
            held.batches += product.batches().size();
            for (ReportBooks.Batch batch : product.batches()) {
                if (batch.qty() <= 0) {
                    continue;
                }
                int months = months(batch.expiry(), month);
                BigDecimal value = money(nz(batch.rate()).multiply(BigDecimal.valueOf(batch.qty())));
                if (months < 0) {
                    held.expiredQty += batch.qty();
                    held.expiredValue = money(held.expiredValue.add(value));
                } else if (months <= 4) {
                    held.expiringBatches++;
                    held.expiringValue = money(held.expiringValue.add(value));
                }
            }
        }
        return held;
    }

    private static int months(String expiry, YearMonth today) {
        try {
            YearMonth month = YearMonth.parse(expiry);
            return (month.getYear() - today.getYear()) * 12 + month.getMonthValue() - today.getMonthValue();
        } catch (RuntimeException exception) {
            return Integer.MIN_VALUE;
        }
    }

    private static String last(List<LocalDate> days) {
        LocalDate last = null;
        for (LocalDate day : days) {
            if (day != null && (last == null || day.isAfter(last))) {
                last = day;
            }
        }
        return last == null ? null : last.toString();
    }

    private static String amount(ReportRules.Result result, String label) {
        if (result == null) {
            return "0.00";
        }
        for (List<Object> row : result.rows()) {
            if (!row.isEmpty() && label.equals(String.valueOf(row.get(0))) && row.size() > 1 && row.get(1) != null) {
                return String.valueOf(row.get(1));
            }
        }
        return "0.00";
    }

    private static int[] billsUnits(String note) {
        if (note == null) {
            return new int[] {0, 0};
        }
        Matcher matcher = BILLS.matcher(note);
        if (!matcher.find()) {
            return new int[] {0, 0};
        }
        return new int[] {Integer.parseInt(matcher.group(1)), Integer.parseInt(matcher.group(2))};
    }

    private static List<InsightViews.Rank> top(List<Score> scores, java.util.function.Function<Score, String> value) {
        List<Score> ranked = new ArrayList<>();
        for (Score score : scores) {
            if (money(new BigDecimal(value.apply(score))).signum() > 0) {
                ranked.add(score);
            }
        }
        ranked.sort(Comparator.comparing((Score score) -> new BigDecimal(value.apply(score)))
                .reversed()
                .thenComparing(score -> label(score.profile())));
        List<InsightViews.Rank> ranks = new ArrayList<>();
        for (Score score : ranked) {
            if (ranks.size() == 5) {
                break;
            }
            ranks.add(new InsightViews.Rank(score.profile().id(), label(score.profile()), value.apply(score)));
        }
        return List.copyOf(ranks);
    }

    private static String label(InsightStore.Profile profile) {
        if (profile.name() != null && !profile.name().isBlank()) {
            return profile.name().trim();
        }
        return profile.phone() == null || profile.phone().isBlank() ? "—" : profile.phone();
    }

    private static String statusLabel(String status) {
        return switch (status) {
            case "approved" -> "Approved";
            case "pending_compliance" -> "Compliance review";
            case "pending_admin" -> "Final review";
            case "rejected" -> "Rejected";
            case "incomplete" -> "Incomplete";
            default -> blank(status);
        };
    }

    private static String typeLabel(String type) {
        if (type == null || type.isBlank()) {
            return "—";
        }
        if ("pharmacy".equals(type)) {
            return "Pharmacy";
        }
        if ("hospital".equals(type)) {
            return "Hospital";
        }
        return type;
    }

    private static double days(Instant from, Instant to) {
        return (to.toEpochMilli() - from.toEpochMilli()) / 86_400_000d;
    }

    private static String share(int flagged, int total) {
        if (total <= 0) {
            return "0.00";
        }
        return BigDecimal.valueOf(flagged)
                .multiply(new BigDecimal("100"))
                .divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP)
                .toPlainString();
    }

    private static String blank(String value) {
        return value == null || value.isBlank() ? "—" : value.trim();
    }

    private static String txt(BigDecimal value) {
        return money(value).toPlainString();
    }

    private static BigDecimal nz(BigDecimal value) {
        return value == null ? ZERO : value;
    }

    private static BigDecimal money(BigDecimal value) {
        return (value == null ? ZERO : value).setScale(2, RoundingMode.HALF_UP);
    }

    private static final class BucketAcc {
        private int bills;
        private BigDecimal amount = ZERO;
    }

    private static final class Held {
        private int batches;
        private int expiringBatches;
        private int expiredQty;
        private BigDecimal expiredValue = ZERO;
        private BigDecimal expiringValue = ZERO;
    }
}
