package com.medmate.server.doctors.web;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public final class DoctorViews {

    private DoctorViews() {}

    public record FileLink(String fileName, String contentType, String url) {}

    public record DocumentLink(
            UUID id, String documentType, String fileName, String contentType, String verificationStatus, String url) {}

    public record WindowLink(String type, List<String> days, String start, String end, String fee) {}

    public record DepartmentLink(UUID id, String name, String code, @JsonProperty("isActive") boolean active) {}

    public record DoctorView(
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
            FileLink photo,
            List<WindowLink> windows,
            List<DocumentLink> documents,
            DepartmentLink department) {}

    public record ListResponse(List<DoctorView> doctors) {}

    public record OneResponse(DoctorView doctor) {}

    public record StoredFile(String contentType, byte[] body) {}

    public static String fee(BigDecimal amount) {
        return amount == null ? "0.00" : amount.setScale(2).toPlainString();
    }
}
