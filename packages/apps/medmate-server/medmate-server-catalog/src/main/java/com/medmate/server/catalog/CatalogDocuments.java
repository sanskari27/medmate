package com.medmate.server.catalog;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.util.List;

public final class CatalogDocuments {

    private CatalogDocuments() {}

    public record DrugSummary(
            String productId,
            String productName,
            String marketerName,
            String medicineType,
            String productForm,
            BigDecimal mrp,
            boolean prescriptionRequired,
            @JsonProperty("package") String packageName,
            BigDecimal qtyAmount,
            String qtyUnit) {}

    public record FmcgSummary(
            String productId,
            String productName,
            String marketerName,
            String marketingCompany,
            String type,
            String productForm,
            BigDecimal mrp,
            @JsonProperty("package") String packageName,
            BigDecimal qtyAmount,
            String qtyUnit) {}

    public record DrugIngredient(String name, String strength, BigDecimal amount, String unit) {}

    public record DrugSafety(String topic, String level, String detail) {}

    public record DrugFact(String label, String value) {}

    public record DrugQuestion(String question, String answer) {}

    public record DrugInteraction(
            String drug, String route, String severity, String otherProduct, String interactsWith, String detail) {}

    public record DrugDetail(
            String productId,
            String productName,
            String marketerName,
            String marketerAddress,
            String medicineType,
            String introduction,
            String benefits,
            String howToUse,
            String ifMiss,
            String packagingDetail,
            @JsonProperty("package") String packageName,
            BigDecimal qtyAmount,
            String qtyUnit,
            String qtyRaw,
            String productForm,
            BigDecimal mrp,
            boolean prescriptionRequired,
            String storage,
            String howItWorks,
            String countryOfOrigin,
            String sourceFile,
            List<DrugIngredient> ingredients,
            List<DrugSafety> safety,
            List<DrugFact> facts,
            List<String> uses,
            List<String> sideEffects,
            List<DrugQuestion> questions,
            List<DrugInteraction> interactions,
            List<String> images) {}

    public record FmcgDetail(
            String productId,
            String productName,
            String marketingCompany,
            String type,
            String packaging,
            @JsonProperty("package") String packageName,
            BigDecimal qtyAmount,
            String qtyUnit,
            String qtyRaw,
            String productForm,
            BigDecimal mrp,
            String information,
            String directionsForUse,
            String countryOfOrigin,
            String marketerName,
            String marketerAddress,
            String sourceFile,
            List<String> categories,
            List<String> highlights,
            List<String> ingredients,
            List<String> benefits,
            List<String> safety,
            List<String> images) {}

    public record SearchResponse(List<DrugSummary> drug, List<FmcgSummary> fmcg) {}

    public record Products(List<DrugDetail> drug, List<FmcgDetail> fmcg) {}

    public record ProductPage(List<DrugDetail> drug, List<FmcgDetail> fmcg, List<String> missing) {}
}
