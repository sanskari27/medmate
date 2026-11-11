package com.medmate.server.identity.web;

import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Profile({"local", "prod", "identity-it"})
public class DocumentController {

    private final DocumentService documents;

    public DocumentController(DocumentService documents) {
        this.documents = documents;
    }

    @GetMapping("/pharmacies/{pharmacyId}/documents/{slot}")
    public ResponseEntity<byte[]> download(
            Authentication authentication, @PathVariable UUID pharmacyId, @PathVariable String slot) {
        var stored = documents.open(Current.require(authentication), pharmacyId, slot);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(stored.contentType()))
                .cacheControl(CacheControl.noStore())
                .body(stored.body());
    }
}
