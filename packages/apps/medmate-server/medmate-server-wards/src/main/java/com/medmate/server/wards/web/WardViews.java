package com.medmate.server.wards.web;

import java.util.List;
import java.util.UUID;

public final class WardViews {

    private WardViews() {}

    public record WardView(
            UUID id,
            String name,
            String code,
            String floor,
            String category,
            int beds,
            String sister,
            String dailyRate,
            int bedsHeld,
            boolean underMaintenance,
            String maintenanceNote) {}

    public record AdmissionView(
            UUID id,
            String name,
            String uhid,
            String phone,
            Integer age,
            String gender,
            UUID wardId,
            String wardName,
            String bed,
            String doctor,
            String diagnosis,
            String payerType,
            String insurer,
            String policyNo,
            String admittedAt,
            String status,
            int days,
            String dailyRate,
            String outstanding) {}

    public record WardList(List<WardView> wards) {}

    public record WardOne(WardView ward) {}

    public record AdmissionList(List<AdmissionView> admissions) {}

    public record AdmissionOne(AdmissionView admission) {}
}
