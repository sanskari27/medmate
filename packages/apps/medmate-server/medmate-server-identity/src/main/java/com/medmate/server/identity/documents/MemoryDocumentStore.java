package com.medmate.server.identity.documents;

import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

public final class MemoryDocumentStore implements DocumentStore {

    private final ConcurrentHashMap<String, Stored> objects = new ConcurrentHashMap<>();

    @Override
    public void put(String key, String contentType, byte[] body) {
        objects.put(key, new Stored(contentType, body.clone()));
    }

    @Override
    public Optional<Stored> get(String key) {
        return Optional.ofNullable(objects.get(key));
    }

    @Override
    public void delete(String key) {
        objects.remove(key);
    }
}
