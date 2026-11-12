package com.medmate.server.identity.pharmacy;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;

class PharmacyRulesTest {

    @Test
    void acceptsACompleteApplication() {
        assertThat(PharmacyRules.invalid(sample(), "+919876543210")).isNull();
    }

    @Test
    void rejectsAnInvalidGstinADisabledAlertAndAChangedPhone() {
        PharmacyRules.ApplicationInput gstin =
                copy(sample(), "bad", sample().lowStockAlerts(), sample().submittedPhone());
        assertThat(PharmacyRules.invalid(gstin, "+919876543210")).isEqualTo("Enter a valid GSTIN");

        PharmacyRules.ApplicationInput alerts = copy(sample(), sample().gstin(), false, sample().submittedPhone());
        assertThat(PharmacyRules.invalid(alerts, "+919876543210")).isEqualTo("Low-stock alerts stay on");

        PharmacyRules.ApplicationInput phone = copy(sample(), sample().gstin(), null, "9123456789");
        assertThat(PharmacyRules.invalid(phone, "+919876543210")).isEqualTo("Phone number cannot be changed");
    }

    @Test
    void rejectsAMissingOrUnknownPharmacyType() {
        assertThat(PharmacyRules.invalid(typed(sample(), null), "+919876543210"))
                .isEqualTo("Pharmacy type is required");
        assertThat(PharmacyRules.invalid(typed(sample(), "clinic"), "+919876543210"))
                .isEqualTo("Pharmacy type is required");
        assertThat(PharmacyRules.invalid(typed(sample(), "hospital"), "+919876543210"))
                .isNull();
    }

    @Test
    void aSafeProfileChangeDoesNotNeedReviewAndALicenceChangeDoes() {
        PharmacyRules.ProfileInput safe = profile();
        assertThat(PharmacyRules.needsReview(stored(), safe)).isFalse();
        assertThat(PharmacyRules.profileInvalid(safe, "+919876543210", storedSlots(), preserved()))
                .isNull();
        assertThat(PharmacyRules.profileInvalid(
                        safe,
                        "+919876543210",
                        storedSlots(),
                        new PharmacyRules.Preserved(null, "CARE", true, false, true)))
                .isNull();

        PharmacyRules.ProfileInput gstin = profileWithGstin("");
        assertThat(PharmacyRules.profileInvalid(gstin, "+919876543210", storedSlots(), preserved()))
                .isEqualTo("Enter a valid GSTIN");

        PharmacyRules.ProfileInput licence = profileWithGstin("29ABCDE1234F2Z5");
        assertThat(PharmacyRules.needsReview(stored(), licence)).isTrue();

        PharmacyRules.ProfileInput pharmacist = profileWithPharmacist("Other Rao");
        assertThat(PharmacyRules.needsReview(stored(), pharmacist)).isTrue();

        PharmacyRules.Upload image = new PharmacyRules.Upload("image/png", new byte[] {9});
        assertThat(PharmacyRules.needsReview(stored(), profileWithSignature(image)))
                .isFalse();
        assertThat(PharmacyRules.needsReview(stored(), profileWithLogo(image))).isFalse();
        assertThat(PharmacyRules.needsReview(stored(), profileWithGstin("29abcde1234f1z5")))
                .isFalse();
    }

    @Test
    void acceptsInvoiceSettingsAndRejectsABadTemplateAccentTitleOrMissingSignature() {
        assertThat(PharmacyRules.invoiceInvalid(invoice(), true)).isNull();
        assertThat(PharmacyRules.invoiceInvalid(invoiceWithTemplate("slip"), true))
                .isEqualTo("Invoice template is not recognised");
        assertThat(PharmacyRules.invoiceInvalid(invoiceWithAccent("green"), true))
                .isEqualTo("Accent colour is not valid");
        assertThat(PharmacyRules.invoiceInvalid(invoiceWithTitle("T".repeat(81)), true))
                .isEqualTo("Document title is too long");
        assertThat(PharmacyRules.invoiceInvalid(invoice(), false)).isEqualTo("Signature is required");
    }

    @Test
    void acceptsAStoredDocumentInPlaceOfANewFile() {
        PharmacyRules.ApplicationInput missing = withoutGst(sample());
        assertThat(PharmacyRules.invalid(missing, "+919876543210", Set.of())).isEqualTo("GST certificate is required");
        assertThat(PharmacyRules.invalid(missing, "+919876543210", Set.of("gst")))
                .isNull();
    }

    private static PharmacyRules.StoredLicences stored() {
        return new PharmacyRules.StoredLicences(
                "29ABCDE1234F1Z5", "ABCDE1234F", "DL-1", "FSSAI-1", "TL-1", "Asha Rao, B.Pharm (Reg. No. 12)");
    }

    private static Set<String> storedSlots() {
        return Set.of("gst", "pan", "drug-licence", "fssai", "trade-licence", "pharmacist-certificate", "signature");
    }

    private static PharmacyRules.Preserved preserved() {
        return new PharmacyRules.Preserved("pharmacy", "CARE", true, false, true);
    }

    private static PharmacyRules.ProfileInput profile() {
        return new PharmacyRules.ProfileInput(
                "Care Pharmacy",
                "Open early",
                "owner@example.com",
                "12 Market Road",
                "Bengaluru",
                "Karnataka",
                "560001",
                List.of("Retail Pharmacy"),
                "Pharmacy & Healthcare",
                "Proprietorship",
                "29ABCDE1234F1Z5",
                null,
                "ABCDE1234F",
                null,
                "DL-1",
                null,
                "FSSAI-1",
                null,
                "TL-1",
                null,
                false,
                false,
                true,
                "Asha Rao, B.Pharm (Reg. No. 12)",
                null,
                null,
                "Goods once sold",
                null,
                null,
                List.of());
    }

    private static PharmacyRules.ProfileInput profileWithGstin(String gstin) {
        PharmacyRules.ProfileInput input = profile();
        return new PharmacyRules.ProfileInput(
                input.name(),
                input.tagline(),
                input.email(),
                input.address(),
                input.city(),
                input.state(),
                input.pincode(),
                input.businessTypes(),
                input.industry(),
                input.registrationType(),
                gstin,
                input.gst(),
                input.pan(),
                input.panCard(),
                input.drugLicenceNo(),
                input.drugLicence(),
                input.fssaiNo(),
                input.fssai(),
                input.tradeLicenceNo(),
                input.tradeLicence(),
                input.enableTds(),
                input.enableTcs(),
                input.eInvoicing(),
                input.pharmacistName(),
                input.pharmacistCertificate(),
                input.signature(),
                input.terms(),
                input.logo(),
                input.submittedPhone(),
                input.extraDetails());
    }

    private static PharmacyRules.ProfileInput profileWithPharmacist(String name) {
        PharmacyRules.ProfileInput input = profile();
        return new PharmacyRules.ProfileInput(
                input.name(),
                input.tagline(),
                input.email(),
                input.address(),
                input.city(),
                input.state(),
                input.pincode(),
                input.businessTypes(),
                input.industry(),
                input.registrationType(),
                input.gstin(),
                input.gst(),
                input.pan(),
                input.panCard(),
                input.drugLicenceNo(),
                input.drugLicence(),
                input.fssaiNo(),
                input.fssai(),
                input.tradeLicenceNo(),
                input.tradeLicence(),
                input.enableTds(),
                input.enableTcs(),
                input.eInvoicing(),
                name,
                input.pharmacistCertificate(),
                input.signature(),
                input.terms(),
                input.logo(),
                input.submittedPhone(),
                input.extraDetails());
    }

    private static PharmacyRules.ProfileInput profileWithSignature(PharmacyRules.Upload signature) {
        PharmacyRules.ProfileInput input = profile();
        return new PharmacyRules.ProfileInput(
                input.name(),
                input.tagline(),
                input.email(),
                input.address(),
                input.city(),
                input.state(),
                input.pincode(),
                input.businessTypes(),
                input.industry(),
                input.registrationType(),
                input.gstin(),
                input.gst(),
                input.pan(),
                input.panCard(),
                input.drugLicenceNo(),
                input.drugLicence(),
                input.fssaiNo(),
                input.fssai(),
                input.tradeLicenceNo(),
                input.tradeLicence(),
                input.enableTds(),
                input.enableTcs(),
                input.eInvoicing(),
                input.pharmacistName(),
                input.pharmacistCertificate(),
                signature,
                input.terms(),
                input.logo(),
                input.submittedPhone(),
                input.extraDetails());
    }

    private static PharmacyRules.ProfileInput profileWithLogo(PharmacyRules.Upload logo) {
        PharmacyRules.ProfileInput input = profile();
        return new PharmacyRules.ProfileInput(
                input.name(),
                input.tagline(),
                input.email(),
                input.address(),
                input.city(),
                input.state(),
                input.pincode(),
                input.businessTypes(),
                input.industry(),
                input.registrationType(),
                input.gstin(),
                input.gst(),
                input.pan(),
                input.panCard(),
                input.drugLicenceNo(),
                input.drugLicence(),
                input.fssaiNo(),
                input.fssai(),
                input.tradeLicenceNo(),
                input.tradeLicence(),
                input.enableTds(),
                input.enableTcs(),
                input.eInvoicing(),
                input.pharmacistName(),
                input.pharmacistCertificate(),
                input.signature(),
                input.terms(),
                logo,
                input.submittedPhone(),
                input.extraDetails());
    }

    private static PharmacyRules.ApplicationInput sample() {
        PharmacyRules.Upload image = new PharmacyRules.Upload("image/png", new byte[] {1, 2, 3});
        PharmacyRules.Upload pdf = new PharmacyRules.Upload("application/pdf", new byte[] {1, 2, 3, 4});
        return new PharmacyRules.ApplicationInput(
                "Care Pharmacy",
                "Open late",
                "owner@example.com",
                "12 Market Road",
                "Bengaluru",
                "Karnataka",
                "560001",
                List.of("Retail Pharmacy"),
                "Pharmacy & Healthcare",
                "Proprietorship",
                "pharmacy",
                "29ABCDE1234F1Z5",
                pdf,
                "ABCDE1234F",
                image,
                "DL-1",
                image,
                "FSSAI-1",
                image,
                "TL-1",
                image,
                false,
                false,
                "Asha Rao, B.Pharm (Reg. No. 12)",
                pdf,
                "CARE",
                image,
                "Goods once sold",
                true,
                false,
                false,
                true,
                null,
                image,
                "9876543210");
    }

    private static PharmacyRules.ApplicationInput copy(
            PharmacyRules.ApplicationInput input, String gstin, Boolean lowStockAlerts, String phone) {
        return new PharmacyRules.ApplicationInput(
                input.name(),
                input.tagline(),
                input.email(),
                input.address(),
                input.city(),
                input.state(),
                input.pincode(),
                input.businessTypes(),
                input.industry(),
                input.registrationType(),
                input.pharmacyType(),
                gstin,
                input.gst(),
                input.pan(),
                input.panCard(),
                input.drugLicenceNo(),
                input.drugLicence(),
                input.fssaiNo(),
                input.fssai(),
                input.tradeLicenceNo(),
                input.tradeLicence(),
                input.enableTds(),
                input.enableTcs(),
                input.pharmacistName(),
                input.pharmacistCertificate(),
                input.invoicePrefix(),
                input.signature(),
                input.terms(),
                input.acceptOnlineOrders(),
                input.selfOrderKiosk(),
                input.eInvoicing(),
                input.looseSelling(),
                lowStockAlerts,
                input.logo(),
                phone);
    }

    private static PharmacyRules.ApplicationInput typed(PharmacyRules.ApplicationInput input, String pharmacyType) {
        return new PharmacyRules.ApplicationInput(
                input.name(),
                input.tagline(),
                input.email(),
                input.address(),
                input.city(),
                input.state(),
                input.pincode(),
                input.businessTypes(),
                input.industry(),
                input.registrationType(),
                pharmacyType,
                input.gstin(),
                input.gst(),
                input.pan(),
                input.panCard(),
                input.drugLicenceNo(),
                input.drugLicence(),
                input.fssaiNo(),
                input.fssai(),
                input.tradeLicenceNo(),
                input.tradeLicence(),
                input.enableTds(),
                input.enableTcs(),
                input.pharmacistName(),
                input.pharmacistCertificate(),
                input.invoicePrefix(),
                input.signature(),
                input.terms(),
                input.acceptOnlineOrders(),
                input.selfOrderKiosk(),
                input.eInvoicing(),
                input.looseSelling(),
                input.lowStockAlerts(),
                input.logo(),
                input.submittedPhone());
    }

    private static PharmacyRules.ApplicationInput withoutGst(PharmacyRules.ApplicationInput input) {
        return new PharmacyRules.ApplicationInput(
                input.name(),
                input.tagline(),
                input.email(),
                input.address(),
                input.city(),
                input.state(),
                input.pincode(),
                input.businessTypes(),
                input.industry(),
                input.registrationType(),
                input.pharmacyType(),
                input.gstin(),
                null,
                input.pan(),
                input.panCard(),
                input.drugLicenceNo(),
                input.drugLicence(),
                input.fssaiNo(),
                input.fssai(),
                input.tradeLicenceNo(),
                input.tradeLicence(),
                input.enableTds(),
                input.enableTcs(),
                input.pharmacistName(),
                input.pharmacistCertificate(),
                input.invoicePrefix(),
                input.signature(),
                input.terms(),
                input.acceptOnlineOrders(),
                input.selfOrderKiosk(),
                input.eInvoicing(),
                input.looseSelling(),
                input.lowStockAlerts(),
                input.logo(),
                input.submittedPhone());
    }

    private static PharmacyRules.InvoiceInput invoice() {
        return new PharmacyRules.InvoiceInput(
                "classic",
                "#1B3D29",
                "TAX INVOICE",
                "CARE",
                "Authorised signatory",
                "",
                false,
                "Goods once sold",
                true,
                false,
                null,
                null);
    }

    private static PharmacyRules.InvoiceInput invoiceWithTemplate(String template) {
        PharmacyRules.InvoiceInput input = invoice();
        return new PharmacyRules.InvoiceInput(
                template,
                input.accent(),
                input.title(),
                input.prefix(),
                input.signatory(),
                input.bankLine(),
                input.showBank(),
                input.terms(),
                input.showLogo(),
                input.showStamp(),
                input.logo(),
                input.signature());
    }

    private static PharmacyRules.InvoiceInput invoiceWithAccent(String accent) {
        PharmacyRules.InvoiceInput input = invoice();
        return new PharmacyRules.InvoiceInput(
                input.template(),
                accent,
                input.title(),
                input.prefix(),
                input.signatory(),
                input.bankLine(),
                input.showBank(),
                input.terms(),
                input.showLogo(),
                input.showStamp(),
                input.logo(),
                input.signature());
    }

    private static PharmacyRules.InvoiceInput invoiceWithTitle(String title) {
        PharmacyRules.InvoiceInput input = invoice();
        return new PharmacyRules.InvoiceInput(
                input.template(),
                input.accent(),
                title,
                input.prefix(),
                input.signatory(),
                input.bankLine(),
                input.showBank(),
                input.terms(),
                input.showLogo(),
                input.showStamp(),
                input.logo(),
                input.signature());
    }
}
