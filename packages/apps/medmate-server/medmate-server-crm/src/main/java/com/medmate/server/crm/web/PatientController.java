package com.medmate.server.crm.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.server.identity.web.Current;
import com.medmate.server.shared.web.PageQuery;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Profile({"local", "prod", "identity-it"})
public class PatientController {

    private final PatientService patients;

    public PatientController(PatientService patients) {
        this.patients = patients;
    }

    @GetMapping("/pharmacy/patients")
    public PatientViews.ListResponse list(
            Authentication authentication,
            @RequestParam(required = false) String page,
            @RequestParam(required = false) String size,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) String segment) {
        return patients.list(Current.require(authentication), PageQuery.parse(page, size), q, sort, segment);
    }

    @GetMapping("/pharmacy/patients/export")
    public PatientViews.ExportResponse export(
            Authentication authentication,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) String segment) {
        return patients.export(Current.require(authentication), q, sort, segment);
    }

    @GetMapping("/pharmacy/patients/{phone}")
    public PatientViews.OneResponse read(Authentication authentication, @PathVariable String phone) {
        return patients.read(Current.require(authentication), phone);
    }

    @PatchMapping("/pharmacy/patients/{phone}")
    public PatientViews.OneResponse update(
            Authentication authentication, @PathVariable String phone, @RequestBody JsonNode body) {
        return patients.update(Current.require(authentication), phone, body);
    }

    @PostMapping("/pharmacy/patients/{phone}/repayments")
    public ResponseEntity<PatientViews.RepaymentResponse> repay(
            Authentication authentication, @PathVariable String phone, @RequestBody JsonNode body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(patients.repay(Current.require(authentication), phone, body));
    }

    @PostMapping("/pharmacy/patients/{phone}/reminders")
    public ResponseEntity<PatientViews.ReminderResponse> remind(
            Authentication authentication, @PathVariable String phone, @RequestBody JsonNode body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(patients.remind(Current.require(authentication), phone, body));
    }

    @PostMapping("/pharmacy/patients/{phone}/redemptions")
    public ResponseEntity<PatientViews.RedemptionResponse> redeem(
            Authentication authentication, @PathVariable String phone) {
        return ResponseEntity.status(HttpStatus.CREATED).body(patients.redeem(Current.require(authentication), phone));
    }

    @PostMapping("/pharmacy/patients/{phone}/feedback")
    public ResponseEntity<PatientViews.FeedbackResponse> feedback(
            Authentication authentication, @PathVariable String phone, @RequestBody JsonNode body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(patients.feedback(Current.require(authentication), phone, body));
    }

    @GetMapping("/pharmacy/crm/campaigns")
    public PatientViews.CampaignList campaigns(Authentication authentication) {
        return patients.campaigns(Current.require(authentication));
    }

    @PostMapping("/pharmacy/crm/campaigns")
    public ResponseEntity<PatientViews.CampaignResponse> addCampaign(
            Authentication authentication, @RequestBody JsonNode body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(patients.addCampaign(Current.require(authentication), body));
    }

    @GetMapping("/pharmacy/crm/reminders")
    public PatientViews.ReminderList reminders(Authentication authentication) {
        return patients.reminders(Current.require(authentication));
    }

    @GetMapping("/pharmacy/crm/feedback")
    public PatientViews.FeedbackList feedbackList(Authentication authentication) {
        return patients.feedbackList(Current.require(authentication));
    }

    @GetMapping("/pharmacy/crm/analytics")
    public PatientViews.Analytics analytics(Authentication authentication) {
        return patients.analytics(Current.require(authentication));
    }
}
