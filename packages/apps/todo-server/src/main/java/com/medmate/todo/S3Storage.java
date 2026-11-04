package com.medmate.todo;

import java.io.IOException;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.core.sync.RequestBody;

@Component
public class S3Storage implements AutoCloseable {
    private final AppProperties properties;
    private final S3Client client;
    private final S3Presigner presigner;

    public S3Storage(AppProperties properties) {
        this.properties = properties;
        String region = System.getenv().getOrDefault("AWS_REGION", "ap-south-1");
        this.client = S3Client.builder().region(Region.of(region)).build();
        this.presigner = S3Presigner.builder().region(Region.of(region)).build();
    }

    public String store(UUID id, MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            return null;
        }
        String bucket = required(properties.getUploadsBucket(), "Uploads bucket is not configured");
        String prefix = required(properties.getUploadsPrefix(), "Uploads prefix is not configured");
        if (!prefix.endsWith("/")) {
            prefix = prefix + "/";
        }
        String key = prefix + id + "/" + safeName(file.getOriginalFilename());
        String contentType = file.getContentType() == null ? "application/octet-stream" : file.getContentType();
        client.putObject(
                PutObjectRequest.builder().bucket(bucket).key(key).contentType(contentType).build(),
                RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
        return key;
    }

    public String presign(String key) {
        String bucket = required(properties.getUploadsBucket(), "Uploads bucket is not configured");
        return presigner.presignGetObject(GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(5))
                .getObjectRequest(GetObjectRequest.builder().bucket(bucket).key(key).build())
                .build()).url().toString();
    }

    public void delete(String key) {
        if (key == null || key.isBlank()) {
            return;
        }
        client.deleteObject(DeleteObjectRequest.builder()
                .bucket(required(properties.getUploadsBucket(), "Uploads bucket is not configured"))
                .key(key)
                .build());
    }

    @Override
    public void close() {
        client.close();
        presigner.close();
    }

    private static String required(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, message);
        }
        return value;
    }

    private static String safeName(String original) {
        String base = original == null ? "file" : Paths.get(original).getFileName().toString();
        String safe = base.replaceAll("[^A-Za-z0-9._-]", "_");
        if (safe.isBlank() || ".".equals(safe) || "..".equals(safe)) {
            return "file";
        }
        return safe;
    }
}
