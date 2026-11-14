package com.medmate.server.doctors.store;

import com.medmate.server.doctors.DoctorRules;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
@Profile({"local", "prod", "identity-it"})
public class DoctorStore {

    private final JdbcClient jdbc;

    public DoctorStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public record DoctorRow(
            UUID id,
            String code,
            String firstName,
            String lastName,
            String displayName,
            String gender,
            String status,
            String registrationNumber,
            String registrationCouncil,
            String registrationState,
            String qualification,
            String specialization,
            String subSpecialization,
            Integer yearsExperience,
            String primaryMobile,
            String alternateMobile,
            String email,
            String whatsapp,
            String relationshipStatus,
            String notes,
            String workplaceName,
            String workplaceType,
            String address,
            String city,
            String state,
            String pinCode,
            String workplacePhone,
            String photoKey,
            String photoContentType,
            String photoFileName,
            UUID departmentId) {

        public DoctorRules.Values values(List<DoctorRules.Window> windows) {
            return new DoctorRules.Values(
                    code,
                    firstName,
                    lastName,
                    displayName,
                    gender,
                    status,
                    registrationNumber,
                    registrationCouncil,
                    registrationState,
                    qualification,
                    specialization,
                    subSpecialization,
                    yearsExperience,
                    primaryMobile,
                    alternateMobile,
                    email,
                    whatsapp,
                    relationshipStatus,
                    notes,
                    workplaceName,
                    workplaceType,
                    address,
                    city,
                    state,
                    pinCode,
                    workplacePhone,
                    windows,
                    departmentId);
        }
    }

    public record WindowRow(
            UUID doctorId, int position, String type, String days, String start, String end, BigDecimal fee) {}

    public record DocumentRow(
            UUID id,
            UUID doctorId,
            String documentType,
            String fileName,
            String contentType,
            String objectKey,
            String verificationStatus) {}

    public record Photo(String key, String contentType, String fileName) {}

    public boolean lockPharmacy(UUID pharmacyId) {
        return jdbc.sql("SELECT id FROM pharmacy WHERE id = :id FOR UPDATE")
                .param("id", pharmacyId)
                .query(UUID.class)
                .optional()
                .isPresent();
    }

    public boolean codeTaken(UUID pharmacyId, String codeKey, UUID exceptId) {
        String sql = exceptId == null
                ? "SELECT id FROM doctor WHERE pharmacy_id = :pharmacy AND code_key = :code"
                : "SELECT id FROM doctor WHERE pharmacy_id = :pharmacy AND code_key = :code AND id <> :except";
        JdbcClient.StatementSpec spec =
                jdbc.sql(sql).param("pharmacy", pharmacyId).param("code", codeKey);
        if (exceptId != null) {
            spec = spec.param("except", exceptId);
        }
        return spec.query(UUID.class).optional().isPresent();
    }

    public List<DoctorRow> list(UUID pharmacyId) {
        return jdbc.sql(select() + " WHERE pharmacy_id = :id ORDER BY lower(display_name), lower(code)")
                .param("id", pharmacyId)
                .query(this::doctor)
                .list();
    }

    public Optional<DoctorRow> find(UUID pharmacyId, UUID id) {
        return jdbc.sql(select() + " WHERE pharmacy_id = :pharmacy AND id = :id")
                .param("pharmacy", pharmacyId)
                .param("id", id)
                .query(this::doctor)
                .optional();
    }

    public List<WindowRow> windows(UUID pharmacyId) {
        return jdbc.sql(
                        """
                        SELECT w.doctor_id, w.position, w.consultation_type, w.days, w.start_time, w.end_time, w.fee
                        FROM doctor_window w
                        JOIN doctor d ON d.id = w.doctor_id
                        WHERE d.pharmacy_id = :id
                        ORDER BY w.position, w.id
                        """)
                .param("id", pharmacyId)
                .query(this::window)
                .list();
    }

    public List<DocumentRow> documents(UUID pharmacyId) {
        return jdbc.sql(
                        """
                        SELECT doc.id, doc.doctor_id, doc.document_type, doc.file_name, doc.content_type,
                          doc.object_key, doc.verification_status
                        FROM doctor_document doc
                        JOIN doctor d ON d.id = doc.doctor_id
                        WHERE d.pharmacy_id = :id
                        ORDER BY doc.created_at, doc.id
                        """)
                .param("id", pharmacyId)
                .query(this::document)
                .list();
    }

    public void insert(UUID id, UUID pharmacyId, DoctorRules.Values values, Photo photo) {
        bind(
                        jdbc.sql(
                                """
                        INSERT INTO doctor (
                          id, pharmacy_id, code, code_key, first_name, last_name, display_name, gender, status,
                          registration_number, registration_council, registration_state, qualification, specialization,
                          sub_specialization, years_experience, primary_mobile, alternate_mobile, email, whatsapp,
                          relationship_status, notes, workplace_name, workplace_type, address, city, state, pin_code,
                          workplace_phone, photo_key, photo_content_type, photo_file_name, department_id)
                        VALUES (
                          :id, :pharmacy, :code, :codeKey, :firstName, :lastName, :displayName, :gender, :status,
                          :registrationNumber, :registrationCouncil, :registrationState, :qualification, :specialization,
                          :subSpecialization, :yearsExperience, :primaryMobile, :alternateMobile, :email, :whatsapp,
                          :relationshipStatus, :notes, :workplaceName, :workplaceType, :address, :city, :state, :pinCode,
                          :workplacePhone, :photoKey, :photoType, :photoName, CAST(:departmentId AS uuid))
                        """),
                        id,
                        pharmacyId,
                        values,
                        photo)
                .update();
    }

    public void update(UUID id, UUID pharmacyId, DoctorRules.Values values, Photo photo) {
        bind(
                        jdbc.sql(
                                """
                        UPDATE doctor SET
                          code = :code, code_key = :codeKey, first_name = :firstName, last_name = :lastName,
                          display_name = :displayName, gender = :gender, status = :status,
                          registration_number = :registrationNumber, registration_council = :registrationCouncil,
                          registration_state = :registrationState, qualification = :qualification,
                          specialization = :specialization, sub_specialization = :subSpecialization,
                          years_experience = :yearsExperience, primary_mobile = :primaryMobile,
                          alternate_mobile = :alternateMobile, email = :email, whatsapp = :whatsapp,
                          relationship_status = :relationshipStatus, notes = :notes, workplace_name = :workplaceName,
                          workplace_type = :workplaceType, address = :address, city = :city, state = :state,
                          pin_code = :pinCode, workplace_phone = :workplacePhone, photo_key = :photoKey,
                          photo_content_type = :photoType, photo_file_name = :photoName,
                          department_id = CAST(:departmentId AS uuid)
                        WHERE pharmacy_id = :pharmacy AND id = :id
                        """),
                        id,
                        pharmacyId,
                        values,
                        photo)
                .update();
    }

    public void replaceWindows(UUID doctorId, List<DoctorRules.Window> windows) {
        jdbc.sql("DELETE FROM doctor_window WHERE doctor_id = :id")
                .param("id", doctorId)
                .update();
        int position = 0;
        for (DoctorRules.Window window : windows) {
            jdbc.sql(
                            """
                            INSERT INTO doctor_window (
                              id, doctor_id, position, consultation_type, days, start_time, end_time, fee)
                            VALUES (:id, :doctor, :position, :type, :days, :start, :end, :fee)
                            """)
                    .param("id", UUID.randomUUID())
                    .param("doctor", doctorId)
                    .param("position", position)
                    .param("type", window.type())
                    .param("days", String.join(",", window.days()))
                    .param("start", window.start())
                    .param("end", window.end())
                    .param("fee", window.fee())
                    .update();
            position++;
        }
    }

    public void insertDocument(
            UUID id,
            UUID doctorId,
            String documentType,
            String fileName,
            String contentType,
            String objectKey,
            String verificationStatus,
            Instant now) {
        jdbc.sql(
                        """
                        INSERT INTO doctor_document (
                          id, doctor_id, document_type, file_name, content_type, object_key, verification_status, created_at)
                        VALUES (
                          :id, :doctor, :documentType, :fileName, :contentType, :objectKey, :status, :created)
                        """)
                .param("id", id)
                .param("doctor", doctorId)
                .param("documentType", documentType)
                .param("fileName", fileName)
                .param("contentType", contentType)
                .param("objectKey", objectKey)
                .param("status", verificationStatus)
                .param("created", Timestamp.from(now))
                .update();
    }

    public boolean updateDocumentStatus(UUID doctorId, UUID documentId, String status) {
        return jdbc.sql(
                                """
                        UPDATE doctor_document SET verification_status = :status
                        WHERE doctor_id = :doctor AND id = :id
                        """)
                        .param("status", status)
                        .param("doctor", doctorId)
                        .param("id", documentId)
                        .update()
                > 0;
    }

    public Optional<DocumentRow> document(UUID pharmacyId, UUID doctorId, UUID documentId) {
        return jdbc.sql(
                        """
                        SELECT doc.id, doc.doctor_id, doc.document_type, doc.file_name, doc.content_type,
                          doc.object_key, doc.verification_status
                        FROM doctor_document doc
                        JOIN doctor d ON d.id = doc.doctor_id
                        WHERE d.pharmacy_id = :pharmacy AND doc.doctor_id = :doctor AND doc.id = :id
                        """)
                .param("pharmacy", pharmacyId)
                .param("doctor", doctorId)
                .param("id", documentId)
                .query(this::document)
                .optional();
    }

    private JdbcClient.StatementSpec bind(
            JdbcClient.StatementSpec spec, UUID id, UUID pharmacyId, DoctorRules.Values values, Photo photo) {
        Photo stored = photo == null ? new Photo(null, null, null) : photo;
        return spec.param("id", id)
                .param("pharmacy", pharmacyId)
                .param("code", values.code())
                .param("codeKey", DoctorRules.codeKey(values.code()))
                .param("firstName", values.firstName())
                .param("lastName", values.lastName())
                .param("displayName", values.displayName())
                .param("gender", values.gender())
                .param("status", values.status())
                .param("registrationNumber", values.registrationNumber())
                .param("registrationCouncil", values.registrationCouncil(), Types.VARCHAR)
                .param("registrationState", values.registrationState(), Types.VARCHAR)
                .param("qualification", values.qualification())
                .param("specialization", values.specialization())
                .param("subSpecialization", values.subSpecialization(), Types.VARCHAR)
                .param("yearsExperience", values.yearsExperience(), Types.INTEGER)
                .param("primaryMobile", values.primaryMobile())
                .param("alternateMobile", values.alternateMobile(), Types.VARCHAR)
                .param("email", values.email(), Types.VARCHAR)
                .param("whatsapp", values.whatsapp(), Types.VARCHAR)
                .param("relationshipStatus", values.relationshipStatus(), Types.VARCHAR)
                .param("notes", values.notes(), Types.VARCHAR)
                .param("workplaceName", values.workplaceName())
                .param("workplaceType", values.workplaceType(), Types.VARCHAR)
                .param("address", values.address(), Types.VARCHAR)
                .param("city", values.city())
                .param("state", values.state())
                .param("pinCode", values.pinCode())
                .param("workplacePhone", values.workplacePhone(), Types.VARCHAR)
                .param("photoKey", stored.key(), Types.VARCHAR)
                .param("photoType", stored.contentType(), Types.VARCHAR)
                .param("photoName", stored.fileName(), Types.VARCHAR)
                .param(
                        "departmentId",
                        values.departmentId() == null
                                ? null
                                : values.departmentId().toString(),
                        Types.VARCHAR);
    }

    private String select() {
        return """
                SELECT id, code, first_name, last_name, display_name, gender, status, registration_number,
                  registration_council, registration_state, qualification, specialization, sub_specialization,
                  years_experience, primary_mobile, alternate_mobile, email, whatsapp, relationship_status, notes,
                  workplace_name, workplace_type, address, city, state, pin_code, workplace_phone, photo_key,
                  photo_content_type, photo_file_name, department_id
                FROM doctor
                """;
    }

    private DoctorRow doctor(java.sql.ResultSet rs, int row) throws java.sql.SQLException {
        int yearsValue = rs.getInt("years_experience");
        Integer years = rs.wasNull() ? null : yearsValue;
        return new DoctorRow(
                rs.getObject("id", UUID.class),
                rs.getString("code"),
                rs.getString("first_name"),
                rs.getString("last_name"),
                rs.getString("display_name"),
                rs.getString("gender"),
                rs.getString("status"),
                rs.getString("registration_number"),
                rs.getString("registration_council"),
                rs.getString("registration_state"),
                rs.getString("qualification"),
                rs.getString("specialization"),
                rs.getString("sub_specialization"),
                years,
                rs.getString("primary_mobile"),
                rs.getString("alternate_mobile"),
                rs.getString("email"),
                rs.getString("whatsapp"),
                rs.getString("relationship_status"),
                rs.getString("notes"),
                rs.getString("workplace_name"),
                rs.getString("workplace_type"),
                rs.getString("address"),
                rs.getString("city"),
                rs.getString("state"),
                rs.getString("pin_code"),
                rs.getString("workplace_phone"),
                rs.getString("photo_key"),
                rs.getString("photo_content_type"),
                rs.getString("photo_file_name"),
                rs.getObject("department_id", UUID.class));
    }

    private WindowRow window(java.sql.ResultSet rs, int row) throws java.sql.SQLException {
        return new WindowRow(
                rs.getObject("doctor_id", UUID.class),
                rs.getInt("position"),
                rs.getString("consultation_type"),
                rs.getString("days"),
                rs.getString("start_time"),
                rs.getString("end_time"),
                rs.getBigDecimal("fee"));
    }

    private DocumentRow document(java.sql.ResultSet rs, int row) throws java.sql.SQLException {
        return new DocumentRow(
                rs.getObject("id", UUID.class),
                rs.getObject("doctor_id", UUID.class),
                rs.getString("document_type"),
                rs.getString("file_name"),
                rs.getString("content_type"),
                rs.getString("object_key"),
                rs.getString("verification_status"));
    }

    public static List<String> splitDays(String days) {
        if (days == null || days.isBlank()) {
            return List.of();
        }
        return Arrays.stream(days.split(",")).filter(day -> !day.isBlank()).toList();
    }

    public static List<DoctorRules.Window> toWindows(List<WindowRow> rows) {
        List<DoctorRules.Window> windows = new ArrayList<>();
        for (WindowRow row : rows) {
            windows.add(new DoctorRules.Window(row.type(), splitDays(row.days()), row.start(), row.end(), row.fee()));
        }
        return List.copyOf(windows);
    }
}
