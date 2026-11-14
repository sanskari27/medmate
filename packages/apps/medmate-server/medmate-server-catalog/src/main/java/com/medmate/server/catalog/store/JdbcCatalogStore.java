package com.medmate.server.catalog.store;

import com.medmate.server.catalog.CatalogConflict;
import com.medmate.server.catalog.CatalogDocuments;
import com.medmate.server.catalog.CatalogDocuments.DrugDetail;
import com.medmate.server.catalog.CatalogDocuments.DrugFact;
import com.medmate.server.catalog.CatalogDocuments.DrugIngredient;
import com.medmate.server.catalog.CatalogDocuments.DrugInteraction;
import com.medmate.server.catalog.CatalogDocuments.DrugQuestion;
import com.medmate.server.catalog.CatalogDocuments.DrugSafety;
import com.medmate.server.catalog.CatalogDocuments.DrugSummary;
import com.medmate.server.catalog.CatalogDocuments.FmcgDetail;
import com.medmate.server.catalog.CatalogDocuments.FmcgSummary;
import com.medmate.server.catalog.CatalogMissing;
import com.medmate.server.catalog.CatalogRules;
import com.medmate.server.catalog.CatalogStore;
import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import javax.sql.DataSource;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

public class JdbcCatalogStore implements CatalogStore {

    private static final String DRUG_SEARCH =
            """
            SELECT product_id, product_name, display_name, marketer_name, medicine_type, product_form,
                   mrp, prescription_required, package, qty_amount, qty_unit
            FROM drugs
            WHERE product_id = :id
               OR product_name ILIKE :pattern ESCAPE '\\'
               OR display_name ILIKE :pattern ESCAPE '\\'
               OR marketer_name ILIKE :pattern ESCAPE '\\'
               OR medicine_type ILIKE :pattern ESCAPE '\\'
               OR product_form ILIKE :pattern ESCAPE '\\'
            ORDER BY product_name ASC, product_id ASC
            LIMIT :limit
            """;

    private static final String FMCG_SEARCH =
            """
            SELECT product_id, product_name, display_name, marketer_name, marketing_company, type, product_form,
                   mrp, package, qty_amount, qty_unit
            FROM otc_fmcg
            WHERE product_id = :id
               OR product_name ILIKE :pattern ESCAPE '\\'
               OR display_name ILIKE :pattern ESCAPE '\\'
               OR marketer_name ILIKE :pattern ESCAPE '\\'
               OR marketing_company ILIKE :pattern ESCAPE '\\'
               OR type ILIKE :pattern ESCAPE '\\'
               OR product_form ILIKE :pattern ESCAPE '\\'
            ORDER BY product_name ASC NULLS LAST, product_id ASC
            LIMIT :limit
            """;

    private final JdbcClient jdbc;
    private final TransactionTemplate transactions;

    public JdbcCatalogStore(DataSource dataSource) {
        this.jdbc = JdbcClient.create(dataSource);
        this.transactions = new TransactionTemplate(new DataSourceTransactionManager(dataSource));
    }

    @Override
    public CatalogDocuments.SearchResponse search(String query, int limit) {
        String pattern = CatalogRules.containsPattern(query);
        List<DrugSummary> drugs = jdbc.sql(DRUG_SEARCH)
                .param("id", query)
                .param("pattern", pattern)
                .param("limit", limit)
                .query((rs, row) -> drugSummary(rs))
                .list();
        List<FmcgSummary> fmcg = jdbc.sql(FMCG_SEARCH)
                .param("id", query)
                .param("pattern", pattern)
                .param("limit", limit)
                .query((rs, row) -> fmcgSummary(rs))
                .list();
        return new CatalogDocuments.SearchResponse(drugs, fmcg);
    }

    @Override
    public CatalogDocuments.CatalogList list(CatalogRules.Listing listing) {
        return new CatalogDocuments.CatalogList(pageDrugs(listing), pageFmcg(listing));
    }

    @Override
    public Found findMany(List<String> ids) {
        Map<String, DrugDetail> drugs = new LinkedHashMap<>();
        for (DrugDetail drug : findDrugs(ids)) {
            drugs.put(drug.productId(), drug);
        }
        Map<String, FmcgDetail> fmcg = new LinkedHashMap<>();
        for (FmcgDetail item : findFmcg(ids)) {
            fmcg.put(item.productId(), item);
        }
        List<DrugDetail> drugRows = new ArrayList<>();
        List<FmcgDetail> fmcgRows = new ArrayList<>();
        List<String> missing = new ArrayList<>();
        for (String id : ids) {
            DrugDetail drug = drugs.get(id);
            FmcgDetail item = fmcg.get(id);
            if (drug == null && item == null) {
                missing.add(id);
            }
            if (drug != null) {
                drugRows.add(drug);
            }
            if (item != null) {
                fmcgRows.add(item);
            }
        }
        return new Found(drugRows, fmcgRows, missing);
    }

    @Override
    public DrugDetail createDrug(DrugDetail draft) {
        try {
            return transactions.execute(status -> {
                insertDrug(draft);
                insertDrugChildren(draft);
                return requireDrug(draft.productId());
            });
        } catch (DuplicateKeyException exception) {
            throw new CatalogConflict();
        }
    }

    @Override
    public DrugDetail updateDrug(DrugDetail draft) {
        return transactions.execute(status -> {
            if (updateDrugRow(draft) == 0) {
                throw new CatalogMissing();
            }
            deleteChildren(
                    draft.productId(),
                    "drug_ingredients",
                    "drug_safety",
                    "drug_facts",
                    "drug_uses",
                    "drug_side_effects",
                    "drug_questions",
                    "drug_interactions",
                    "drug_images");
            insertDrugChildren(draft);
            return requireDrug(draft.productId());
        });
    }

    @Override
    public FmcgDetail createFmcg(FmcgDetail draft) {
        try {
            return transactions.execute(status -> {
                insertFmcg(draft);
                insertFmcgChildren(draft);
                return requireFmcg(draft.productId());
            });
        } catch (DuplicateKeyException exception) {
            throw new CatalogConflict();
        }
    }

    @Override
    public FmcgDetail updateFmcg(FmcgDetail draft) {
        return transactions.execute(status -> {
            if (updateFmcgRow(draft) == 0) {
                throw new CatalogMissing();
            }
            deleteChildren(
                    draft.productId(),
                    "otc_fmcg_categories",
                    "otc_fmcg_highlights",
                    "otc_fmcg_ingredients",
                    "otc_fmcg_benefits",
                    "otc_fmcg_safety",
                    "otc_fmcg_images");
            insertFmcgChildren(draft);
            return requireFmcg(draft.productId());
        });
    }

    private DrugDetail requireDrug(String productId) {
        return findDrugs(List.of(productId)).stream().findFirst().orElseThrow(CatalogMissing::new);
    }

    private FmcgDetail requireFmcg(String productId) {
        return findFmcg(List.of(productId)).stream().findFirst().orElseThrow(CatalogMissing::new);
    }

    private List<DrugDetail> findDrugs(List<String> ids) {
        if (ids.isEmpty()) {
            return List.of();
        }
        Map<String, DrugParent> parents = new LinkedHashMap<>();
        jdbc.sql(
                        """
                        SELECT product_id, product_name, display_name, marketer_name, marketer_address, medicine_type,
                               introduction, benefits, how_to_use, if_miss, packaging_detail, package,
                               qty_amount, qty_unit, qty_raw, product_form, mrp, prescription_required,
                               storage, how_it_works, country_of_origin, source_file
                        FROM drugs
                        WHERE product_id IN (:ids)
                        """)
                .param("ids", ids)
                .query((rs, row) -> {
                    parents.put(rs.getString("product_id"), drugParent(rs));
                    return null;
                })
                .list();
        if (parents.isEmpty()) {
            return List.of();
        }
        List<String> found = List.copyOf(parents.keySet());
        Map<String, List<DrugIngredient>> ingredients = ingredients(found);
        Map<String, List<DrugSafety>> safety = safety(found);
        Map<String, List<DrugFact>> facts = facts(found);
        Map<String, List<String>> uses = texts(found, "drug_uses", "use_text");
        Map<String, List<String>> sideEffects = texts(found, "drug_side_effects", "effect");
        Map<String, List<DrugQuestion>> questions = questions(found);
        Map<String, List<DrugInteraction>> interactions = interactions(found);
        Map<String, List<String>> images = texts(found, "drug_images", "url");
        List<DrugDetail> details = new ArrayList<>();
        for (Map.Entry<String, DrugParent> entry : parents.entrySet()) {
            String id = entry.getKey();
            DrugParent parent = entry.getValue();
            details.add(new DrugDetail(
                    id,
                    parent.productName(),
                    parent.displayName(),
                    parent.marketerName(),
                    parent.marketerAddress(),
                    parent.medicineType(),
                    parent.introduction(),
                    parent.benefits(),
                    parent.howToUse(),
                    parent.ifMiss(),
                    parent.packagingDetail(),
                    parent.packageName(),
                    parent.qtyAmount(),
                    parent.qtyUnit(),
                    parent.qtyRaw(),
                    parent.productForm(),
                    parent.mrp(),
                    parent.prescriptionRequired(),
                    parent.storage(),
                    parent.howItWorks(),
                    parent.countryOfOrigin(),
                    parent.sourceFile(),
                    ingredients.getOrDefault(id, List.of()),
                    safety.getOrDefault(id, List.of()),
                    facts.getOrDefault(id, List.of()),
                    uses.getOrDefault(id, List.of()),
                    sideEffects.getOrDefault(id, List.of()),
                    questions.getOrDefault(id, List.of()),
                    interactions.getOrDefault(id, List.of()),
                    images.getOrDefault(id, List.of())));
        }
        return details;
    }

    private List<FmcgDetail> findFmcg(List<String> ids) {
        if (ids.isEmpty()) {
            return List.of();
        }
        Map<String, FmcgParent> parents = new LinkedHashMap<>();
        jdbc.sql(
                        """
                        SELECT product_id, product_name, display_name, marketing_company, type, packaging, package,
                               qty_amount, qty_unit, qty_raw, product_form, mrp, information,
                               directions_for_use, country_of_origin, marketer_name, marketer_address, source_file
                        FROM otc_fmcg
                        WHERE product_id IN (:ids)
                        """)
                .param("ids", ids)
                .query((rs, row) -> {
                    parents.put(rs.getString("product_id"), fmcgParent(rs));
                    return null;
                })
                .list();
        if (parents.isEmpty()) {
            return List.of();
        }
        List<String> found = List.copyOf(parents.keySet());
        Map<String, List<String>> categories = texts(found, "otc_fmcg_categories", "segment");
        Map<String, List<String>> highlights = texts(found, "otc_fmcg_highlights", "highlight");
        Map<String, List<String>> ingredients = texts(found, "otc_fmcg_ingredients", "ingredient");
        Map<String, List<String>> benefits = texts(found, "otc_fmcg_benefits", "benefit");
        Map<String, List<String>> safety = texts(found, "otc_fmcg_safety", "safety_text");
        Map<String, List<String>> images = texts(found, "otc_fmcg_images", "url");
        List<FmcgDetail> details = new ArrayList<>();
        for (Map.Entry<String, FmcgParent> entry : parents.entrySet()) {
            String id = entry.getKey();
            FmcgParent parent = entry.getValue();
            details.add(new FmcgDetail(
                    id,
                    parent.productName(),
                    parent.displayName(),
                    parent.marketingCompany(),
                    parent.type(),
                    parent.packaging(),
                    parent.packageName(),
                    parent.qtyAmount(),
                    parent.qtyUnit(),
                    parent.qtyRaw(),
                    parent.productForm(),
                    parent.mrp(),
                    parent.information(),
                    parent.directionsForUse(),
                    parent.countryOfOrigin(),
                    parent.marketerName(),
                    parent.marketerAddress(),
                    parent.sourceFile(),
                    categories.getOrDefault(id, List.of()),
                    highlights.getOrDefault(id, List.of()),
                    ingredients.getOrDefault(id, List.of()),
                    benefits.getOrDefault(id, List.of()),
                    safety.getOrDefault(id, List.of()),
                    images.getOrDefault(id, List.of())));
        }
        return details;
    }

    private void insertDrug(DrugDetail draft) {
        jdbc.sql(
                        """
                        INSERT INTO drugs (
                            product_id, product_name, display_name, marketer_name, marketer_address, medicine_type,
                            introduction, benefits, how_to_use, if_miss, packaging_detail, package,
                            qty_amount, qty_unit, qty_raw, product_form, mrp, prescription_required,
                            storage, how_it_works, country_of_origin, source_file
                        ) VALUES (
                            :productId, :productName, :displayName, :marketerName, :marketerAddress, :medicineType,
                            :introduction, :benefits, :howToUse, :ifMiss, :packagingDetail, :packageName,
                            :qtyAmount, :qtyUnit, :qtyRaw, :productForm, :mrp, :prescriptionRequired,
                            :storage, :howItWorks, :countryOfOrigin, :sourceFile
                        )
                        """)
                .param("productId", draft.productId(), Types.VARCHAR)
                .param("productName", draft.productName(), Types.VARCHAR)
                .param("displayName", draft.displayName(), Types.VARCHAR)
                .param("marketerName", draft.marketerName(), Types.VARCHAR)
                .param("marketerAddress", draft.marketerAddress(), Types.VARCHAR)
                .param("medicineType", draft.medicineType(), Types.VARCHAR)
                .param("introduction", draft.introduction(), Types.VARCHAR)
                .param("benefits", draft.benefits(), Types.VARCHAR)
                .param("howToUse", draft.howToUse(), Types.VARCHAR)
                .param("ifMiss", draft.ifMiss(), Types.VARCHAR)
                .param("packagingDetail", draft.packagingDetail(), Types.VARCHAR)
                .param("packageName", draft.packageName(), Types.VARCHAR)
                .param("qtyAmount", draft.qtyAmount(), Types.NUMERIC)
                .param("qtyUnit", draft.qtyUnit(), Types.VARCHAR)
                .param("qtyRaw", draft.qtyRaw(), Types.VARCHAR)
                .param("productForm", draft.productForm(), Types.VARCHAR)
                .param("mrp", draft.mrp(), Types.NUMERIC)
                .param("prescriptionRequired", draft.prescriptionRequired(), Types.BOOLEAN)
                .param("storage", draft.storage(), Types.VARCHAR)
                .param("howItWorks", draft.howItWorks(), Types.VARCHAR)
                .param("countryOfOrigin", draft.countryOfOrigin(), Types.VARCHAR)
                .param("sourceFile", draft.sourceFile(), Types.VARCHAR)
                .update();
    }

    private int updateDrugRow(DrugDetail draft) {
        return jdbc.sql(
                        """
                        UPDATE drugs SET
                            product_name = :productName,
                            display_name = :displayName,
                            marketer_name = :marketerName,
                            marketer_address = :marketerAddress,
                            medicine_type = :medicineType,
                            introduction = :introduction,
                            benefits = :benefits,
                            how_to_use = :howToUse,
                            if_miss = :ifMiss,
                            packaging_detail = :packagingDetail,
                            package = :packageName,
                            qty_amount = :qtyAmount,
                            qty_unit = :qtyUnit,
                            qty_raw = :qtyRaw,
                            product_form = :productForm,
                            mrp = :mrp,
                            prescription_required = :prescriptionRequired,
                            storage = :storage,
                            how_it_works = :howItWorks,
                            country_of_origin = :countryOfOrigin,
                            source_file = :sourceFile
                        WHERE product_id = :productId
                        """)
                .param("productId", draft.productId(), Types.VARCHAR)
                .param("productName", draft.productName(), Types.VARCHAR)
                .param("displayName", draft.displayName(), Types.VARCHAR)
                .param("marketerName", draft.marketerName(), Types.VARCHAR)
                .param("marketerAddress", draft.marketerAddress(), Types.VARCHAR)
                .param("medicineType", draft.medicineType(), Types.VARCHAR)
                .param("introduction", draft.introduction(), Types.VARCHAR)
                .param("benefits", draft.benefits(), Types.VARCHAR)
                .param("howToUse", draft.howToUse(), Types.VARCHAR)
                .param("ifMiss", draft.ifMiss(), Types.VARCHAR)
                .param("packagingDetail", draft.packagingDetail(), Types.VARCHAR)
                .param("packageName", draft.packageName(), Types.VARCHAR)
                .param("qtyAmount", draft.qtyAmount(), Types.NUMERIC)
                .param("qtyUnit", draft.qtyUnit(), Types.VARCHAR)
                .param("qtyRaw", draft.qtyRaw(), Types.VARCHAR)
                .param("productForm", draft.productForm(), Types.VARCHAR)
                .param("mrp", draft.mrp(), Types.NUMERIC)
                .param("prescriptionRequired", draft.prescriptionRequired(), Types.BOOLEAN)
                .param("storage", draft.storage(), Types.VARCHAR)
                .param("howItWorks", draft.howItWorks(), Types.VARCHAR)
                .param("countryOfOrigin", draft.countryOfOrigin(), Types.VARCHAR)
                .param("sourceFile", draft.sourceFile(), Types.VARCHAR)
                .update();
    }

    private void insertDrugChildren(DrugDetail draft) {
        int position = 1;
        for (DrugIngredient item : draft.ingredients()) {
            jdbc.sql(
                            """
                            INSERT INTO drug_ingredients (product_id, position, name, strength, amount, unit)
                            VALUES (:productId, :position, :name, :strength, :amount, :unit)
                            """)
                    .param("productId", draft.productId(), Types.VARCHAR)
                    .param("position", position++, Types.INTEGER)
                    .param("name", item.name(), Types.VARCHAR)
                    .param("strength", item.strength(), Types.VARCHAR)
                    .param("amount", item.amount(), Types.NUMERIC)
                    .param("unit", item.unit(), Types.VARCHAR)
                    .update();
        }
        position = 1;
        for (DrugSafety item : draft.safety()) {
            jdbc.sql(
                            """
                            INSERT INTO drug_safety (product_id, position, topic, level, detail)
                            VALUES (:productId, :position, :topic, :level, :detail)
                            """)
                    .param("productId", draft.productId(), Types.VARCHAR)
                    .param("position", position++, Types.INTEGER)
                    .param("topic", item.topic(), Types.VARCHAR)
                    .param("level", item.level(), Types.VARCHAR)
                    .param("detail", item.detail(), Types.VARCHAR)
                    .update();
        }
        position = 1;
        for (DrugFact item : draft.facts()) {
            jdbc.sql(
                            """
                            INSERT INTO drug_facts (product_id, position, label, value)
                            VALUES (:productId, :position, :label, :value)
                            """)
                    .param("productId", draft.productId(), Types.VARCHAR)
                    .param("position", position++, Types.INTEGER)
                    .param("label", item.label(), Types.VARCHAR)
                    .param("value", item.value(), Types.VARCHAR)
                    .update();
        }
        insertTexts(draft.productId(), "drug_uses", "use_text", draft.uses());
        insertTexts(draft.productId(), "drug_side_effects", "effect", draft.sideEffects());
        position = 1;
        for (DrugQuestion item : draft.questions()) {
            jdbc.sql(
                            """
                            INSERT INTO drug_questions (product_id, position, question, answer)
                            VALUES (:productId, :position, :question, :answer)
                            """)
                    .param("productId", draft.productId(), Types.VARCHAR)
                    .param("position", position++, Types.INTEGER)
                    .param("question", item.question(), Types.VARCHAR)
                    .param("answer", item.answer(), Types.VARCHAR)
                    .update();
        }
        position = 1;
        for (DrugInteraction item : draft.interactions()) {
            jdbc.sql(
                            """
                            INSERT INTO drug_interactions (
                                product_id, position, drug, route, severity, other_product, interacts_with, detail
                            ) VALUES (
                                :productId, :position, :drug, :route, :severity, :otherProduct, :interactsWith, :detail
                            )
                            """)
                    .param("productId", draft.productId(), Types.VARCHAR)
                    .param("position", position++, Types.INTEGER)
                    .param("drug", item.drug(), Types.VARCHAR)
                    .param("route", item.route(), Types.VARCHAR)
                    .param("severity", item.severity(), Types.VARCHAR)
                    .param("otherProduct", item.otherProduct(), Types.VARCHAR)
                    .param("interactsWith", item.interactsWith(), Types.VARCHAR)
                    .param("detail", item.detail(), Types.VARCHAR)
                    .update();
        }
        insertTexts(draft.productId(), "drug_images", "url", draft.images());
    }

    private void insertFmcg(FmcgDetail draft) {
        jdbc.sql(
                        """
                        INSERT INTO otc_fmcg (
                            product_id, product_name, display_name, marketing_company, type, packaging, package,
                            qty_amount, qty_unit, qty_raw, product_form, mrp, information,
                            directions_for_use, country_of_origin, marketer_name, marketer_address, source_file
                        ) VALUES (
                            :productId, :productName, :displayName, :marketingCompany, :type, :packaging, :packageName,
                            :qtyAmount, :qtyUnit, :qtyRaw, :productForm, :mrp, :information,
                            :directionsForUse, :countryOfOrigin, :marketerName, :marketerAddress, :sourceFile
                        )
                        """)
                .param("productId", draft.productId(), Types.VARCHAR)
                .param("productName", draft.productName(), Types.VARCHAR)
                .param("displayName", draft.displayName(), Types.VARCHAR)
                .param("marketingCompany", draft.marketingCompany(), Types.VARCHAR)
                .param("type", draft.type(), Types.VARCHAR)
                .param("packaging", draft.packaging(), Types.VARCHAR)
                .param("packageName", draft.packageName(), Types.VARCHAR)
                .param("qtyAmount", draft.qtyAmount(), Types.NUMERIC)
                .param("qtyUnit", draft.qtyUnit(), Types.VARCHAR)
                .param("qtyRaw", draft.qtyRaw(), Types.VARCHAR)
                .param("productForm", draft.productForm(), Types.VARCHAR)
                .param("mrp", draft.mrp(), Types.NUMERIC)
                .param("information", draft.information(), Types.VARCHAR)
                .param("directionsForUse", draft.directionsForUse(), Types.VARCHAR)
                .param("countryOfOrigin", draft.countryOfOrigin(), Types.VARCHAR)
                .param("marketerName", draft.marketerName(), Types.VARCHAR)
                .param("marketerAddress", draft.marketerAddress(), Types.VARCHAR)
                .param("sourceFile", draft.sourceFile(), Types.VARCHAR)
                .update();
    }

    private int updateFmcgRow(FmcgDetail draft) {
        return jdbc.sql(
                        """
                        UPDATE otc_fmcg SET
                            product_name = :productName,
                            display_name = :displayName,
                            marketing_company = :marketingCompany,
                            type = :type,
                            packaging = :packaging,
                            package = :packageName,
                            qty_amount = :qtyAmount,
                            qty_unit = :qtyUnit,
                            qty_raw = :qtyRaw,
                            product_form = :productForm,
                            mrp = :mrp,
                            information = :information,
                            directions_for_use = :directionsForUse,
                            country_of_origin = :countryOfOrigin,
                            marketer_name = :marketerName,
                            marketer_address = :marketerAddress,
                            source_file = :sourceFile
                        WHERE product_id = :productId
                        """)
                .param("productId", draft.productId(), Types.VARCHAR)
                .param("productName", draft.productName(), Types.VARCHAR)
                .param("displayName", draft.displayName(), Types.VARCHAR)
                .param("marketingCompany", draft.marketingCompany(), Types.VARCHAR)
                .param("type", draft.type(), Types.VARCHAR)
                .param("packaging", draft.packaging(), Types.VARCHAR)
                .param("packageName", draft.packageName(), Types.VARCHAR)
                .param("qtyAmount", draft.qtyAmount(), Types.NUMERIC)
                .param("qtyUnit", draft.qtyUnit(), Types.VARCHAR)
                .param("qtyRaw", draft.qtyRaw(), Types.VARCHAR)
                .param("productForm", draft.productForm(), Types.VARCHAR)
                .param("mrp", draft.mrp(), Types.NUMERIC)
                .param("information", draft.information(), Types.VARCHAR)
                .param("directionsForUse", draft.directionsForUse(), Types.VARCHAR)
                .param("countryOfOrigin", draft.countryOfOrigin(), Types.VARCHAR)
                .param("marketerName", draft.marketerName(), Types.VARCHAR)
                .param("marketerAddress", draft.marketerAddress(), Types.VARCHAR)
                .param("sourceFile", draft.sourceFile(), Types.VARCHAR)
                .update();
    }

    private void insertFmcgChildren(FmcgDetail draft) {
        insertTexts(draft.productId(), "otc_fmcg_categories", "segment", draft.categories());
        insertTexts(draft.productId(), "otc_fmcg_highlights", "highlight", draft.highlights());
        insertTexts(draft.productId(), "otc_fmcg_ingredients", "ingredient", draft.ingredients());
        insertTexts(draft.productId(), "otc_fmcg_benefits", "benefit", draft.benefits());
        insertTexts(draft.productId(), "otc_fmcg_safety", "safety_text", draft.safety());
        insertTexts(draft.productId(), "otc_fmcg_images", "url", draft.images());
    }

    private void insertTexts(String productId, String table, String column, List<String> values) {
        int position = 1;
        for (String value : values) {
            jdbc.sql("INSERT INTO " + table + " (product_id, position, " + column + ") "
                            + "VALUES (:productId, :position, :value)")
                    .param("productId", productId, Types.VARCHAR)
                    .param("position", position++, Types.INTEGER)
                    .param("value", value, Types.VARCHAR)
                    .update();
        }
    }

    private void deleteChildren(String productId, String... tables) {
        for (String table : tables) {
            jdbc.sql("DELETE FROM " + table + " WHERE product_id = :id")
                    .param("id", productId, Types.VARCHAR)
                    .update();
        }
    }

    private Map<String, List<DrugIngredient>> ingredients(List<String> ids) {
        Map<String, List<DrugIngredient>> grouped = new HashMap<>();
        jdbc.sql(
                        """
                        SELECT product_id, name, strength, amount, unit
                        FROM drug_ingredients
                        WHERE product_id IN (:ids)
                        ORDER BY product_id, position
                        """)
                .param("ids", ids)
                .query((rs, row) -> {
                    grouped.computeIfAbsent(rs.getString("product_id"), key -> new ArrayList<>())
                            .add(new DrugIngredient(
                                    rs.getString("name"),
                                    rs.getString("strength"),
                                    rs.getBigDecimal("amount"),
                                    rs.getString("unit")));
                    return null;
                })
                .list();
        return grouped;
    }

    private Map<String, List<DrugSafety>> safety(List<String> ids) {
        Map<String, List<DrugSafety>> grouped = new HashMap<>();
        jdbc.sql(
                        """
                        SELECT product_id, topic, level, detail
                        FROM drug_safety
                        WHERE product_id IN (:ids)
                        ORDER BY product_id, position
                        """)
                .param("ids", ids)
                .query((rs, row) -> {
                    grouped.computeIfAbsent(rs.getString("product_id"), key -> new ArrayList<>())
                            .add(new DrugSafety(rs.getString("topic"), rs.getString("level"), rs.getString("detail")));
                    return null;
                })
                .list();
        return grouped;
    }

    private Map<String, List<DrugFact>> facts(List<String> ids) {
        Map<String, List<DrugFact>> grouped = new HashMap<>();
        jdbc.sql(
                        """
                        SELECT product_id, label, value
                        FROM drug_facts
                        WHERE product_id IN (:ids)
                        ORDER BY product_id, position
                        """)
                .param("ids", ids)
                .query((rs, row) -> {
                    grouped.computeIfAbsent(rs.getString("product_id"), key -> new ArrayList<>())
                            .add(new DrugFact(rs.getString("label"), rs.getString("value")));
                    return null;
                })
                .list();
        return grouped;
    }

    private Map<String, List<DrugQuestion>> questions(List<String> ids) {
        Map<String, List<DrugQuestion>> grouped = new HashMap<>();
        jdbc.sql(
                        """
                        SELECT product_id, question, answer
                        FROM drug_questions
                        WHERE product_id IN (:ids)
                        ORDER BY product_id, position
                        """)
                .param("ids", ids)
                .query((rs, row) -> {
                    grouped.computeIfAbsent(rs.getString("product_id"), key -> new ArrayList<>())
                            .add(new DrugQuestion(rs.getString("question"), rs.getString("answer")));
                    return null;
                })
                .list();
        return grouped;
    }

    private Map<String, List<DrugInteraction>> interactions(List<String> ids) {
        Map<String, List<DrugInteraction>> grouped = new HashMap<>();
        jdbc.sql(
                        """
                        SELECT product_id, drug, route, severity, other_product, interacts_with, detail
                        FROM drug_interactions
                        WHERE product_id IN (:ids)
                        ORDER BY product_id, position
                        """)
                .param("ids", ids)
                .query((rs, row) -> {
                    grouped.computeIfAbsent(rs.getString("product_id"), key -> new ArrayList<>())
                            .add(new DrugInteraction(
                                    rs.getString("drug"),
                                    rs.getString("route"),
                                    rs.getString("severity"),
                                    rs.getString("other_product"),
                                    rs.getString("interacts_with"),
                                    rs.getString("detail")));
                    return null;
                })
                .list();
        return grouped;
    }

    private Map<String, List<String>> texts(List<String> ids, String table, String column) {
        Map<String, List<String>> grouped = new HashMap<>();
        jdbc.sql("SELECT product_id, " + column + " AS value FROM " + table
                        + " WHERE product_id IN (:ids) ORDER BY product_id, position")
                .param("ids", ids)
                .query((rs, row) -> {
                    grouped.computeIfAbsent(rs.getString("product_id"), key -> new ArrayList<>())
                            .add(rs.getString("value"));
                    return null;
                })
                .list();
        return grouped;
    }

    private CatalogDocuments.SummaryPage<DrugSummary> pageDrugs(CatalogRules.Listing listing) {
        if (!listing.includeDrugs()) {
            return empty(listing);
        }
        String where = drugWhere(listing);
        int total = count("drugs", where, listing, true);
        String sql =
                """
                SELECT product_id, product_name, display_name, marketer_name, medicine_type, product_form,
                       mrp, prescription_required, package, qty_amount, qty_unit
                FROM drugs
                """
                        + where
                        + " ORDER BY product_name ASC, product_id ASC LIMIT :limit OFFSET :offset";
        List<DrugSummary> items = bind(jdbc.sql(sql), listing, true, true)
                .query((rs, row) -> drugSummary(rs))
                .list();
        return new CatalogDocuments.SummaryPage<>(items, listing.page(), listing.size(), total);
    }

    private CatalogDocuments.SummaryPage<FmcgSummary> pageFmcg(CatalogRules.Listing listing) {
        if (!listing.includeFmcg()) {
            return empty(listing);
        }
        String where = fmcgWhere(listing);
        int total = count("otc_fmcg", where, listing, false);
        String sql =
                """
                SELECT product_id, product_name, display_name, marketer_name, marketing_company, type, product_form,
                       mrp, package, qty_amount, qty_unit
                FROM otc_fmcg
                """
                        + where
                        + " ORDER BY product_name ASC NULLS LAST, product_id ASC LIMIT :limit OFFSET :offset";
        List<FmcgSummary> items = bind(jdbc.sql(sql), listing, false, true)
                .query((rs, row) -> fmcgSummary(rs))
                .list();
        return new CatalogDocuments.SummaryPage<>(items, listing.page(), listing.size(), total);
    }

    private int count(String table, String where, CatalogRules.Listing listing, boolean drug) {
        Integer total = bind(jdbc.sql("SELECT count(*) FROM " + table + where), listing, drug, false)
                .query((rs, row) -> rs.getInt(1))
                .single();
        return total == null ? 0 : total;
    }

    private static JdbcClient.StatementSpec bind(
            JdbcClient.StatementSpec spec, CatalogRules.Listing listing, boolean drug, boolean page) {
        if (listing.text() != null) {
            spec.param("id", listing.text()).param("pattern", CatalogRules.containsPattern(listing.text()));
        }
        if (listing.form() != null) {
            spec.param("form", CatalogRules.containsPattern(listing.form()));
        }
        if (listing.marketer() != null) {
            spec.param("marketer", CatalogRules.containsPattern(listing.marketer()));
        }
        if (drug && listing.medicineType() != null) {
            spec.param("medicineType", CatalogRules.containsPattern(listing.medicineType()));
        }
        if (!drug && listing.fmcgType() != null) {
            spec.param("fmcgType", CatalogRules.containsPattern(listing.fmcgType()));
        }
        if (page) {
            spec.param("limit", listing.size()).param("offset", (listing.page() - 1) * listing.size());
        }
        return spec;
    }

    private static String drugWhere(CatalogRules.Listing listing) {
        StringBuilder where = new StringBuilder(" WHERE true");
        if (listing.text() != null) {
            where.append(
                    """
                     AND (product_id = :id
                       OR product_name ILIKE :pattern ESCAPE '\\'
                       OR display_name ILIKE :pattern ESCAPE '\\'
                       OR marketer_name ILIKE :pattern ESCAPE '\\'
                       OR medicine_type ILIKE :pattern ESCAPE '\\'
                       OR product_form ILIKE :pattern ESCAPE '\\')
                    """);
        }
        appendNameAndForm(where, listing);
        if (listing.prescription() == CatalogRules.Rx.YES) {
            where.append(" AND prescription_required = true");
        } else if (listing.prescription() == CatalogRules.Rx.NO) {
            where.append(" AND prescription_required = false");
        }
        if (listing.medicineType() != null) {
            where.append(" AND medicine_type ILIKE :medicineType ESCAPE '\\'");
        }
        if (listing.marketer() != null) {
            where.append(" AND marketer_name ILIKE :marketer ESCAPE '\\'");
        }
        return where.toString();
    }

    private static String fmcgWhere(CatalogRules.Listing listing) {
        StringBuilder where = new StringBuilder(" WHERE true");
        if (listing.text() != null) {
            where.append(
                    """
                     AND (product_id = :id
                       OR product_name ILIKE :pattern ESCAPE '\\'
                       OR display_name ILIKE :pattern ESCAPE '\\'
                       OR marketer_name ILIKE :pattern ESCAPE '\\'
                       OR marketing_company ILIKE :pattern ESCAPE '\\'
                       OR type ILIKE :pattern ESCAPE '\\'
                       OR product_form ILIKE :pattern ESCAPE '\\')
                    """);
        }
        appendNameAndForm(where, listing);
        if (listing.fmcgType() != null) {
            where.append(" AND type ILIKE :fmcgType ESCAPE '\\'");
        }
        if (listing.marketer() != null) {
            where.append(
                    " AND (marketer_name ILIKE :marketer ESCAPE '\\' OR marketing_company ILIKE :marketer ESCAPE '\\')");
        }
        return where.toString();
    }

    private static void appendNameAndForm(StringBuilder where, CatalogRules.Listing listing) {
        if (listing.displayName() == CatalogRules.NamePresence.MISSING) {
            where.append(" AND display_name IS NULL");
        } else if (listing.displayName() == CatalogRules.NamePresence.PRESENT) {
            where.append(" AND display_name IS NOT NULL");
        }
        if (listing.form() != null) {
            where.append(" AND product_form ILIKE :form ESCAPE '\\'");
        }
    }

    private static <T> CatalogDocuments.SummaryPage<T> empty(CatalogRules.Listing listing) {
        return new CatalogDocuments.SummaryPage<>(List.of(), listing.page(), listing.size(), 0);
    }

    private static DrugSummary drugSummary(ResultSet rs) throws SQLException {
        return new DrugSummary(
                rs.getString("product_id"),
                rs.getString("product_name"),
                rs.getString("display_name"),
                rs.getString("marketer_name"),
                rs.getString("medicine_type"),
                rs.getString("product_form"),
                rs.getBigDecimal("mrp"),
                rs.getBoolean("prescription_required"),
                rs.getString("package"),
                rs.getBigDecimal("qty_amount"),
                rs.getString("qty_unit"));
    }

    private static FmcgSummary fmcgSummary(ResultSet rs) throws SQLException {
        return new FmcgSummary(
                rs.getString("product_id"),
                rs.getString("product_name"),
                rs.getString("display_name"),
                rs.getString("marketer_name"),
                rs.getString("marketing_company"),
                rs.getString("type"),
                rs.getString("product_form"),
                rs.getBigDecimal("mrp"),
                rs.getString("package"),
                rs.getBigDecimal("qty_amount"),
                rs.getString("qty_unit"));
    }

    private static DrugParent drugParent(ResultSet rs) throws SQLException {
        return new DrugParent(
                rs.getString("product_name"),
                rs.getString("display_name"),
                rs.getString("marketer_name"),
                rs.getString("marketer_address"),
                rs.getString("medicine_type"),
                rs.getString("introduction"),
                rs.getString("benefits"),
                rs.getString("how_to_use"),
                rs.getString("if_miss"),
                rs.getString("packaging_detail"),
                rs.getString("package"),
                rs.getBigDecimal("qty_amount"),
                rs.getString("qty_unit"),
                rs.getString("qty_raw"),
                rs.getString("product_form"),
                rs.getBigDecimal("mrp"),
                rs.getBoolean("prescription_required"),
                rs.getString("storage"),
                rs.getString("how_it_works"),
                rs.getString("country_of_origin"),
                rs.getString("source_file"));
    }

    private static FmcgParent fmcgParent(ResultSet rs) throws SQLException {
        return new FmcgParent(
                rs.getString("product_name"),
                rs.getString("display_name"),
                rs.getString("marketing_company"),
                rs.getString("type"),
                rs.getString("packaging"),
                rs.getString("package"),
                rs.getBigDecimal("qty_amount"),
                rs.getString("qty_unit"),
                rs.getString("qty_raw"),
                rs.getString("product_form"),
                rs.getBigDecimal("mrp"),
                rs.getString("information"),
                rs.getString("directions_for_use"),
                rs.getString("country_of_origin"),
                rs.getString("marketer_name"),
                rs.getString("marketer_address"),
                rs.getString("source_file"));
    }

    private record DrugParent(
            String productName,
            String displayName,
            String marketerName,
            String marketerAddress,
            String medicineType,
            String introduction,
            String benefits,
            String howToUse,
            String ifMiss,
            String packagingDetail,
            String packageName,
            BigDecimal qtyAmount,
            String qtyUnit,
            String qtyRaw,
            String productForm,
            BigDecimal mrp,
            boolean prescriptionRequired,
            String storage,
            String howItWorks,
            String countryOfOrigin,
            String sourceFile) {}

    private record FmcgParent(
            String productName,
            String displayName,
            String marketingCompany,
            String type,
            String packaging,
            String packageName,
            BigDecimal qtyAmount,
            String qtyUnit,
            String qtyRaw,
            String productForm,
            BigDecimal mrp,
            String information,
            String directionsForUse,
            String countryOfOrigin,
            String marketerName,
            String marketerAddress,
            String sourceFile) {}
}
