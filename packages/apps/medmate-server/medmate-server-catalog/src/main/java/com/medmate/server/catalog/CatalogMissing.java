package com.medmate.server.catalog;

public final class CatalogMissing extends RuntimeException {

    public CatalogMissing() {
        super("Product was not found");
    }
}
