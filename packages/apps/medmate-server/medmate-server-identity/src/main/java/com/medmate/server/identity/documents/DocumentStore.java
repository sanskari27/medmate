package com.medmate.server.identity.documents;

import java.util.Optional;

public interface DocumentStore {

    void put(String key, String contentType, byte[] body);

    Optional<Stored> get(String key);

    void delete(String key);

    record Stored(String contentType, byte[] body) {}
}
