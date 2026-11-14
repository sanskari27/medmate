package com.medmate.server.stock;

import com.medmate.server.catalog.CatalogDocuments;
import com.medmate.server.catalog.CatalogStore;
import java.util.ArrayList;
import java.util.List;
import org.springframework.context.annotation.Profile;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Component;

@Component
@Profile({"local", "prod"})
public class StoreMedicineCatalog implements MedicineCatalog {

    private final CatalogStore store;

    public StoreMedicineCatalog(CatalogStore store) {
        this.store = store;
    }

    @Override
    public List<MedicineHit> search(String query, int limit) {
        try {
            CatalogDocuments.SearchResponse response = store.search(query, limit);
            List<MedicineHit> hits = new ArrayList<>();
            for (CatalogDocuments.DrugSummary drug : response.drug()) {
                hits.add(new MedicineHit(
                        drug.productId(),
                        name(drug.productName(), drug.productId()),
                        blank(drug.marketerName()),
                        blank(drug.packageName()),
                        drug.mrp()));
            }
            for (CatalogDocuments.FmcgSummary item : response.fmcg()) {
                hits.add(new MedicineHit(
                        item.productId(),
                        name(item.productName(), item.productId()),
                        blank(item.marketerName()),
                        blank(item.packageName()),
                        item.mrp()));
            }
            return hits;
        } catch (DataAccessException exception) {
            throw new CatalogUnavailable();
        }
    }

    @Override
    public Lookup lookup(List<String> ids) {
        try {
            CatalogStore.Found found = store.findMany(ids);
            List<Snapshot> products = new ArrayList<>();
            List<String> ambiguous = new ArrayList<>();
            for (String id : ids) {
                CatalogDocuments.DrugDetail drug = findDrug(found.drug(), id);
                CatalogDocuments.FmcgDetail fmcg = findFmcg(found.fmcg(), id);
                if (drug != null && fmcg != null) {
                    ambiguous.add(id);
                } else if (drug != null) {
                    products.add(drugSnapshot(drug));
                } else if (fmcg != null) {
                    products.add(fmcgSnapshot(fmcg));
                }
            }
            return new Lookup(products, found.missing(), ambiguous);
        } catch (DataAccessException exception) {
            throw new CatalogUnavailable();
        }
    }

    private static Snapshot drugSnapshot(CatalogDocuments.DrugDetail drug) {
        return new Snapshot(
                drug.productId(),
                name(drug.productName(), drug.productId()),
                blank(drug.marketerName()),
                composition(drug.ingredients()),
                blank(drug.productForm()),
                pack(drug.packageName(), drug.packagingDetail()),
                blank(drug.medicineType()),
                drug.mrp(),
                drug.prescriptionRequired());
    }

    private static Snapshot fmcgSnapshot(CatalogDocuments.FmcgDetail item) {
        return new Snapshot(
                item.productId(),
                name(item.productName(), item.productId()),
                blank(item.marketerName()),
                join(item.ingredients()),
                blank(item.productForm()),
                pack(item.packageName(), item.packaging()),
                blank(item.type()),
                item.mrp(),
                false);
    }

    private static String composition(List<CatalogDocuments.DrugIngredient> ingredients) {
        if (ingredients == null || ingredients.isEmpty()) {
            return null;
        }
        List<String> parts = new ArrayList<>();
        for (CatalogDocuments.DrugIngredient item : ingredients) {
            if (item.name() == null || item.name().isBlank()) {
                continue;
            }
            String strength = item.strength() == null ? "" : item.strength().trim();
            parts.add(strength.isEmpty() ? item.name().trim() : item.name().trim() + " " + strength);
        }
        return parts.isEmpty() ? null : String.join(", ", parts);
    }

    private static String join(List<String> values) {
        if (values == null || values.isEmpty()) {
            return null;
        }
        List<String> parts = new ArrayList<>();
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                parts.add(value.trim());
            }
        }
        return parts.isEmpty() ? null : String.join(", ", parts);
    }

    private static CatalogDocuments.DrugDetail findDrug(List<CatalogDocuments.DrugDetail> rows, String id) {
        for (CatalogDocuments.DrugDetail row : rows) {
            if (id.equals(row.productId())) {
                return row;
            }
        }
        return null;
    }

    private static CatalogDocuments.FmcgDetail findFmcg(List<CatalogDocuments.FmcgDetail> rows, String id) {
        for (CatalogDocuments.FmcgDetail row : rows) {
            if (id.equals(row.productId())) {
                return row;
            }
        }
        return null;
    }

    private static String pack(String packaged, String fallback) {
        String value = blank(packaged);
        return value == null ? blank(fallback) : value;
    }

    private static String name(String productName, String productId) {
        String name = blank(productName);
        return name == null ? productId : name;
    }

    private static String blank(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
