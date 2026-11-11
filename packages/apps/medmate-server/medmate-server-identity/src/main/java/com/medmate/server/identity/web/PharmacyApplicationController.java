package com.medmate.server.identity.web;

import com.medmate.server.identity.pharmacy.PharmacyRules;
import java.util.ArrayList;
import java.util.List;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@Profile({"local", "prod", "identity-it"})
public class PharmacyApplicationController {

    private final PharmacyApplicationService applications;

    public PharmacyApplicationController(PharmacyApplicationService applications) {
        this.applications = applications;
    }

    @PostMapping(value = "/pharmacy/application", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.OK)
    public PharmacyApplicationService.VerificationResponse submit(
            Authentication authentication,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String tagline,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String address,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String pincode,
            @RequestParam(required = false) List<String> businessTypes,
            @RequestParam(required = false) String industry,
            @RequestParam(required = false) String registrationType,
            @RequestParam(required = false) String gstin,
            @RequestParam(required = false) String pan,
            @RequestParam(required = false) String drugLicenceNo,
            @RequestParam(required = false) String fssaiNo,
            @RequestParam(required = false) String tradeLicenceNo,
            @RequestParam(required = false) Boolean enableTds,
            @RequestParam(required = false) Boolean enableTcs,
            @RequestParam(required = false) String pharmacistName,
            @RequestParam(required = false) String invoicePrefix,
            @RequestParam(required = false) String terms,
            @RequestParam(required = false) Boolean acceptOnlineOrders,
            @RequestParam(required = false) Boolean selfOrderKiosk,
            @RequestParam(required = false) Boolean eInvoicing,
            @RequestParam(required = false) Boolean looseSelling,
            @RequestParam(required = false) Boolean lowStockAlerts,
            @RequestParam(required = false) String phone,
            @RequestPart(required = false) MultipartFile logo,
            @RequestPart(required = false) MultipartFile gstCertificate,
            @RequestPart(required = false) MultipartFile panCard,
            @RequestPart(required = false) MultipartFile drugLicence,
            @RequestPart(required = false) MultipartFile fssaiLicence,
            @RequestPart(required = false) MultipartFile tradeLicence,
            @RequestPart(required = false) MultipartFile pharmacistCertificate,
            @RequestPart(required = false) MultipartFile signature)
            throws java.io.IOException {
        PharmacyRules.ApplicationInput input = new PharmacyRules.ApplicationInput(
                name,
                tagline,
                email,
                address,
                city,
                state,
                pincode,
                split(businessTypes),
                industry,
                registrationType,
                gstin,
                upload(gstCertificate),
                pan,
                upload(panCard),
                drugLicenceNo,
                upload(drugLicence),
                fssaiNo,
                upload(fssaiLicence),
                tradeLicenceNo,
                upload(tradeLicence),
                enableTds,
                enableTcs,
                pharmacistName,
                upload(pharmacistCertificate),
                invoicePrefix,
                upload(signature),
                terms,
                acceptOnlineOrders,
                selfOrderKiosk,
                eInvoicing,
                looseSelling,
                lowStockAlerts,
                upload(logo),
                phone);
        return applications.submit(Current.require(authentication), input);
    }

    @GetMapping("/pharmacy/verification")
    public PharmacyApplicationService.VerificationResponse verification(Authentication authentication) {
        return applications.verification(Current.require(authentication));
    }

    private static List<String> split(List<String> values) {
        if (values == null) {
            return List.of();
        }
        List<String> types = new ArrayList<>();
        for (String value : values) {
            if (value == null) {
                continue;
            }
            for (String part : value.split(",")) {
                if (!part.isBlank()) {
                    types.add(part.trim());
                }
            }
        }
        return types;
    }

    private static PharmacyRules.Upload upload(MultipartFile file) throws java.io.IOException {
        if (file == null || file.isEmpty()) {
            return null;
        }
        return new PharmacyRules.Upload(file.getContentType(), file.getBytes());
    }
}
