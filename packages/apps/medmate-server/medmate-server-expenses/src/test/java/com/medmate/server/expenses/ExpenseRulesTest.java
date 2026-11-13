package com.medmate.server.expenses;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;

class ExpenseRulesTest {

    private static final LocalDate TODAY = LocalDate.parse("2026-11-13");
    private final ObjectMapper json = new ObjectMapper();

    @Test
    void taxSplitsAnInclusiveAmount() {
        assertThat(ExpenseRules.tax(new BigDecimal("118.00"), 18)).isEqualByComparingTo("18.00");
        assertThat(ExpenseRules.tax(new BigDecimal("100.00"), 0)).isEqualByComparingTo("0.00");
    }

    @Test
    void categoriesKeepTheFixedOrderAndACustomNameOnce() {
        List<String> names = ExpenseRules.categories(List.of(
                new ExpenseRules.SavedCategory("Rent Expense", 1),
                new ExpenseRules.SavedCategory("Canteen", 4),
                new ExpenseRules.SavedCategory("Canteen", 2),
                new ExpenseRules.SavedCategory("Tea", 9)));

        assertThat(names).startsWith(ExpenseRules.CATEGORIES.toArray(String[]::new));
        assertThat(names).endsWith("Canteen", "Tea");
        assertThat(names.stream().filter(name -> name.equals("Canteen"))).hasSize(1);
        assertThat(names).hasSize(ExpenseRules.CATEGORIES.size() + 2);
    }

    @Test
    void numbersStartAtOneThousandOne() {
        assertThat(ExpenseRules.number(1)).isEqualTo("EXP-1001");
        assertThat(ExpenseRules.number(2)).isEqualTo("EXP-1002");
    }

    @Test
    void aFutureDateIsRejected() {
        ObjectNode body = expense("2026-11-14");

        assertThat(ExpenseRules.parse(body, TODAY).problem()).isEqualTo("Expense is not valid");
        assertThat(ExpenseRules.parse(expense("2026-11-13"), TODAY).problem()).isNull();
        assertThat(ExpenseRules.parse(expense("2026-11-13"), TODAY).draft().amount())
                .isEqualByComparingTo("118.00");
    }

    @Test
    void anOmittedRangeIsTheLast365Days() {
        ExpenseRules.Range range = ExpenseRules.range(null, " ", TODAY);

        assertThat(range.from()).isEqualTo(TODAY.minusDays(364));
        assertThat(range.to()).isEqualTo(TODAY);
        assertThat(ExpenseRules.range("2026-11-13", "2026-11-01", TODAY)).isNull();
        assertThat(ExpenseRules.range("2026-11-01", null, TODAY)).isNull();
    }

    private ObjectNode expense(String spentOn) {
        ObjectNode body = json.createObjectNode();
        body.put("spentOn", spentOn);
        body.put("party", "Landlord");
        body.put("category", "Rent Expense");
        body.put("paymentMode", "cash");
        body.put("amount", "118.00");
        body.put("gst", 18);
        return body;
    }
}
