package com.medmate.server.stock;

import static org.assertj.core.api.Assertions.assertThat;

import com.medmate.server.catalog.CatalogDocuments;
import com.medmate.server.catalog.CatalogStore;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;

class StoreMedicineCatalogTest {

    private final FakeStore store = new FakeStore();
    private final StoreMedicineCatalog catalog = new StoreMedicineCatalog(store);

    @Test
    void lookupMapsCompositionPackAndAnAmbiguousId() {
        store.found = new CatalogStore.Found(
                List.of(drug(
                        "DR100",
                        "Crocin",
                        null,
                        "Strip of 15",
                        List.of(
                                new CatalogDocuments.DrugIngredient("Paracetamol", "500 mg", null, null),
                                new CatalogDocuments.DrugIngredient("Caffeine", null, null, null)))),
                List.of(fmcg("DR100", "Crocin Soap", "Bottle", List.of("Aloe"))),
                List.of("missing"));

        MedicineCatalog.Lookup lookup = catalog.lookup(List.of("DR100", "missing"));

        assertThat(lookup.ambiguous()).containsExactly("DR100");
        assertThat(lookup.products()).isEmpty();
        assertThat(lookup.missing()).containsExactly("missing");

        store.found = new CatalogStore.Found(
                List.of(drug(
                        "DR100",
                        "Crocin",
                        "Strip",
                        "Strip of 15",
                        List.of(
                                new CatalogDocuments.DrugIngredient("Paracetamol", "500 mg", null, null),
                                new CatalogDocuments.DrugIngredient("Caffeine", "", null, null)))),
                List.of(),
                List.of());
        MedicineCatalog.Snapshot drug =
                catalog.lookup(List.of("DR100")).products().get(0);
        assertThat(drug.composition()).isEqualTo("Paracetamol 500 mg, Caffeine");
        assertThat(drug.pack()).isEqualTo("Strip");
        assertThat(drug.prescriptionRequired()).isFalse();

        store.found =
                new CatalogStore.Found(List.of(), List.of(fmcg("OTC1", "", null, List.of("Aloe", "Tea"))), List.of());
        MedicineCatalog.Snapshot fmcg =
                catalog.lookup(List.of("OTC1")).products().get(0);
        assertThat(fmcg.name()).isEqualTo("OTC1");
        assertThat(fmcg.composition()).isEqualTo("Aloe, Tea");
        assertThat(fmcg.pack()).isEqualTo("Bottle");
    }

    private static CatalogDocuments.DrugDetail drug(
            String id, String name, String pack, String packaging, List<CatalogDocuments.DrugIngredient> ingredients) {
        return new CatalogDocuments.DrugDetail(
                id,
                name,
                "GSK",
                null,
                "allopathy",
                null,
                null,
                null,
                null,
                packaging,
                pack,
                null,
                null,
                null,
                "Tablet",
                new BigDecimal("25.00"),
                false,
                null,
                null,
                null,
                null,
                ingredients,
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of());
    }

    private static CatalogDocuments.FmcgDetail fmcg(String id, String name, String pack, List<String> ingredients) {
        return new CatalogDocuments.FmcgDetail(
                id,
                name,
                null,
                "soap",
                "Bottle",
                pack,
                null,
                null,
                null,
                "Liquid",
                new BigDecimal("40"),
                null,
                null,
                null,
                "GSK",
                null,
                null,
                List.of(),
                List.of(),
                ingredients,
                List.of(),
                List.of(),
                List.of());
    }

    private static final class FakeStore implements CatalogStore {
        private Found found = new Found(List.of(), List.of(), List.of());

        @Override
        public CatalogDocuments.SearchResponse search(String query, int limit) {
            return new CatalogDocuments.SearchResponse(List.of(), List.of());
        }

        @Override
        public Found findMany(List<String> ids) {
            return found;
        }

        @Override
        public CatalogDocuments.DrugDetail createDrug(CatalogDocuments.DrugDetail draft) {
            throw new UnsupportedOperationException();
        }

        @Override
        public CatalogDocuments.DrugDetail updateDrug(CatalogDocuments.DrugDetail draft) {
            throw new UnsupportedOperationException();
        }

        @Override
        public CatalogDocuments.FmcgDetail createFmcg(CatalogDocuments.FmcgDetail draft) {
            throw new UnsupportedOperationException();
        }

        @Override
        public CatalogDocuments.FmcgDetail updateFmcg(CatalogDocuments.FmcgDetail draft) {
            throw new UnsupportedOperationException();
        }
    }
}
