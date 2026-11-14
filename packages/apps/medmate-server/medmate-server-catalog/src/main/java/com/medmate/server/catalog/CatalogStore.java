package com.medmate.server.catalog;

import java.util.List;

public interface CatalogStore {

    CatalogDocuments.SearchResponse search(String query, int limit);

    CatalogDocuments.CatalogList list(CatalogRules.Listing listing);

    Found findMany(List<String> ids);

    CatalogDocuments.DrugDetail createDrug(CatalogDocuments.DrugDetail draft);

    CatalogDocuments.DrugDetail updateDrug(CatalogDocuments.DrugDetail draft);

    CatalogDocuments.FmcgDetail createFmcg(CatalogDocuments.FmcgDetail draft);

    CatalogDocuments.FmcgDetail updateFmcg(CatalogDocuments.FmcgDetail draft);

    record Found(
            List<CatalogDocuments.DrugDetail> drug, List<CatalogDocuments.FmcgDetail> fmcg, List<String> missing) {}
}
