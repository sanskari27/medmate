package com.medmate.server.departments.web;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.UUID;

public final class DepartmentViews {

    private DepartmentViews() {}

    public record Parent(UUID id, String name, String code) {}

    public record DepartmentView(
            UUID id,
            String name,
            String code,
            String description,
            @JsonProperty("isActive") boolean active,
            int displayOrder,
            Parent parent) {}

    public record ListResponse(List<DepartmentView> departments) {}

    public record OneResponse(DepartmentView department) {}
}
