package com.medmate.server.departments.store;

import com.medmate.server.departments.DepartmentRules;
import java.sql.Types;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
@Profile({"local", "prod", "identity-it"})
public class DepartmentStore {

    private final JdbcClient jdbc;

    public DepartmentStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public record DepartmentRow(
            UUID id, String name, String code, String description, UUID parentId, boolean active, int displayOrder) {}

    public boolean lockPharmacy(UUID pharmacyId) {
        return jdbc.sql("SELECT id FROM pharmacy WHERE id = :id FOR UPDATE")
                .param("id", pharmacyId)
                .query(UUID.class)
                .optional()
                .isPresent();
    }

    public boolean codeTaken(UUID pharmacyId, String codeKey, UUID exceptId) {
        String sql = exceptId == null
                ? "SELECT id FROM department WHERE pharmacy_id = :pharmacy AND code_key = :code"
                : "SELECT id FROM department WHERE pharmacy_id = :pharmacy AND code_key = :code AND id <> :except";
        JdbcClient.StatementSpec spec =
                jdbc.sql(sql).param("pharmacy", pharmacyId).param("code", codeKey);
        if (exceptId != null) {
            spec = spec.param("except", exceptId);
        }
        return spec.query(UUID.class).optional().isPresent();
    }

    public List<DepartmentRow> list(UUID pharmacyId) {
        return jdbc.sql(select() + " WHERE pharmacy_id = :id ORDER BY display_order, lower(name), lower(code), id")
                .param("id", pharmacyId)
                .query(this::department)
                .list();
    }

    public Optional<DepartmentRow> find(UUID pharmacyId, UUID id) {
        return jdbc.sql(select() + " WHERE pharmacy_id = :pharmacy AND id = :id")
                .param("pharmacy", pharmacyId)
                .param("id", id)
                .query(this::department)
                .optional();
    }

    public void insert(UUID id, UUID pharmacyId, DepartmentRules.Values values) {
        bind(
                        jdbc.sql(
                                """
                        INSERT INTO department (
                          id, pharmacy_id, name, code, code_key, description, parent_department_id, is_active,
                          display_order)
                        VALUES (
                          :id, :pharmacy, :name, :code, :codeKey, :description, CAST(:parentId AS uuid), :active,
                          :displayOrder)
                        """),
                        id,
                        pharmacyId,
                        values)
                .update();
    }

    public void update(UUID id, UUID pharmacyId, DepartmentRules.Values values) {
        bind(
                        jdbc.sql(
                                """
                        UPDATE department SET
                          name = :name, code = :code, code_key = :codeKey, description = :description,
                          parent_department_id = CAST(:parentId AS uuid), is_active = :active,
                          display_order = :displayOrder
                        WHERE pharmacy_id = :pharmacy AND id = :id
                        """),
                        id,
                        pharmacyId,
                        values)
                .update();
    }

    private JdbcClient.StatementSpec bind(
            JdbcClient.StatementSpec spec, UUID id, UUID pharmacyId, DepartmentRules.Values values) {
        return spec.param("id", id)
                .param("pharmacy", pharmacyId)
                .param("name", values.name())
                .param("code", values.code())
                .param("codeKey", DepartmentRules.codeKey(values.code()))
                .param("description", values.description(), Types.VARCHAR)
                .param(
                        "parentId",
                        values.parentId() == null ? null : values.parentId().toString(),
                        Types.VARCHAR)
                .param("active", values.active())
                .param("displayOrder", values.displayOrder());
    }

    private String select() {
        return """
                SELECT id, name, code, description, parent_department_id, is_active, display_order
                FROM department
                """;
    }

    private DepartmentRow department(java.sql.ResultSet rs, int row) throws java.sql.SQLException {
        return new DepartmentRow(
                rs.getObject("id", UUID.class),
                rs.getString("name"),
                rs.getString("code"),
                rs.getString("description"),
                rs.getObject("parent_department_id", UUID.class),
                rs.getBoolean("is_active"),
                rs.getInt("display_order"));
    }
}
