package com.medmate.server.distributors.web;

import java.time.Instant;
import java.util.List;

public final class DistributorViews {

    private DistributorViews() {}

    public record TransactionView(
            String id, String type, int amount, String reference, String note, String mode, Instant recordedAt) {}

    public record DistributorView(
            String id,
            String name,
            String contactPerson,
            String phone,
            String email,
            String gstin,
            String drugLicenceNumber,
            String address,
            String city,
            String state,
            String paymentTerms,
            int openingBalance,
            int outstanding,
            boolean active,
            boolean showInPurchases,
            List<TransactionView> transactions) {}

    public record DistributorCard(
            String id,
            String name,
            String contactPerson,
            String phone,
            String email,
            String gstin,
            String drugLicenceNumber,
            String address,
            String city,
            String state,
            String paymentTerms,
            int openingBalance,
            int outstanding,
            boolean active,
            boolean showInPurchases) {}

    public record ListResponse(List<DistributorCard> distributors) {}

    public record PaymentList(
            List<TransactionView> payments,
            int page,
            int size,
            int total,
            int purchaseTotal,
            int paymentTotal,
            int returnTotal) {}

    public record OneResponse(DistributorView distributor) {}
}
