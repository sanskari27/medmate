package com.medmate.server.identity.documents;

import java.util.Optional;

public interface DocumentStore extends AutoCloseable {

    void put(String key, String contentType, byte[] body);

    Optional<Stored> get(String key);

    void delete(String key);

    String url(String key);

    @Override
    default void close() {}

    record Stored(String contentType, byte[] body) {}
}
