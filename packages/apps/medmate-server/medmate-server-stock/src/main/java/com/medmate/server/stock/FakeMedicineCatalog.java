package com.medmate.server.stock;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("identity-it")
public class FakeMedicineCatalog implements MedicineCatalog {

    public static final String MISSING = "missing";
    public static final String BOTH = "both";

    @Override
    public List<MedicineHit> search(String query, int limit) {
        return List.of(hit("DR100"));
    }

    @Override
    public Lookup lookup(List<String> ids) {
        List<Snapshot> products = new ArrayList<>();
        List<String> missing = new ArrayList<>();
        List<String> ambiguous = new ArrayList<>();
        for (String id : ids) {
            if (MISSING.equals(id)) {
                missing.add(id);
            } else if (BOTH.equals(id)) {
                ambiguous.add(id);
            } else {
                products.add(snapshot(id));
            }
        }
        return new Lookup(products, missing, ambiguous);
    }

    public static MedicineHit hit(String id) {
        return new MedicineHit(id, "Crocin Advance", "GSK", "Strip", new BigDecimal("25.00"));
    }

    public static Snapshot snapshot(String id) {
        return new Snapshot(
                id,
                "Crocin Advance",
                "GSK",
                "Paracetamol 500 mg",
                "Tablet",
                "Strip",
                "allopathy",
                new BigDecimal("25.00"));
    }
}
