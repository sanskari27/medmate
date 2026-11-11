package com.medmate.server.identity.documents;

import java.time.Duration;
import java.util.Optional;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

public final class S3DocumentStore implements DocumentStore {

    public static final Duration URL_TTL = Duration.ofMinutes(15);

    private final S3Client s3;
    private final S3Presigner presigner;
    private final String bucket;

    public S3DocumentStore(S3Client s3, S3Presigner presigner, String bucket) {
        this.s3 = s3;
        this.presigner = presigner;
        this.bucket = bucket;
    }

    @Override
    public void put(String key, String contentType, byte[] body) {
        s3.putObject(
                PutObjectRequest.builder()
                        .bucket(bucket)
                        .key(key)
                        .contentType(contentType)
                        .build(),
                RequestBody.fromBytes(body));
    }

    @Override
    public Optional<Stored> get(String key) {
        var response = s3.getObjectAsBytes(
                GetObjectRequest.builder().bucket(bucket).key(key).build());
        String contentType = response.response().contentType();
        return Optional.of(new Stored(contentType, response.asByteArray()));
    }

    @Override
    public void delete(String key) {
        s3.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());
    }

    @Override
    public String url(String key) {
        GetObjectPresignRequest request = GetObjectPresignRequest.builder()
                .signatureDuration(URL_TTL)
                .getObjectRequest(
                        GetObjectRequest.builder().bucket(bucket).key(key).build())
                .build();
        return presigner.presignGetObject(request).url().toExternalForm();
    }

    @Override
    public void close() {
        s3.close();
        presigner.close();
    }
}
