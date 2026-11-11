package com.medmate.server.identity.pharmacy;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
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
}
