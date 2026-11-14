package com.medmate.server.wards;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;

class WardRulesTest {

    private final ObjectMapper json = new ObjectMapper();

    @Test
    void chargeUsesTheWholeStayAndAtLeastOneDay() {
        Instant admitted = Instant.parse("2026-11-14T00:00:00Z");
        assertThat(WardRules.days(admitted, admitted)).isEqualTo(1);
        assertThat(WardRules.days(admitted, admitted.plusMillis(86_400_000L))).isEqualTo(1);
        assertThat(WardRules.days(admitted, admitted.plusMillis(86_400_001L))).isEqualTo(2);
        assertThat(WardRules.charge(new BigDecimal("1000.00"), 3)).isEqualByComparingTo("3000.00");
        assertThat(WardRules.charge(new BigDecimal("0.00"), 4)).isEqualByComparingTo("0.00");
    }

    @Test
    void lastLabelsAreHeldAndCannotCoverAnOccupiedBed() {
        assertThat(WardRules.held(10, 2, 8)).isFalse();
        assertThat(WardRules.held(10, 2, 9)).isTrue();
        assertThat(WardRules.held(10, 2, 10)).isTrue();
        assertThat(WardRules.bedLabel("ORT", 9)).isEqualTo("ORT-9");
        assertThat(WardRules.assignProblem(10, 2, 9, false, false)).isEqualTo("Bed is held for maintenance");
        assertThat(WardRules.assignProblem(10, 0, 3, false, true)).isEqualTo("Ward is under maintenance");
        assertThat(WardRules.assignProblem(10, 0, 3, true, false)).isEqualTo("Bed is not free");
        assertThat(WardRules.capacityProblem(4, 1, List.of(4))).isEqualTo("Held beds cover an occupied bed");
        assertThat(WardRules.capacityProblem(3, 0, List.of(4))).isEqualTo("Bed count is below the occupied beds");
        assertThat(WardRules.capacityProblem(4, 1, List.of(3))).isNull();
    }

    @Test
    void createDefaultsAndDischargeMode() throws Exception {
        ObjectNode body = json.createObjectNode();
        body.put("name", " Orthopaedic ");
        body.put("code", "ort");
        body.put("beds", 10);
        WardRules.Prepared prepared = WardRules.prepareCreate(body);
        assertThat(prepared.problem()).isNull();
        assertThat(prepared.values().name()).isEqualTo("Orthopaedic");
        assertThat(prepared.values().code()).isEqualTo("ORT");
        assertThat(prepared.values().category()).isEqualTo("General");
        assertThat(prepared.values().beds()).isEqualTo(10);
        assertThat(prepared.values().dailyRate()).isEqualByComparingTo("0.00");
        assertThat(prepared.values().bedsHeld()).isZero();
        assertThat(prepared.values().underMaintenance()).isFalse();

        ObjectNode discharge = json.createObjectNode();
        assertThat(WardRules.payMode(discharge)).isNull();
        discharge.put("payMode", "cash");
        assertThat(WardRules.payMode(discharge)).isEqualTo("cash");
        discharge.put("payMode", "khata");
        assertThat(WardRules.payModeProblem(discharge)).isEqualTo("Pay mode is not recognised");
    }
}
