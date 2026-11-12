package com.medmate.server.stock;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.List;
import org.junit.jupiter.api.Test;

class RackRulesTest {

    private final ObjectMapper json = new ObjectMapper();

    @Test
    void normalizesAndRejectsABlankRack() {
        assertThat(RackRules.normalize("  a3-12 ")).isEqualTo("A3-12");
        assertThat(RackRules.required("  ").problem()).isEqualTo("Rack code is required");
        assertThat(RackRules.requiredRack(json.createObjectNode()).problem()).isEqualTo("Rack code is required");
    }

    @Test
    void rejectsADuplicateRegistryCode() {
        assertThat(RackRules.taken("A3-12", List.of("A1", "A3-12"))).isTrue();
        assertThat(RackRules.taken("B1", List.of("A1"))).isFalse();
    }

    @Test
    void bulkAssignKeepsTheSecondSlot() {
        RackRules.Placement current = new RackRules.Placement("A1", "C2");
        assertThat(RackRules.assignPrimary(current, "B4")).isEqualTo(new RackRules.Placement("B4", "C2"));
    }

    @Test
    void patchClearsOnlyTheFieldThatWasEmptied() throws Exception {
        RackRules.Placement current = new RackRules.Placement("A1", "C2");
        ObjectNode primary = json.createObjectNode().put("rack", "b4");
        assertThat(RackRules.location(primary, current).placement()).isEqualTo(new RackRules.Placement("B4", "C2"));

        ObjectNode clearPrimary = json.createObjectNode().put("rack", "  ");
        assertThat(RackRules.location(clearPrimary, current).placement())
                .isEqualTo(new RackRules.Placement(null, "C2"));

        ObjectNode clearAlt = json.createObjectNode().put("rackAlt", "");
        assertThat(RackRules.location(clearAlt, current).placement()).isEqualTo(new RackRules.Placement("A1", null));
    }
}
