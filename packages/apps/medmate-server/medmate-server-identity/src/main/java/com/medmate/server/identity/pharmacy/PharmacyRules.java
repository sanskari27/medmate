package com.medmate.server.identity.pharmacy;

import com.medmate.server.identity.phone.PhoneNumbers;
import java.util.List;
import java.util.Locale;
import java.util.Set;

public final class PharmacyRules {

    public static final int DOCUMENT_MAX = 5 * 1024 * 1024;
    public static final int IMAGE_MAX = 2 * 1024 * 1024;

    public static final Set<String> BUSINESS_TYPES = Set.of(
            "Retail Pharmacy",
            "Wholesale / Distribution",
            "Hospital Pharmacy",
            "Online Pharmacy",
            "Ayurvedic / Generic",
            "Surgicals & Equipment");

    public static final Set<String> REGISTRATION_TYPES = Set.of(
            "Proprietorship",
            "Partnership",
            "Private Limited Company",
            "LLP",
            "HUF",
            "Public Limited Company",
            "Not Registered");

    public static final Set<String> INDUSTRIES =
            Set.of("Pharmacy & Healthcare", "Retail", "Wholesale", "Hospital / Clinic", "Diagnostics");

    public static final Set<String> PHARMACY_TYPES = Set.of("pharmacy", "hospital");

    public static final Set<String> REGIONS = Set.of(
            "Andhra Pradesh",
            "Arunachal Pradesh",
            "Assam",
            "Bihar",
            "Chhattisgarh",
            "Goa",
            "Gujarat",
            "Haryana",
            "Himachal Pradesh",
            "Jharkhand",
            "Karnataka",
            "Kerala",
            "Madhya Pradesh",
            "Maharashtra",
            "Manipur",
            "Meghalaya",
            "Mizoram",
            "Nagaland",
            "Odisha",
            "Punjab",
            "Rajasthan",
            "Sikkim",
            "Tamil Nadu",
            "Telangana",
            "Tripura",
            "Uttar Pradesh",
            "Uttarakhand",
            "West Bengal",
            "Andaman and Nicobar Islands",
            "Chandigarh",
            "Dadra and Nagar Haveli and Daman and Diu",
            "Delhi",
            "Jammu and Kashmir",
            "Ladakh",
            "Lakshadweep",
            "Puducherry");

    private static final Set<String> DOCUMENTS = Set.of("image/jpeg", "image/png", "image/webp", "application/pdf");
    private static final Set<String> IMAGES = Set.of("image/jpeg", "image/png", "image/webp");

    private PharmacyRules() {}

    public record Upload(String contentType, byte[] body) {}

    public record ApplicationInput(
            String name,
            String tagline,
            String email,
            String address,
            String city,
            String state,
            String pincode,
            List<String> businessTypes,
            String industry,
            String registrationType,
            String pharmacyType,
            String gstin,
            Upload gst,
            String pan,
            Upload panCard,
            String drugLicenceNo,
            Upload drugLicence,
            String fssaiNo,
            Upload fssai,
            String tradeLicenceNo,
            Upload tradeLicence,
            Boolean enableTds,
            Boolean enableTcs,
            String pharmacistName,
            Upload pharmacistCertificate,
            String invoicePrefix,
            Upload signature,
            String terms,
            Boolean acceptOnlineOrders,
            Boolean selfOrderKiosk,
            Boolean eInvoicing,
            Boolean looseSelling,
            Boolean lowStockAlerts,
            Upload logo,
            String submittedPhone) {}

    public static String invalid(ApplicationInput input, String accountPhone) {
        return invalid(input, accountPhone, Set.of());
    }

    public static String invalid(ApplicationInput input, String accountPhone, Set<String> storedSlots) {
        Set<String> stored = storedSlots == null ? Set.of() : storedSlots;
        if (input.submittedPhone() != null && !input.submittedPhone().isBlank()) {
            String normalized = PhoneNumbers.normalize(input.submittedPhone());
            if (normalized == null || !normalized.equals(accountPhone)) {
                return "Phone number cannot be changed";
            }
        }
        if (blank(input.name()) || input.name().trim().length() > 160) {
            return "Pharmacy name is required";
        }
        if (input.tagline() != null && input.tagline().trim().length() > 160) {
            return "Tagline is too long";
        }
        if (input.registrationType() == null || !REGISTRATION_TYPES.contains(input.registrationType())) {
            return "Registration type is required";
        }
        if (input.pharmacyType() == null || !PHARMACY_TYPES.contains(input.pharmacyType())) {
            return "Pharmacy type is required";
        }
        if (input.industry() == null || !INDUSTRIES.contains(input.industry())) {
            return "Industry is required";
        }
        if (blank(input.email())
                || input.email().trim().length() > 160
                || !input.email().trim().matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
            return "Email is required";
        }
        if (blank(input.address()) || input.address().trim().length() > 300) {
            return "Billing address is required";
        }
        if (blank(input.city()) || input.city().trim().length() > 80) {
            return "City is required";
        }
        if (input.state() == null || !REGIONS.contains(input.state())) {
            return "State is required";
        }
        if (input.pincode() == null || !input.pincode().trim().matches("^[1-9][0-9]{5}$")) {
            return "Pincode is required";
        }
        if (input.businessTypes() != null) {
            for (String type : input.businessTypes()) {
                if (!BUSINESS_TYPES.contains(type)) {
                    return "Business type is not recognised";
                }
            }
        }
        if (input.gstin() == null
                || !input.gstin()
                        .trim()
                        .toUpperCase(Locale.ROOT)
                        .matches("^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$")) {
            return "Enter a valid GSTIN";
        }
        String gstFile = file(input.gst(), "GST certificate", true, false, stored.contains("gst"));
        if (gstFile != null) {
            return gstFile;
        }
        if (input.pan() == null || !input.pan().trim().toUpperCase(Locale.ROOT).matches("^[A-Z]{5}[0-9]{4}[A-Z]$")) {
            return "PAN number is required";
        }
        String panFile = file(input.panCard(), "PAN card", true, false, stored.contains("pan"));
        if (panFile != null) {
            return panFile;
        }
        String drug =
                licence(input.drugLicenceNo(), input.drugLicence(), "Drug licence", stored.contains("drug-licence"));
        if (drug != null) {
            return drug;
        }
        String fssai = licence(input.fssaiNo(), input.fssai(), "FSSAI licence", stored.contains("fssai"));
        if (fssai != null) {
            return fssai;
        }
        String trade = licence(
                input.tradeLicenceNo(), input.tradeLicence(), "Trade licence", stored.contains("trade-licence"));
        if (trade != null) {
            return trade;
        }
        if (blank(input.pharmacistName()) || input.pharmacistName().trim().length() > 160) {
            return "Registered pharmacist name is required";
        }
        String certificate = file(
                input.pharmacistCertificate(),
                "Pharmacist certificate",
                true,
                false,
                stored.contains("pharmacist-certificate"));
        if (certificate != null) {
            return certificate;
        }
        if (input.invoicePrefix() == null || !input.invoicePrefix().trim().matches("^[A-Za-z0-9-]{1,16}$")) {
            return "Invoice prefix is required";
        }
        String signature = file(input.signature(), "Signature", true, true, stored.contains("signature"));
        if (signature != null) {
            return signature;
        }
        if (input.terms() != null && input.terms().trim().length() > 4000) {
            return "Terms are too long";
        }
        if (Boolean.FALSE.equals(input.lowStockAlerts())) {
            return "Low-stock alerts stay on";
        }
        return file(input.logo(), "Logo", false, true, stored.contains("logo"));
    }

    private static String licence(String number, Upload upload, String label, boolean stored) {
        if (blank(number) || number.trim().length() > 40) {
            return label + " number is required";
        }
        return file(upload, label, true, false, stored);
    }

    private static String file(Upload upload, String label, boolean required, boolean imageOnly, boolean stored) {
        if (upload == null || upload.body() == null || upload.body().length == 0) {
            return required && !stored ? label + " is required" : null;
        }
        if (!allowed(upload.contentType(), imageOnly)) {
            return imageOnly ? label + " must be an image" : label + " must be an image or PDF";
        }
        int max = imageOnly ? IMAGE_MAX : DOCUMENT_MAX;
        if (upload.body().length > max) {
            return label + " is too large";
        }
        return null;
    }

    public static String media(String contentType) {
        if (contentType == null) {
            return "";
        }
        String base = contentType.split(";", 2)[0].trim().toLowerCase(Locale.ROOT);
        if ("image/jpg".equals(base)) {
            return "image/jpeg";
        }
        return base;
    }

    private static boolean allowed(String contentType, boolean imageOnly) {
        return (imageOnly ? IMAGES : DOCUMENTS).contains(media(contentType));
    }

    private static boolean blank(String value) {
        return value == null || value.isBlank();
    }
}
