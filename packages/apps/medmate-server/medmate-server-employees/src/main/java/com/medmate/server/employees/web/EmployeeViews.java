package com.medmate.server.employees.web;

import java.util.List;
import java.util.UUID;

public final class EmployeeViews {

    private EmployeeViews() {}

    public record Workplace(
            String name, String tagline, String address, String city, String state, String phone, String logoUrl) {}

    public record FileLink(String fileName, String contentType, String url) {}

    public record DocumentLink(UUID id, String label, String fileName, String contentType, String url) {}

    public record EmployeeView(
            String id,
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
            FileLink photo,
            List<DocumentLink> documents) {}

    public record ListResponse(Workplace workplace, List<EmployeeView> employees) {}

    public record OneResponse(Workplace workplace, EmployeeView employee) {}

    public record StoredFile(String contentType, byte[] body) {}
}
