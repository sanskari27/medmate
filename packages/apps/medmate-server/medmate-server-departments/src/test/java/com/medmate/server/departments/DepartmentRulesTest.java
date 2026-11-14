package com.medmate.server.departments;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class DepartmentRulesTest {

    private final ObjectMapper json = new ObjectMapper();

    @Test
    void createRequiresANameAndCodeWithinTheColumnLimits() {
        ObjectNode body = json.createObjectNode();
        assertThat(DepartmentRules.prepareCreate(body).problem()).isEqualTo("Department name is required");
        body.put("name", "  ");
        assertThat(DepartmentRules.prepareCreate(body).problem()).isEqualTo("Department name is required");
        body.put("name", "N".repeat(101));
        assertThat(DepartmentRules.prepareCreate(body).problem()).isEqualTo("Department name is too long");
        body.put("name", " Cardiology ");
        assertThat(DepartmentRules.prepareCreate(body).problem()).isEqualTo("Department code is required");
        body.put("code", "C".repeat(31));
        assertThat(DepartmentRules.prepareCreate(body).problem()).isEqualTo("Department code is too long");
        body.put("code", " CARD ");
        body.put("description", "D".repeat(4001));
        assertThat(DepartmentRules.prepareCreate(body).problem()).isEqualTo("Description is too long");
        body.put("description", "  Heart  ");
        body.put("displayOrder", -1);
        assertThat(DepartmentRules.prepareCreate(body).problem()).isEqualTo("Display order is invalid");
        body.put("displayOrder", 1.5);
        assertThat(DepartmentRules.prepareCreate(body).problem()).isEqualTo("Display order is invalid");
        body.put("isActive", "yes");
        body.put("displayOrder", 2);
        assertThat(DepartmentRules.prepareCreate(body).problem()).isEqualTo("Active flag is not recognised");
    }

    @Test
    void aValidDepartmentTrimsTextAndDefaultsTheFlags() {
        ObjectNode body = json.createObjectNode();
        body.put("name", " Cardiology ");
        body.put("code", " CARD ");
        body.put("description", "  ");
        DepartmentRules.Prepared prepared = DepartmentRules.prepareCreate(body);
        assertThat(prepared.problem()).isNull();
        assertThat(prepared.values().name()).isEqualTo("Cardiology");
        assertThat(prepared.values().code()).isEqualTo("CARD");
        assertThat(prepared.values().description()).isNull();
        assertThat(prepared.values().active()).isTrue();
        assertThat(prepared.values().displayOrder()).isZero();
        assertThat(prepared.values().parentId()).isNull();
        assertThat(DepartmentRules.codeKey(prepared.values().code())).isEqualTo("card");
    }

    @Test
    void updateKeepsOmittedFieldsAndClearsANullParent() {
        UUID parent = UUID.randomUUID();
        DepartmentRules.Values current = new DepartmentRules.Values("Cardiology", "CARD", "Heart", parent, false, 4);
        DepartmentRules.Prepared kept = DepartmentRules.prepareUpdate(json.createObjectNode(), current);
        assertThat(kept.problem()).isNull();
        assertThat(kept.values()).isEqualTo(current);

        ObjectNode clear = json.createObjectNode();
        clear.putNull("description");
        clear.putNull("parentDepartmentId");
        DepartmentRules.Prepared cleared = DepartmentRules.prepareUpdate(clear, current);
        assertThat(cleared.values().description()).isNull();
        assertThat(cleared.values().parentId()).isNull();
        assertThat(cleared.values().name()).isEqualTo("Cardiology");
        assertThat(cleared.values().active()).isFalse();
        assertThat(cleared.values().displayOrder()).isEqualTo(4);

        ObjectNode badParent = json.createObjectNode();
        badParent.put("parentDepartmentId", "not-a-uuid");
        assertThat(DepartmentRules.prepareUpdate(badParent, current).problem())
                .isEqualTo("Parent department was not found");
    }

    @Test
    void aParentThatIsSelfOrADescendantIsACycle() {
        UUID medicine = UUID.randomUUID();
        UUID cardio = UUID.randomUUID();
        UUID echo = UUID.randomUUID();
        Map<UUID, UUID> parents = new HashMap<>();
        parents.put(medicine, null);
        parents.put(cardio, medicine);
        parents.put(echo, cardio);
        assertThat(DepartmentRules.cycle(cardio, null, parents)).isFalse();
        assertThat(DepartmentRules.cycle(echo, medicine, parents)).isFalse();
        assertThat(DepartmentRules.cycle(cardio, cardio, parents)).isTrue();
        assertThat(DepartmentRules.cycle(medicine, echo, parents)).isTrue();
    }
}
