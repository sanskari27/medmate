package com.medmate.servercore.files;

import com.medmate.servercore.identity.AuthCookies;
import com.medmate.servercore.identity.AuthService;
import com.medmate.servercore.identity.SessionRow;
import com.medmate.servercore.kernel.ApiError;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class FileController {
    private final AuthService auth;
    private final FileStore files;

    public FileController(AuthService auth, FileStore files) {
        this.auth = auth;
        this.files = files;
    }

    @GetMapping("/api/v1/files/{id}")
    public ResponseEntity<byte[]> read(HttpServletRequest request, @PathVariable String id) {
        SessionRow session = auth.session(AuthCookies.accessToken(request));
        if (session == null) {
            throw new ApiError(401, "UNAUTHENTICATED", "Sign in required");
        }
        FileStore.StoredFile file = files.read(id, session.pharmacyId());
        if (file == null) {
            throw new ApiError(404, "NOT_FOUND", "File not found");
        }
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_TYPE, file.contentType() == null ? MediaType.APPLICATION_OCTET_STREAM_VALUE : file.contentType()).body(file.bytes());
    }
}
