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
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Consumer;
import java.util.function.Supplier;
import javax.sql.DataSource;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

public class JdbcCatalogStore implements CatalogStore {

    private static final long COUNT_TTL_MILLIS = 5 * 60 * 1000L;
    // Common names finish the ordered walk inside this window. A later match uses the trigram index.
    private static final int NAME_HEAD_START_MILLIS = 120;
    private static final String DRUG_COLUMNS =
            "product_id, product_name, display_name, marketer_name, medicine_type, product_form, "
                    + "mrp, prescription_required, package, qty_amount, qty_unit";
    private static final String FMCG_COLUMNS =
            "product_id, product_name, display_name, marketer_name, marketing_company, type, product_form, "
                    + "mrp, package, qty_amount, qty_unit";
    private static final Comparator<DrugSummary> DRUG_ORDER = Comparator.comparing(
                    DrugSummary::productName, Comparator.nullsFirst(String::compareTo))
            .thenComparing(DrugSummary::productId);
    private static final Comparator<FmcgSummary> FMCG_ORDER = Comparator.comparing(
                    FmcgSummary::productName, Comparator.nullsLast(String::compareTo))
            .thenComparing(FmcgSummary::productId);

    private final JdbcClient jdbc;
    private final TransactionTemplate transactions;
    private final ExecutorService pool;
    private final ExecutorService partner;
    private final ThreadLocal<AtomicInteger> backendSlot = new ThreadLocal<>();
    private final Object counts = new Object();
    private int drugGeneration;
    private int fmcgGeneration;
    private Integer drugTotal;
    private Integer fmcgTotal;
    private long drugTotalAt;
    private long fmcgTotalAt;

    public JdbcCatalogStore(DataSource dataSource) {
        this.jdbc = JdbcClient.create(dataSource);
        this.transactions = new TransactionTemplate(new DataSourceTransactionManager(dataSource));
        this.pool = Executors.newFixedThreadPool(8, JdbcCatalogStore::readThread);
        this.partner = Executors.newFixedThreadPool(4, JdbcCatalogStore::readThread);
    }

    public void close() {
        pool.shutdown();
        partner.shutdown();
    }

    @Override
    public CatalogDocuments.SearchResponse search(String query, int limit) {
        LabelHits labels = labelHits(query);
        String pattern = CatalogRules.containsPattern(query);
        List<DrugSummary> drugs = new ArrayList<>();
        List<FmcgSummary> fmcg = new ArrayList<>();
        if (query.length() < 3) {
            List<CompletableFuture<List<DrugSummary>>> drugAnchorTasks =
                    drugAnchors(query, pattern, null, limit, labels);
            List<CompletableFuture<List<FmcgSummary>>> fmcgAnchorTasks =
                    fmcgAnchors(query, pattern, null, limit, labels);
            List<DrugSummary> drugAnchor = awaitAll(drugAnchorTasks);
            List<FmcgSummary> fmcgAnchor = awaitAll(fmcgAnchorTasks);
            drugs.addAll(drugAnchor);
            fmcg.addAll(fmcgAnchor);
            List<CompletableFuture<List<DrugSummary>>> drugSecondaryTasks =
                    drugSecondary(query, pattern, null, limit, labels, drugCutoff(drugAnchor, limit));
            List<CompletableFuture<List<FmcgSummary>>> fmcgSecondaryTasks =
                    fmcgSecondary(query, pattern, null, limit, labels, fmcgCutoff(fmcgAnchor, limit));
            drugs.addAll(awaitAll(drugSecondaryTasks));
            fmcg.addAll(awaitAll(fmcgSecondaryTasks));
        } else {
            // Three-character patterns can use a trigram index, so the name cutoff is unnecessary.
            List<CompletableFuture<List<DrugSummary>>> drugTasks =
                    new ArrayList<>(drugAnchors(query, pattern, null, limit, labels));
            drugTasks.addAll(drugSecondary(query, pattern, null, limit, labels, null));
            List<CompletableFuture<List<FmcgSummary>>> fmcgTasks =
                    new ArrayList<>(fmcgAnchors(query, pattern, null, limit, labels));
            fmcgTasks.addAll(fmcgSecondary(query, pattern, null, limit, labels, null));
            drugs.addAll(awaitAll(drugTasks));
            fmcg.addAll(awaitAll(fmcgTasks));
        }
        return new CatalogDocuments.SearchResponse(
                window(drugs, DRUG_ORDER, 0, limit), window(fmcg, FMCG_ORDER, 0, limit));
    }

    @Override
    public CatalogDocuments.CatalogList list(CatalogRules.Listing listing) {
        CompletableFuture<Integer> drugCount = later(() -> drugCount(listing));
        CompletableFuture<Integer> fmcgCount = later(() -> fmcgCount(listing));
        List<DrugSummary> drugs;
        List<FmcgSummary> fmcg;
        if (listing.text() == null) {
            drugs = await(later(() -> drugItems(listing)));
            fmcg = await(later(() -> fmcgItems(listing)));
        } else {
            LabelHits labels = labelHits(listing.text());
            int offset = (listing.page() - 1) * listing.size();
            int needed = offset + listing.size();
            String pattern = CatalogRules.containsPattern(listing.text());
            List<DrugSummary> drugRows = new ArrayList<>();
            List<FmcgSummary> fmcgRows = new ArrayList<>();
            if (listing.text().length() < 3) {
                List<CompletableFuture<List<DrugSummary>>> drugAnchorTasks =
                        drugAnchors(listing.text(), pattern, listing, needed, labels);
                List<CompletableFuture<List<FmcgSummary>>> fmcgAnchorTasks =
                        fmcgAnchors(listing.text(), pattern, listing, needed, labels);
                List<DrugSummary> drugAnchor = awaitAll(drugAnchorTasks);
                List<FmcgSummary> fmcgAnchor = awaitAll(fmcgAnchorTasks);
                drugRows.addAll(drugAnchor);
                fmcgRows.addAll(fmcgAnchor);
                List<CompletableFuture<List<DrugSummary>>> drugSecondaryTasks =
                        drugSecondary(listing.text(), pattern, listing, needed, labels, drugCutoff(drugAnchor, needed));
                List<CompletableFuture<List<FmcgSummary>>> fmcgSecondaryTasks =
                        fmcgSecondary(listing.text(), pattern, listing, needed, labels, fmcgCutoff(fmcgAnchor, needed));
                drugRows.addAll(awaitAll(drugSecondaryTasks));
                fmcgRows.addAll(awaitAll(fmcgSecondaryTasks));
            } else {
                List<CompletableFuture<List<DrugSummary>>> drugTasks =
                        new ArrayList<>(drugAnchors(listing.text(), pattern, listing, needed, labels));
                drugTasks.addAll(drugSecondary(listing.text(), pattern, listing, needed, labels, null));
                List<CompletableFuture<List<FmcgSummary>>> fmcgTasks =
                        new ArrayList<>(fmcgAnchors(listing.text(), pattern, listing, needed, labels));
                fmcgTasks.addAll(fmcgSecondary(listing.text(), pattern, listing, needed, labels, null));
                drugRows.addAll(awaitAll(drugTasks));
                fmcgRows.addAll(awaitAll(fmcgTasks));
            }
            drugs = window(drugRows, DRUG_ORDER, offset, listing.size());
            fmcg = window(fmcgRows, FMCG_ORDER, offset, listing.size());
        }
        return new CatalogDocuments.CatalogList(
                new CatalogDocuments.SummaryPage<>(drugs, listing.page(), listing.size(), await(drugCount)),
                new CatalogDocuments.SummaryPage<>(fmcg, listing.page(), listing.size(), await(fmcgCount)));
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
            DrugDetail saved = transactions.execute(status -> {
                insertDrug(draft);
                insertDrugChildren(draft);
                return requireDrug(draft.productId());
            });
            forgetDrugs();
            return saved;
        } catch (DuplicateKeyException exception) {
            throw new CatalogConflict();
        }
    }

    @Override
    public DrugDetail updateDrug(DrugDetail draft) {
        DrugDetail saved = transactions.execute(status -> {
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
        forgetDrugs();
        return saved;
    }

    @Override
    public FmcgDetail createFmcg(FmcgDetail draft) {
        try {
            FmcgDetail saved = transactions.execute(status -> {
                insertFmcg(draft);
                insertFmcgChildren(draft);
                return requireFmcg(draft.productId());
            });
            forgetFmcg();
            return saved;
        } catch (DuplicateKeyException exception) {
            throw new CatalogConflict();
        }
    }

    @Override
    public FmcgDetail updateFmcg(FmcgDetail draft) {
        FmcgDetail saved = transactions.execute(status -> {
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
        forgetFmcg();
        return saved;
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

    private List<DrugSummary> drugItems(CatalogRules.Listing listing) {
        if (!listing.includeDrugs()) {
            return List.of();
        }
        return drugSlice(listing);
    }

    private List<FmcgSummary> fmcgItems(CatalogRules.Listing listing) {
        if (!listing.includeFmcg()) {
            return List.of();
        }
        return fmcgSlice(listing);
    }

    private List<CompletableFuture<List<DrugSummary>>> drugAnchors(
            String text, String pattern, CatalogRules.Listing listing, int needed, LabelHits labels) {
        if (listing != null && !listing.includeDrugs()) {
            return List.of();
        }
        List<CompletableFuture<List<DrugSummary>>> parts = new ArrayList<>();
        parts.add(later(() -> drugLabelUnion(text, listing, needed, labels)));
        if (!labels.drugAnchored() || text.length() >= 3) {
            parts.add(later(() -> containsDrugs("product_name", text, pattern, listing, needed, null)));
        }
        return parts;
    }

    private List<CompletableFuture<List<DrugSummary>>> drugSecondary(
            String text, String pattern, CatalogRules.Listing listing, int needed, LabelHits labels, String cutoff) {
        if (listing != null && !listing.includeDrugs()) {
            return List.of();
        }
        List<CompletableFuture<List<DrugSummary>>> parts = new ArrayList<>();
        if (labels.drugAnchored() && text.length() < 3) {
            parts.add(later(() -> containsDrugs("product_name", text, pattern, listing, needed, cutoff)));
        }
        parts.add(later(() -> containsDrugs("display_name", text, pattern, listing, needed, cutoff)));
        parts.add(later(() -> containsDrugs("marketer_name", text, pattern, listing, needed, cutoff)));
        return parts;
    }

    private List<CompletableFuture<List<FmcgSummary>>> fmcgAnchors(
            String text, String pattern, CatalogRules.Listing listing, int needed, LabelHits labels) {
        if (listing != null && !listing.includeFmcg()) {
            return List.of();
        }
        List<CompletableFuture<List<FmcgSummary>>> parts = new ArrayList<>();
        parts.add(later(() -> fmcgLabelUnion(text, listing, needed, labels)));
        if (!labels.fmcgAnchored() || text.length() >= 3) {
            parts.add(later(() -> containsFmcg("product_name", text, pattern, listing, needed, null)));
        }
        return parts;
    }

    private List<CompletableFuture<List<FmcgSummary>>> fmcgSecondary(
            String text, String pattern, CatalogRules.Listing listing, int needed, LabelHits labels, String cutoff) {
        if (listing != null && !listing.includeFmcg()) {
            return List.of();
        }
        List<CompletableFuture<List<FmcgSummary>>> parts = new ArrayList<>();
        if (labels.fmcgAnchored() && text.length() < 3) {
            parts.add(later(() -> containsFmcg("product_name", text, pattern, listing, needed, cutoff)));
        }
        parts.add(later(() -> containsFmcg("display_name", text, pattern, listing, needed, cutoff)));
        parts.add(later(() -> containsFmcg("marketer_name", text, pattern, listing, needed, cutoff)));
        parts.add(later(() -> containsFmcg("marketing_company", text, pattern, listing, needed, cutoff)));
        return parts;
    }

    private List<DrugSummary> containsDrugs(
            String column, String query, String pattern, CatalogRules.Listing listing, int needed, String cutoff) {
        if (!"product_name".equals(column) && query.length() >= 3) {
            return trigramDrugs(column, pattern, listing, needed, 0);
        }
        if ("product_name".equals(column) && cutoff == null && query.length() >= 3) {
            return race(
                    () -> drugBranch(
                            containsPredicate(column, null),
                            listing,
                            true,
                            needed,
                            NAME_HEAD_START_MILLIS,
                            spec -> spec.param("pattern", pattern)),
                    () -> trigramDrugs(column, pattern, listing, needed, 400));
        }
        return drugBranch(
                containsPredicate(column, cutoff),
                listing,
                true,
                needed,
                0,
                spec -> bindContains(spec, pattern, cutoff));
    }

    private List<FmcgSummary> containsFmcg(
            String column, String query, String pattern, CatalogRules.Listing listing, int needed, String cutoff) {
        if (!"product_name".equals(column) && query.length() >= 3) {
            return trigramFmcg(column, pattern, listing, needed, 0);
        }
        if ("product_name".equals(column) && cutoff == null && query.length() >= 3) {
            return race(
                    () -> fmcgBranch(
                            containsPredicate(column, null),
                            listing,
                            true,
                            needed,
                            NAME_HEAD_START_MILLIS,
                            spec -> spec.param("pattern", pattern)),
                    () -> trigramFmcg(column, pattern, listing, needed, 400));
        }
        return fmcgBranch(
                containsPredicate(column, cutoff),
                listing,
                true,
                needed,
                0,
                spec -> bindContains(spec, pattern, cutoff));
    }

    private static String containsPredicate(String column, String cutoff) {
        String predicate = column + " ILIKE :pattern ESCAPE '\\'";
        if (cutoff != null) {
            return predicate + " AND product_name <= :cutoff";
        }
        return predicate;
    }

    private static void bindContains(JdbcClient.StatementSpec spec, String pattern, String cutoff) {
        spec.param("pattern", pattern);
        if (cutoff != null) {
            spec.param("cutoff", cutoff);
        }
    }

    private List<DrugSummary> drugLabelUnion(String text, CatalogRules.Listing listing, int needed, LabelHits labels) {
        List<String> arms = new ArrayList<>();
        List<Consumer<JdbcClient.StatementSpec>> binds = new ArrayList<>();
        arms.add(drugArm("product_id = :id", listing));
        int index = 0;
        for (String form : labels.drugForms()) {
            String param = "labelForm" + index++;
            arms.add(drugArm("lower(product_form) = :" + param, listing));
            binds.add(spec -> spec.param(param, form));
        }
        for (String type : labels.drugTypes()) {
            String param = "labelType" + index++;
            arms.add(drugArm("lower(medicine_type) = :" + param, listing));
            binds.add(spec -> spec.param(param, type));
        }
        return drugBranch(
                null,
                listing,
                !labels.drugForms().isEmpty() || !labels.drugTypes().isEmpty(),
                needed,
                0,
                spec -> {
                    spec.param("id", text);
                    binds.forEach(bind -> bind.accept(spec));
                },
                String.join(" UNION ALL ", arms));
    }

    private List<FmcgSummary> fmcgLabelUnion(String text, CatalogRules.Listing listing, int needed, LabelHits labels) {
        List<String> arms = new ArrayList<>();
        List<Consumer<JdbcClient.StatementSpec>> binds = new ArrayList<>();
        arms.add(fmcgArm("product_id = :id", listing));
        int index = 0;
        for (String form : labels.fmcgForms()) {
            String param = "labelForm" + index++;
            arms.add(fmcgArm("lower(product_form) = :" + param, listing));
            binds.add(spec -> spec.param(param, form));
        }
        for (String type : labels.fmcgTypes()) {
            String param = "labelType" + index++;
            arms.add(fmcgArm("lower(type) = :" + param, listing));
            binds.add(spec -> spec.param(param, type));
        }
        return fmcgBranch(
                null,
                listing,
                !labels.fmcgForms().isEmpty() || !labels.fmcgTypes().isEmpty(),
                needed,
                0,
                spec -> {
                    spec.param("id", text);
                    binds.forEach(bind -> bind.accept(spec));
                },
                String.join(" UNION ALL ", arms));
    }

    private static String drugArm(String predicate, CatalogRules.Listing listing) {
        return "(SELECT " + DRUG_COLUMNS + " FROM drugs WHERE " + predicate + drugFilters(listing)
                + " ORDER BY product_name ASC, product_id ASC LIMIT :needed)";
    }

    private static String fmcgArm(String predicate, CatalogRules.Listing listing) {
        return "(SELECT " + FMCG_COLUMNS + " FROM otc_fmcg WHERE " + predicate + fmcgFilters(listing)
                + " ORDER BY product_name ASC NULLS LAST, product_id ASC LIMIT :needed)";
    }

    private List<DrugSummary> trigramDrugs(
            String column, String pattern, CatalogRules.Listing listing, int needed, int timeoutMillis) {
        String sql = "SELECT " + DRUG_COLUMNS + " FROM drugs WHERE " + column + " ILIKE :pattern ESCAPE '\\'"
                + drugFilters(listing)
                + " ORDER BY product_name ASC, product_id ASC LIMIT :needed";
        List<DrugSummary> rows = transactions.execute(status -> {
            limit(timeoutMillis);
            trigramPlan();
            JdbcClient.StatementSpec spec =
                    jdbc.sql(sql).param("needed", needed).param("pattern", pattern);
            bindFilters(spec, listing, true);
            return spec.query((rs, row) -> drugSummary(rs)).list();
        });
        return rows == null ? List.of() : rows;
    }

    private List<FmcgSummary> trigramFmcg(
            String column, String pattern, CatalogRules.Listing listing, int needed, int timeoutMillis) {
        String sql = "SELECT " + FMCG_COLUMNS + " FROM otc_fmcg WHERE " + column + " ILIKE :pattern ESCAPE '\\'"
                + fmcgFilters(listing)
                + " ORDER BY product_name ASC NULLS LAST, product_id ASC LIMIT :needed";
        List<FmcgSummary> rows = transactions.execute(status -> {
            limit(timeoutMillis);
            trigramPlan();
            JdbcClient.StatementSpec spec =
                    jdbc.sql(sql).param("needed", needed).param("pattern", pattern);
            bindFilters(spec, listing, false);
            return spec.query((rs, row) -> fmcgSummary(rs)).list();
        });
        return rows == null ? List.of() : rows;
    }

    private List<DrugSummary> drugBranch(
            String predicate,
            CatalogRules.Listing listing,
            boolean ordered,
            int needed,
            int timeoutMillis,
            Consumer<JdbcClient.StatementSpec> extra) {
        return drugBranch(predicate, listing, ordered, needed, timeoutMillis, extra, null);
    }

    private List<DrugSummary> drugBranch(
            String predicate,
            CatalogRules.Listing listing,
            boolean ordered,
            int needed,
            int timeoutMillis,
            Consumer<JdbcClient.StatementSpec> extra,
            String sql) {
        String statement = sql == null
                ? "SELECT " + DRUG_COLUMNS + " FROM drugs WHERE " + predicate + drugFilters(listing)
                        + " ORDER BY product_name ASC, product_id ASC LIMIT :needed"
                : sql;
        List<DrugSummary> rows = transactions.execute(status -> {
            publishBackend();
            if (ordered) {
                walkPlan(timeoutMillis);
            }
            JdbcClient.StatementSpec spec = jdbc.sql(statement).param("needed", needed);
            bindFilters(spec, listing, true);
            extra.accept(spec);
            return spec.query((rs, row) -> drugSummary(rs)).list();
        });
        return rows == null ? List.of() : rows;
    }

    private List<FmcgSummary> fmcgBranch(
            String predicate,
            CatalogRules.Listing listing,
            boolean ordered,
            int needed,
            int timeoutMillis,
            Consumer<JdbcClient.StatementSpec> extra) {
        return fmcgBranch(predicate, listing, ordered, needed, timeoutMillis, extra, null);
    }

    private List<FmcgSummary> fmcgBranch(
            String predicate,
            CatalogRules.Listing listing,
            boolean ordered,
            int needed,
            int timeoutMillis,
            Consumer<JdbcClient.StatementSpec> extra,
            String sql) {
        String statement = sql == null
                ? "SELECT " + FMCG_COLUMNS + " FROM otc_fmcg WHERE " + predicate + fmcgFilters(listing)
                        + " ORDER BY product_name ASC NULLS LAST, product_id ASC LIMIT :needed"
                : sql;
        List<FmcgSummary> rows = transactions.execute(status -> {
            publishBackend();
            if (ordered) {
                walkPlan(timeoutMillis);
            }
            JdbcClient.StatementSpec spec = jdbc.sql(statement).param("needed", needed);
            bindFilters(spec, listing, false);
            extra.accept(spec);
            return spec.query((rs, row) -> fmcgSummary(rs)).list();
        });
        return rows == null ? List.of() : rows;
    }

    private List<DrugSummary> drugSlice(CatalogRules.Listing listing) {
        String sql = "SELECT " + DRUG_COLUMNS + " FROM drugs" + drugWhere(listing)
                + " ORDER BY product_name ASC, product_id ASC LIMIT :limit OFFSET :offset";
        return bind(jdbc.sql(sql), listing, true, true)
                .query((rs, row) -> drugSummary(rs))
                .list();
    }

    private List<FmcgSummary> fmcgSlice(CatalogRules.Listing listing) {
        String sql = "SELECT " + FMCG_COLUMNS + " FROM otc_fmcg" + fmcgWhere(listing)
                + " ORDER BY product_name ASC NULLS LAST, product_id ASC LIMIT :limit OFFSET :offset";
        return bind(jdbc.sql(sql), listing, false, true)
                .query((rs, row) -> fmcgSummary(rs))
                .list();
    }

    private int drugCount(CatalogRules.Listing listing) {
        if (!listing.includeDrugs()) {
            return 0;
        }
        if (drugUnfiltered(listing)) {
            return cachedCount(true);
        }
        return count("drugs", drugWhere(listing), listing, true);
    }

    private int fmcgCount(CatalogRules.Listing listing) {
        if (!listing.includeFmcg()) {
            return 0;
        }
        if (fmcgUnfiltered(listing)) {
            return cachedCount(false);
        }
        return count("otc_fmcg", fmcgWhere(listing), listing, false);
    }

    private int cachedCount(boolean drug) {
        int generation;
        synchronized (counts) {
            Integer value = drug ? drugTotal : fmcgTotal;
            long at = drug ? drugTotalAt : fmcgTotalAt;
            if (value != null && System.currentTimeMillis() - at < COUNT_TTL_MILLIS) {
                return value;
            }
            generation = drug ? drugGeneration : fmcgGeneration;
        }
        int total = tableCount(drug ? "drugs" : "otc_fmcg");
        synchronized (counts) {
            int current = drug ? drugGeneration : fmcgGeneration;
            if (current == generation) {
                if (drug) {
                    drugTotal = total;
                    drugTotalAt = System.currentTimeMillis();
                } else {
                    fmcgTotal = total;
                    fmcgTotalAt = System.currentTimeMillis();
                }
                return total;
            }
            Integer fresh = drug ? drugTotal : fmcgTotal;
            return fresh == null ? total : fresh;
        }
    }

    private int tableCount(String table) {
        Integer total = transactions.execute(status -> {
            jdbc.sql("SELECT set_config('enable_seqscan', 'off', true)")
                    .query(String.class)
                    .single();
            return jdbc.sql("SELECT count(*) FROM " + table)
                    .query((rs, row) -> rs.getInt(1))
                    .single();
        });
        return total == null ? 0 : total;
    }

    private void forgetDrugs() {
        synchronized (counts) {
            drugTotal = null;
            drugGeneration++;
        }
    }

    private void forgetFmcg() {
        synchronized (counts) {
            fmcgTotal = null;
            fmcgGeneration++;
        }
    }

    private LabelHits labelHits(String query) {
        String prefix = query.toLowerCase(Locale.ROOT);
        CompletableFuture<List<String>> drugForms = later(() -> labels("drugs", "product_form", prefix));
        CompletableFuture<List<String>> drugTypes = later(() -> labels("drugs", "medicine_type", prefix));
        CompletableFuture<List<String>> fmcgForms = later(() -> labels("otc_fmcg", "product_form", prefix));
        CompletableFuture<List<String>> fmcgTypes = later(() -> labels("otc_fmcg", "type", prefix));
        return new LabelHits(await(drugForms), await(drugTypes), await(fmcgForms), await(fmcgTypes));
    }

    // The form index is ordered by the pattern operators, so the first key is one probe.
    // min() with the default comparison cannot use that index and scans every tablet.
    private List<String> labels(String table, String column, String prefix) {
        String end = prefixEnd(prefix);
        String upper = end == null ? "" : " AND lower(" + column + ") ~<~ :to";
        String sql = "WITH RECURSIVE found AS ("
                + " (SELECT lower(" + column + ") AS value FROM " + table
                + " WHERE lower(" + column + ") ~>=~ :from" + upper
                + " ORDER BY lower(" + column + ") USING ~<~ LIMIT 1)"
                + " UNION ALL"
                + " (SELECT (SELECT lower(" + column + ") FROM " + table
                + " WHERE lower(" + column + ") ~>~ found.value" + upper
                + " ORDER BY lower(" + column + ") USING ~<~ LIMIT 1)"
                + " FROM found WHERE found.value IS NOT NULL)"
                + ") SELECT value FROM found WHERE value IS NOT NULL";
        List<String> values = transactions.execute(status -> {
            JdbcClient.StatementSpec spec = jdbc.sql(sql).param("from", prefix);
            if (end != null) {
                spec.param("to", end);
            }
            return spec.query(String.class).list();
        });
        return values == null ? List.of() : values;
    }

    private static String prefixEnd(String prefix) {
        char[] chars = prefix.toCharArray();
        for (int index = chars.length - 1; index >= 0; index--) {
            if (chars[index] != Character.MAX_VALUE) {
                chars[index]++;
                return new String(chars, 0, index + 1);
            }
        }
        return null;
    }

    private static String drugCutoff(List<DrugSummary> rows, int needed) {
        List<DrugSummary> top = window(rows, DRUG_ORDER, 0, needed);
        if (top.size() < needed) {
            return null;
        }
        return top.get(top.size() - 1).productName();
    }

    private static String fmcgCutoff(List<FmcgSummary> rows, int needed) {
        List<FmcgSummary> top = window(rows, FMCG_ORDER, 0, needed);
        if (top.size() < needed || top.get(top.size() - 1).productName() == null) {
            return null;
        }
        return top.get(top.size() - 1).productName();
    }

    private <T> List<T> race(Supplier<List<T>> walk, Supplier<List<T>> scan) {
        AtomicInteger walkPid = new AtomicInteger();
        CompletableFuture<List<T>> walked = CompletableFuture.supplyAsync(
                () -> {
                    backendSlot.set(walkPid);
                    try {
                        try {
                            return walk.get();
                        } catch (RuntimeException exception) {
                            if (stopped(exception)) {
                                return null;
                            }
                            throw exception;
                        }
                    } finally {
                        backendSlot.remove();
                    }
                },
                partner);
        try {
            List<T> early = walked.get(NAME_HEAD_START_MILLIS, TimeUnit.MILLISECONDS);
            if (early != null) {
                return early;
            }
        } catch (TimeoutException ignored) {
            // The walk is still the active query, so cancelling it cannot hit a later request.
            if (!walked.isDone()) {
                cancelBackend(walkPid.get());
            }
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(exception);
        } catch (ExecutionException exception) {
            Throwable cause = exception.getCause();
            if (cause instanceof RuntimeException runtime) {
                throw runtime;
            }
            throw new IllegalStateException(cause);
        }
        CompletableFuture<List<T>> first = new CompletableFuture<>();
        CompletableFuture<List<T>> scanned = CompletableFuture.supplyAsync(scan::get, partner);
        scanned.whenComplete((rows, error) -> {
            if (error == null) {
                first.complete(rows);
            }
        });
        walked.whenComplete((rows, error) -> {
            if (error != null) {
                first.completeExceptionally(error);
                return;
            }
            if (rows != null) {
                first.complete(rows);
                return;
            }
            scanned.whenComplete((scanRows, scanError) -> {
                if (scanError != null) {
                    first.completeExceptionally(scanError);
                } else {
                    first.complete(scanRows);
                }
            });
        });
        try {
            return first.join();
        } catch (CompletionException wrapped) {
            Throwable cause = wrapped.getCause();
            if (cause instanceof RuntimeException runtime) {
                throw runtime;
            }
            throw wrapped;
        }
    }

    private void publishBackend() {
        AtomicInteger slot = backendSlot.get();
        if (slot == null || slot.get() != 0) {
            return;
        }
        Integer pid = jdbc.sql("SELECT pg_backend_pid()").query(Integer.class).single();
        if (pid != null) {
            slot.set(pid);
        }
    }

    private void cancelBackend(int pid) {
        if (pid == 0) {
            return;
        }
        try {
            transactions.execute(status -> jdbc.sql("SELECT pg_cancel_backend(:pid)")
                    .param("pid", pid)
                    .query(Boolean.class)
                    .single());
        } catch (RuntimeException ignored) {
            // The walk already finished.
        }
    }

    private void limit(int timeoutMillis) {
        if (timeoutMillis <= 0) {
            return;
        }
        jdbc.sql("SELECT set_config('statement_timeout', '" + timeoutMillis + "', true)")
                .query(String.class)
                .single();
    }

    private void walkPlan(int timeoutMillis) {
        String timeout = timeoutMillis > 0 ? ", set_config('statement_timeout', '" + timeoutMillis + "', true)" : "";
        jdbc.sql(
                        "SELECT set_config('enable_bitmapscan', 'off', true) FROM (SELECT set_config('enable_seqscan', 'off', true)"
                                + timeout + ") AS settings")
                .query(String.class)
                .single();
    }

    // ORDER BY product_name would otherwise walk the name index and filter a rare contains match.
    private void trigramPlan() {
        jdbc.sql("SELECT set_config('enable_seqscan', 'off', true) FROM ("
                        + "SELECT set_config('enable_indexscan', 'off', true),"
                        + " set_config('enable_indexonlyscan', 'off', true)) AS settings")
                .query(String.class)
                .single();
    }

    private static boolean stopped(Throwable exception) {
        Throwable current = exception;
        while (current != null) {
            String message = current.getMessage();
            if (message != null) {
                String text = message.toLowerCase(Locale.ROOT);
                if (text.contains("statement timeout") || text.contains("canceling statement")) {
                    return true;
                }
            }
            current = current.getCause();
        }
        return false;
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
            spec.param("id", listing.text())
                    .param("pattern", CatalogRules.containsPattern(listing.text()))
                    .param("prefix", CatalogRules.prefixPattern(listing.text().toLowerCase(Locale.ROOT)));
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
                       OR lower(medicine_type) LIKE :prefix ESCAPE '\\'
                       OR lower(product_form) LIKE :prefix ESCAPE '\\')
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
                       OR lower(type) LIKE :prefix ESCAPE '\\'
                       OR lower(product_form) LIKE :prefix ESCAPE '\\')
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

    private static String drugFilters(CatalogRules.Listing listing) {
        if (listing == null) {
            return "";
        }
        StringBuilder filters = new StringBuilder();
        appendNameAndForm(filters, listing);
        if (listing.prescription() == CatalogRules.Rx.YES) {
            filters.append(" AND prescription_required = true");
        } else if (listing.prescription() == CatalogRules.Rx.NO) {
            filters.append(" AND prescription_required = false");
        }
        if (listing.medicineType() != null) {
            filters.append(" AND medicine_type ILIKE :medicineType ESCAPE '\\'");
        }
        if (listing.marketer() != null) {
            filters.append(" AND marketer_name ILIKE :marketer ESCAPE '\\'");
        }
        return filters.toString();
    }

    private static String fmcgFilters(CatalogRules.Listing listing) {
        if (listing == null) {
            return "";
        }
        StringBuilder filters = new StringBuilder();
        appendNameAndForm(filters, listing);
        if (listing.fmcgType() != null) {
            filters.append(" AND type ILIKE :fmcgType ESCAPE '\\'");
        }
        if (listing.marketer() != null) {
            filters.append(
                    " AND (marketer_name ILIKE :marketer ESCAPE '\\' OR marketing_company ILIKE :marketer ESCAPE '\\')");
        }
        return filters.toString();
    }

    private static JdbcClient.StatementSpec bindFilters(
            JdbcClient.StatementSpec spec, CatalogRules.Listing listing, boolean drug) {
        if (listing == null) {
            return spec;
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
        return spec;
    }

    private static boolean drugUnfiltered(CatalogRules.Listing listing) {
        return listing.text() == null
                && listing.displayName() == CatalogRules.NamePresence.ANY
                && listing.prescription() == CatalogRules.Rx.ANY
                && listing.form() == null
                && listing.medicineType() == null
                && listing.marketer() == null;
    }

    private static boolean fmcgUnfiltered(CatalogRules.Listing listing) {
        return listing.text() == null
                && listing.displayName() == CatalogRules.NamePresence.ANY
                && listing.form() == null
                && listing.fmcgType() == null
                && listing.marketer() == null;
    }

    private static <T> List<T> window(List<T> rows, Comparator<T> order, int offset, int size) {
        Map<String, T> unique = new LinkedHashMap<>();
        for (T row : rows) {
            unique.putIfAbsent(productId(row), row);
        }
        return unique.values().stream().sorted(order).skip(offset).limit(size).toList();
    }

    private static String productId(Object row) {
        if (row instanceof DrugSummary drug) {
            return drug.productId();
        }
        return ((FmcgSummary) row).productId();
    }

    private <T> CompletableFuture<T> later(Supplier<T> query) {
        return CompletableFuture.supplyAsync(query, pool);
    }

    private static <T> List<T> awaitAll(List<CompletableFuture<List<T>>> parts) {
        List<T> rows = new ArrayList<>();
        for (CompletableFuture<List<T>> part : parts) {
            rows.addAll(await(part));
        }
        return rows;
    }

    private static <T> T await(CompletableFuture<T> future) {
        try {
            return future.join();
        } catch (CompletionException exception) {
            Throwable cause = exception.getCause();
            if (cause instanceof RuntimeException runtime) {
                throw runtime;
            }
            throw exception;
        }
    }

    private static Thread readThread(Runnable runnable) {
        Thread thread = new Thread(runnable, "catalog-read");
        thread.setDaemon(true);
        return thread;
    }

    private record LabelHits(
            List<String> drugForms, List<String> drugTypes, List<String> fmcgForms, List<String> fmcgTypes) {

        private boolean drugAnchored() {
            return !drugForms.isEmpty() || !drugTypes.isEmpty();
        }

        private boolean fmcgAnchored() {
            return !fmcgForms.isEmpty() || !fmcgTypes.isEmpty();
        }
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
