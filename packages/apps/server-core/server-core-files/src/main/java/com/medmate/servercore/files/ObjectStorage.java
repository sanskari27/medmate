package com.medmate.servercore.files;

import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Component
public class ObjectStorage {
    private final String bucket;
    private final String prefix;
    private final String region;

    public ObjectStorage(@Value("${app.uploads-bucket:}") String bucket, @Value("${app.uploads-prefix:}") String prefix) {
        String environmentBucket = System.getenv("S3_BUCKET");
        this.bucket = bucket == null || bucket.isBlank() ? environmentBucket : bucket;
        this.prefix = prefix == null ? "" : prefix;
        String configuredRegion = System.getenv().getOrDefault("AWS_REGION", "ap-south-1");
        this.region = configuredRegion;
    }

    public boolean enabled() {
        return bucket != null && !bucket.isBlank();
    }

    public String put(UUID pharmacyId, String id, String type, byte[] bytes) {
        String key = keyPrefix() + pharmacyId + "/" + id;
        client().putObject(PutObjectRequest.builder().bucket(bucket).key(key).contentType(type).build(), RequestBody.fromBytes(bytes));
        return key;
    }

    public byte[] read(String key) {
        try (var stream = client().getObject(GetObjectRequest.builder().bucket(bucket).key(key).build())) {
            return stream.readAllBytes();
        } catch (Exception exception) {
            throw new IllegalStateException(exception);
        }
    }

    private String keyPrefix() {
        if (prefix.isBlank()) {
            return "";
        }
        return prefix.endsWith("/") ? prefix : prefix + "/";
    }

    private S3Client client() {
        return S3Client.builder().region(Region.of(region)).build();
    }
}
