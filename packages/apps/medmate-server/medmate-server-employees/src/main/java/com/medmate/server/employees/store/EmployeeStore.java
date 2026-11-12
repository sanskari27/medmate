package com.medmate.server.employees.store;

import com.medmate.server.employees.EmployeeRules;
import java.sql.Date;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
@Profile({"local", "prod", "identity-it"})
public class EmployeeStore {

    private final JdbcClient jdbc;

    public EmployeeStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public record EmployeeRow(
            String code,
            String name,
            String position,
            String department,
            String phone,
            String email,
            String address,
            String dob,
            String joinedOn,
            String employment,
            int salary,
            String status,
            String pan,
            String aadhaar,
            String bankName,
            String accountName,
            String accountNumber,
            String ifsc,
            String upi,
            String emergencyName,
            String emergencyPhone,
            String note,
            String bloodGroup,
            String photoKey,
            String photoContentType,
            String photoFileName) {

        public EmployeeRules.Values values() {
            return new EmployeeRules.Values(
                    name,
                    position,
                    department,
                    phone,
                    email,
                    address,
                    dob,
                    joinedOn,
                    employment,
                    salary,
                    status,
                    pan,
                    aadhaar,
                    bankName,
                    accountName,
                    accountNumber,
                    ifsc,
                    upi,
                    emergencyName,
                    emergencyPhone,
                    note,
                    bloodGroup);
        }
    }

    public record DocumentRow(
            UUID id, String code, String label, String fileName, String contentType, String objectKey) {}

    public boolean lockPharmacy(UUID pharmacyId) {
        return jdbc.sql("SELECT id FROM pharmacy WHERE id = :id FOR UPDATE")
                .param("id", pharmacyId)
                .query(UUID.class)
                .optional()
                .isPresent();
    }

    public List<String> codes(UUID pharmacyId) {
        return jdbc.sql("SELECT code FROM employee WHERE pharmacy_id = :id")
                .param("id", pharmacyId)
                .query(String.class)
                .list();
    }

    public List<EmployeeRow> list(UUID pharmacyId) {
        return jdbc.sql(select() + " WHERE pharmacy_id = :id ORDER BY CAST(SUBSTRING(code FROM 5) AS INTEGER)")
                .param("id", pharmacyId)
                .query(this::employee)
                .list();
    }

    public Optional<EmployeeRow> find(UUID pharmacyId, String code) {
        return jdbc.sql(select() + " WHERE pharmacy_id = :id AND code = :code")
                .param("id", pharmacyId)
                .param("code", code)
                .query(this::employee)
                .optional();
    }

    public List<DocumentRow> documents(UUID pharmacyId) {
        return jdbc.sql(
                        """
                        SELECT id, code, label, file_name, content_type, object_key
                        FROM employee_document
                        WHERE pharmacy_id = :id
                        ORDER BY created_at, id
                        """)
                .param("id", pharmacyId)
                .query(this::document)
                .list();
    }

    public void insert(UUID pharmacyId, String code, EmployeeRules.Values values, Photo photo) {
        bind(
                        jdbc.sql(
                                """
                        INSERT INTO employee (
                          pharmacy_id, code, name, position, department, phone, email, address, dob, joined_on,
                          employment, salary, status, pan, aadhaar, bank_name, account_name, account_number, ifsc, upi,
                          emergency_name, emergency_phone, note, blood_group, photo_key, photo_content_type, photo_file_name)
                        VALUES (
                          :pharmacy, :code, :name, :position, :department, :phone, :email, :address, :dob, :joined,
                          :employment, :salary, :status, :pan, :aadhaar, :bankName, :accountName, :accountNumber, :ifsc, :upi,
                          :emergencyName, :emergencyPhone, :note, :bloodGroup, :photoKey, :photoType, :photoName)
                        """),
                        pharmacyId,
                        code,
                        values,
                        photo)
                .update();
    }

    public void update(UUID pharmacyId, String code, EmployeeRules.Values values, Photo photo) {
        bind(
                        jdbc.sql(
                                """
                        UPDATE employee SET
                          name = :name, position = :position, department = :department, phone = :phone, email = :email,
                          address = :address, dob = :dob, joined_on = :joined, employment = :employment, salary = :salary,
                          status = :status, pan = :pan, aadhaar = :aadhaar, bank_name = :bankName,
                          account_name = :accountName, account_number = :accountNumber, ifsc = :ifsc, upi = :upi,
                          emergency_name = :emergencyName, emergency_phone = :emergencyPhone, note = :note,
                          blood_group = :bloodGroup, photo_key = :photoKey, photo_content_type = :photoType,
                          photo_file_name = :photoName
                        WHERE pharmacy_id = :pharmacy AND code = :code
                        """),
                        pharmacyId,
                        code,
                        values,
                        photo)
                .update();
    }

    public void insertDocument(
            UUID id,
            UUID pharmacyId,
            String code,
            String label,
            String fileName,
            String contentType,
            String objectKey,
            Instant now) {
        jdbc.sql(
                        """
                        INSERT INTO employee_document (
                          id, pharmacy_id, code, label, file_name, content_type, object_key, created_at)
                        VALUES (:id, :pharmacy, :code, :label, :fileName, :contentType, :objectKey, :created)
                        """)
                .param("id", id)
                .param("pharmacy", pharmacyId)
                .param("code", code)
                .param("label", label)
                .param("fileName", fileName)
                .param("contentType", contentType)
                .param("objectKey", objectKey)
                .param("created", Timestamp.from(now))
                .update();
    }

    public Optional<DocumentRow> document(UUID pharmacyId, String code, UUID documentId) {
        return jdbc.sql(
                        """
                        SELECT id, code, label, file_name, content_type, object_key
                        FROM employee_document
                        WHERE pharmacy_id = :pharmacy AND code = :code AND id = :id
                        """)
                .param("pharmacy", pharmacyId)
                .param("code", code)
                .param("id", documentId)
                .query(this::document)
                .optional();
    }

    public record Photo(String key, String contentType, String fileName) {}

    private JdbcClient.StatementSpec bind(
            JdbcClient.StatementSpec spec, UUID pharmacyId, String code, EmployeeRules.Values values, Photo photo) {
        Photo stored = photo == null ? new Photo(null, null, null) : photo;
        return spec.param("pharmacy", pharmacyId)
                .param("code", code)
                .param("name", values.name(), Types.VARCHAR)
                .param("position", values.position(), Types.VARCHAR)
                .param("department", values.department(), Types.VARCHAR)
                .param("phone", values.phone(), Types.VARCHAR)
                .param("email", values.email(), Types.VARCHAR)
                .param("address", values.address(), Types.VARCHAR)
                .param("dob", day(values.dob()), Types.DATE)
                .param("joined", day(values.joinedOn()), Types.DATE)
                .param("employment", values.employment(), Types.VARCHAR)
                .param("salary", values.salary(), Types.INTEGER)
                .param("status", values.status(), Types.VARCHAR)
                .param("pan", values.pan(), Types.VARCHAR)
                .param("aadhaar", values.aadhaar(), Types.VARCHAR)
                .param("bankName", values.bankName(), Types.VARCHAR)
                .param("accountName", values.accountName(), Types.VARCHAR)
                .param("accountNumber", values.accountNumber(), Types.VARCHAR)
                .param("ifsc", values.ifsc(), Types.VARCHAR)
                .param("upi", values.upi(), Types.VARCHAR)
                .param("emergencyName", values.emergencyName(), Types.VARCHAR)
                .param("emergencyPhone", values.emergencyPhone(), Types.VARCHAR)
                .param("note", values.note(), Types.VARCHAR)
                .param("bloodGroup", values.bloodGroup(), Types.VARCHAR)
                .param("photoKey", stored.key(), Types.VARCHAR)
                .param("photoType", stored.contentType(), Types.VARCHAR)
                .param("photoName", stored.fileName(), Types.VARCHAR);
    }

    private static Date day(String value) {
        return value == null ? null : Date.valueOf(value);
    }

    private String select() {
        return """
                SELECT code, name, position, department, phone, email, address, dob, joined_on, employment, salary,
                  status, pan, aadhaar, bank_name, account_name, account_number, ifsc, upi, emergency_name,
                  emergency_phone, note, blood_group, photo_key, photo_content_type, photo_file_name
                FROM employee
                """;
    }

    private EmployeeRow employee(java.sql.ResultSet rs, int row) throws java.sql.SQLException {
        return new EmployeeRow(
                rs.getString("code"),
                rs.getString("name"),
                rs.getString("position"),
                rs.getString("department"),
                rs.getString("phone"),
                rs.getString("email"),
                rs.getString("address"),
                text(rs.getDate("dob")),
                text(rs.getDate("joined_on")),
                rs.getString("employment"),
                rs.getInt("salary"),
                rs.getString("status"),
                rs.getString("pan"),
                rs.getString("aadhaar"),
                rs.getString("bank_name"),
                rs.getString("account_name"),
                rs.getString("account_number"),
                rs.getString("ifsc"),
                rs.getString("upi"),
                rs.getString("emergency_name"),
                rs.getString("emergency_phone"),
                rs.getString("note"),
                rs.getString("blood_group"),
                rs.getString("photo_key"),
                rs.getString("photo_content_type"),
                rs.getString("photo_file_name"));
    }

    private DocumentRow document(java.sql.ResultSet rs, int row) throws java.sql.SQLException {
        return new DocumentRow(
                rs.getObject("id", UUID.class),
                rs.getString("code"),
                rs.getString("label"),
                rs.getString("file_name"),
                rs.getString("content_type"),
                rs.getString("object_key"));
    }

    private static String text(Date date) {
        return date == null ? null : date.toLocalDate().toString();
    }
}
