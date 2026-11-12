package com.medmate.server.billing;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;

class SaleReturnRulesTest {

    @Test
    void extraSpreadGivesTheRemainderToTheLastPositiveLine() {
        assertThat(SaleReturnRules.extraShares(
                        List.of(new BigDecimal("1.00"), new BigDecimal("1.00")), new BigDecimal("0.01")))
                .containsExactly(new BigDecimal("0.01"), new BigDecimal("0.00"));
        assertThat(SaleReturnRules.extraShares(
                        List.of(new BigDecimal("30.00"), new BigDecimal("0.00"), new BigDecimal("20.00")),
                        new BigDecimal("5.00")))
                .containsExactly(new BigDecimal("3.00"), new BigDecimal("0.00"), new BigDecimal("2.00"));
    }

    @Test
    void earliestUnitsTakeTheExtraPaisaAndTheNextReturnTakesTheRest() {
        SaleReturnRules.SoldLine line = new SaleReturnRules.SoldLine(0, "med-a", "B1", 3, 0, new BigDecimal("4.00"));
        SaleReturnRules.Quote first = SaleReturnRules.quote(
                List.of(line), new BigDecimal("2.00"), List.of(new SaleReturnRules.RequestLine(0, 1)));
        assertThat(first.problem()).isNull();
        assertThat(first.amount()).isEqualByComparingTo("3.34");

        SaleReturnRules.SoldLine later = new SaleReturnRules.SoldLine(0, "med-a", "B1", 3, 1, new BigDecimal("4.00"));
        SaleReturnRules.Quote second = SaleReturnRules.quote(
                List.of(later), new BigDecimal("2.00"), List.of(new SaleReturnRules.RequestLine(0, 2)));
        assertThat(second.amount()).isEqualByComparingTo("6.66");
    }

    @Test
    void aFullReturnEqualsThePayable() {
        List<SaleReturnRules.SoldLine> sold = List.of(
                new SaleReturnRules.SoldLine(0, "med-a", "B1", 3, 0, new BigDecimal("10.00")),
                new SaleReturnRules.SoldLine(1, "med-b", "B2", 1, 0, new BigDecimal("20.00")));
        SaleReturnRules.Quote quote = SaleReturnRules.quote(
                sold,
                new BigDecimal("5.00"),
                List.of(new SaleReturnRules.RequestLine(0, 3), new SaleReturnRules.RequestLine(1, 1)));
        assertThat(quote.amount()).isEqualByComparingTo("45.00");
    }

    @Test
    void aZeroBillNetRefundsNothing() {
        SaleReturnRules.SoldLine line = new SaleReturnRules.SoldLine(0, "med-a", "B1", 2, 0, new BigDecimal("0.00"));
        SaleReturnRules.Quote quote = SaleReturnRules.quote(
                List.of(line), new BigDecimal("1.00"), List.of(new SaleReturnRules.RequestLine(0, 2)));
        assertThat(quote.amount()).isEqualByComparingTo("0.00");
    }

    @Test
    void anOverReturnIsRefused() {
        SaleReturnRules.SoldLine line = new SaleReturnRules.SoldLine(0, "med-a", "B1", 1, 1, new BigDecimal("10.00"));
        SaleReturnRules.Quote quote =
                SaleReturnRules.quote(List.of(line), BigDecimal.ZERO, List.of(new SaleReturnRules.RequestLine(0, 1)));
        assertThat(quote.problem()).isEqualTo("Return is more than the quantity sold");
    }

    @Test
    void returnNumbersStartAtOneAndDoNotReuseAGap() {
        assertThat(SaleReturnRules.nextCode(List.of())).isEqualTo("RET-001");
        assertThat(SaleReturnRules.nextCode(List.of("RET-001", "RET-003"))).isEqualTo("RET-004");
    }
}
