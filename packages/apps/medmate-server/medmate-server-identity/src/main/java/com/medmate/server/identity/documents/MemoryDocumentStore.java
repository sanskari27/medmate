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

    @Override
    public String url(String key) {
        int slotSlash = key.lastIndexOf('/');
        int idSlash = key.lastIndexOf('/', slotSlash - 1);
        String pharmacyId = key.substring(idSlash + 1, slotSlash);
        String slot = key.substring(slotSlash + 1);
        return "/pharmacies/" + pharmacyId + "/documents/" + slot;
    }
}
