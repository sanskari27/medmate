package com.medmate.server.reports.web;

import com.medmate.server.identity.web.Current;
import com.medmate.server.reports.ReportRules;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Profile({"local", "prod", "identity-it"})
public class ReportController {

    private final ReportService reports;

    public ReportController(ReportService reports) {
        this.reports = reports;
    }

    @GetMapping("/pharmacy/reports/{id}")
    public ReportRules.Result read(
            Authentication authentication,
            @PathVariable String id,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        return reports.read(Current.require(authentication), id, from, to);
    }

    @GetMapping(value = "/pharmacy/reports/{id}/export", produces = "text/csv")
    public ResponseEntity<String> export(
            Authentication authentication,
            @PathVariable String id,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        String body = reports.export(Current.require(authentication), id, from, to);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv"))
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(id + ".csv")
                                .build()
                                .toString())
                .body(body);
    }
}
