package com.medmate.server.identity.web;

import com.medmate.server.identity.pharmacy.PharmacyRules;
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
public class InvoiceSettingsController {

    private final InvoiceSettingsService settings;

    public InvoiceSettingsController(InvoiceSettingsService settings) {
        this.settings = settings;
    }

    @GetMapping("/pharmacy/invoice-settings")
    public InvoiceSettingsService.InvoiceView read(Authentication authentication) {
        return settings.read(Current.require(authentication));
    }

    @PostMapping(value = "/pharmacy/invoice-settings", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.OK)
    public InvoiceSettingsService.InvoiceSaved update(
            Authentication authentication,
            @RequestParam(required = false) String template,
            @RequestParam(required = false) String accent,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String prefix,
            @RequestParam(required = false) String signatory,
            @RequestParam(required = false) String bankLine,
            @RequestParam(required = false) Boolean showBank,
            @RequestParam(required = false) String terms,
            @RequestParam(required = false) Boolean showLogo,
            @RequestParam(required = false) Boolean showStamp,
            @RequestPart(required = false) MultipartFile logo,
            @RequestPart(required = false) MultipartFile signature)
            throws java.io.IOException {
        PharmacyRules.InvoiceInput input = new PharmacyRules.InvoiceInput(
                template,
                accent,
                title,
                prefix,
                signatory,
                bankLine,
                showBank,
                terms,
                showLogo,
                showStamp,
                upload(logo),
                upload(signature));
        return settings.update(Current.require(authentication), input);
    }

    private static PharmacyRules.Upload upload(MultipartFile file) throws java.io.IOException {
        if (file == null || file.isEmpty()) {
            return null;
        }
        return new PharmacyRules.Upload(file.getContentType(), file.getBytes());
    }
}
