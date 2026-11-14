package com.medmate.server.catalog;

public final class CatalogConflict extends RuntimeException {

    public CatalogConflict() {
        super("Product already exists");
    }
}
