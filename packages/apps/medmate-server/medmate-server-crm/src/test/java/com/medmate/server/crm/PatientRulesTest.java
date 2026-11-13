package com.medmate.server.crm;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class PatientRulesTest {

    private static final Instant NOW = Instant.parse("2026-11-13T10:00:00Z");

    @Test
    void thePhoneIsTheKeyAndWalkInNamesStayOut() {
        PatientRules.Directory directory = PatientRules.directory(
                List.of(
                        sale("INV-0002", "Bea", "9886012345", "cash", "2026-11-13T09:00:00Z", "40.00"),
                        sale("INV-0001", "Ada", "9886012345", "cash", "2026-11-01T09:00:00Z", "250.00"),
                        sale("INV-0003", "Walk-in", "9886012346", "cash", "2026-11-13T09:00:00Z", "10.00"),
                        sale("INV-0004", "Kiosk (self-order)", "9886012347", "cash", "2026-11-13T09:00:00Z", "10.00")),
                List.of(),
                List.of(),
                Map.of(),
                List.of(),
                List.of(),
                List.of(),
                NOW);
        assertThat(directory.patients()).hasSize(1);
        PatientRules.Patient patient = directory.patients().get(0);
        assertThat(patient.phone()).isEqualTo("9886012345");
        assertThat(patient.name()).isEqualTo("Ada");
        assertThat(patient.orders()).isEqualTo(2);
        assertThat(patient.points()).isEqualTo(2);
        assertThat(patient.tier()).isEqualTo("New");
        assertThat(patient.segments()).doesNotContain("chronic").contains("high-value");
    }

    @Test
    void tiersFollowThePointThresholds() {
        assertThat(tier("1200.00")).isEqualTo("Silver");
        assertThat(tier("5000.00")).isEqualTo("Gold");
        assertThat(tier("12000.00")).isEqualTo("Platinum");
    }

    @Test
    void aReturnLowersTheBalanceAndALargerRepaymentIsRefused() {
        PatientRules.Directory directory = PatientRules.directory(
                List.of(
                        sale("INV-0001", "Ada", "9886012345", "cash", "2026-08-01T09:00:00Z", "10.00"),
                        sale("INV-0002", "Ada", "9886012345", "credit", "2026-08-02T09:00:00Z", "100.00")),
                List.of(new PatientRules.Refund("RET-001", "INV-0002", new BigDecimal("40.00"), NOW)),
                List.of(),
                Map.of(),
                List.of(),
                List.of(),
                List.of(),
                NOW);
        PatientRules.Patient patient = directory.patients().get(0);
        assertThat(patient.creditOutstanding()).isEqualByComparingTo("60.00");
        assertThat(patient.points()).isEqualTo(1);
        assertThat(patient.segments()).contains("credit", "lapsed").doesNotContain("chronic");
        assertThat(PatientRules.repaymentProblem(patient.creditOutstanding(), new BigDecimal("60.01"), "cash"))
                .isEqualTo("Repayment is more than the balance");
        assertThat(PatientRules.repaymentProblem(patient.creditOutstanding(), new BigDecimal("60.00"), "cash"))
                .isNull();
        assertThat(PatientRules.repaymentProblem(patient.creditOutstanding(), new BigDecimal("0"), "upi"))
                .isEqualTo("Repayment is not valid");
    }

    @Test
    void aRepaymentLedgerLineNamesThePaymentType() {
        PatientRules.Directory directory = PatientRules.directory(
                List.of(sale("INV-0002", "Ada", "9886012345", "credit", "2026-08-02T09:00:00Z", "100.00")),
                List.of(new PatientRules.Refund("RET-001", "INV-0002", new BigDecimal("10.00"), NOW)),
                List.of(
                        new PatientRules.Repayment("CR-001", "9886012345", new BigDecimal("20.00"), "cash", "  ", NOW),
                        new PatientRules.Repayment(
                                "CR-002",
                                "9886012345",
                                new BigDecimal("15.00"),
                                "upi",
                                " Counter ",
                                NOW.plusSeconds(1))),
                Map.of(),
                List.of(),
                List.of(),
                List.of(),
                NOW);
        assertThat(directory.patients().get(0).ledger())
                .extracting(PatientRules.Ledger::label)
                .containsExactly("Repayment · UPI · Counter", "Repayment · Cash", "Return", "Credit bill");
    }

    private static String tier(String payable) {
        return PatientRules.directory(
                        List.of(sale("INV-0001", "Ada", "9886012345", "cash", "2026-11-13T09:00:00Z", payable)),
                        List.of(),
                        List.of(),
                        Map.of(),
                        List.of(),
                        List.of(),
                        List.of(),
                        NOW)
                .patients()
                .get(0)
                .tier();
    }

    private static PatientRules.Sale sale(
            String number, String name, String phone, String payMode, String at, String payable) {
        return new PatientRules.Sale(
                number, name, phone, payMode, Instant.parse(at), new BigDecimal(payable), 1, false);
    }
}
