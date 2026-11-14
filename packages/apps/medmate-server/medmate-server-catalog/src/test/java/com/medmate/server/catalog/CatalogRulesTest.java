package com.medmate.server.catalog;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

class CatalogRulesTest {

    private final ObjectMapper json = new ObjectMapper();

    @Test
    void searchBoundsAndEscapes() {
        assertThat(CatalogRules.search("a", null).problem()).isEqualTo("Query is not valid");
        assertThat(CatalogRules.search("  crocin ", null).text()).isEqualTo("crocin");
        assertThat(CatalogRules.search("crocin", " ").limit()).isEqualTo(20);
        assertThat(CatalogRules.search("crocin", "80").limit()).isEqualTo(50);
        assertThat(CatalogRules.search("crocin", "0").problem()).isEqualTo("Query is not valid");
        assertThat(CatalogRules.search("crocin", "nope").problem()).isEqualTo("Query is not valid");
        assertThat(CatalogRules.containsPattern("100%_a")).isEqualTo("%100\\%\\_a%");
    }

    @Test
    void idLimitsKeepTheFirstOccurrence() {
        assertThat(CatalogRules.ids(null).problem()).isEqualTo("Product ids are not valid");
        assertThat(CatalogRules.ids(" DR1, DR1, ,DR2 ").ids()).containsExactly("DR1", "DR2");
        assertThat(CatalogRules.ids("x".repeat(81)).problem()).isEqualTo("Product ids are not valid");
        StringBuilder ids = new StringBuilder();
        for (int index = 0; index < 200; index++) {
            if (index > 0) {
                ids.append(',');
            }
            ids.append("DR").append(index);
        }
        assertThat(CatalogRules.ids(ids.toString()).ids()).hasSize(200);
        assertThat(CatalogRules.ids(ids + ",EXTRA").problem()).isEqualTo("Product ids are not valid");
    }

    @Test
    void aDrugAndFmcgBodyKeepChildOrder() throws Exception {
        CatalogRules.ParsedDrug drug = CatalogRules.drug(
                json.readTree(
                        """
                        {
                          "productId": " DR100 ",
                          "productName": " Crocin ",
                          "prescriptionRequired": false,
                          "package": " ",
                          "ingredients": [
                            {"name": "Paracetamol", "strength": "500 mg"},
                            {"name": "Caffeine"}
                          ]
                        }
                        """),
                null);
        assertThat(drug.problem()).isNull();
        assertThat(drug.draft().productId()).isEqualTo("DR100");
        assertThat(drug.draft().productName()).isEqualTo("Crocin");
        assertThat(drug.draft().packageName()).isNull();
        assertThat(drug.draft().ingredients())
                .extracting(CatalogDocuments.DrugIngredient::name)
                .containsExactly("Paracetamol", "Caffeine");

        CatalogRules.ParsedFmcg fmcg = CatalogRules.fmcg(
                json.readTree(
                        """
                        {"productId":"OTC1","productName":"Soap","categories":["Skin","Bath"]}
                        """),
                "OTC1");
        assertThat(fmcg.problem()).isNull();
        assertThat(fmcg.draft().categories()).containsExactly("Skin", "Bath");
    }

    @Test
    void aMissingChildFieldOrMismatchedIdIsRejected() throws Exception {
        CatalogRules.ParsedDrug missing = CatalogRules.drug(
                json.readTree(
                        """
                        {"productId":"DR100","productName":"Crocin","prescriptionRequired":false,"ingredients":[{}]}
                        """),
                null);
        assertThat(missing.problem()).isEqualTo("Product is not valid");
        assertThat(missing.draft()).isNull();

        CatalogRules.ParsedDrug mismatched = CatalogRules.drug(
                json.readTree(
                        """
                        {"productId":"DR100","productName":"Crocin","prescriptionRequired":true}
                        """),
                "DR200");
        assertThat(mismatched.problem()).isEqualTo("Product is not valid");

        CatalogRules.ParsedFmcg unnamed = CatalogRules.fmcg(json.readTree("{\"productId\":\"OTC1\"}"), null);
        assertThat(unnamed.problem()).isEqualTo("Product is not valid");
    }

    @Test
    void aBlankDisplayNameIsStoredAsNull() throws Exception {
        CatalogRules.ParsedDrug drug = CatalogRules.drug(
                json.readTree(
                        """
                        {"productId":"DR100","productName":"Crocin","displayName":"  ","prescriptionRequired":false}
                        """),
                null);
        assertThat(drug.problem()).isNull();
        assertThat(drug.draft().displayName()).isNull();
    }

    @Test
    void listFiltersClearTheOtherCatalog() {
        CatalogRules.Listing open = CatalogRules.list(null, null, "missing", null, null, null, null, null, null, null);
        assertThat(open.problem()).isNull();
        assertThat(open.displayName()).isEqualTo(CatalogRules.NamePresence.MISSING);
        assertThat(open.kind()).isEqualTo(CatalogRules.Kind.BOTH);
        assertThat(open.page()).isEqualTo(1);
        assertThat(open.size()).isEqualTo(25);
        assertThat(open.includeDrugs()).isTrue();
        assertThat(open.includeFmcg()).isTrue();

        CatalogRules.Listing prescription =
                CatalogRules.list("both", "  ", null, "yes", null, null, null, null, "1", "25");
        assertThat(prescription.text()).isNull();
        assertThat(prescription.includeDrugs()).isTrue();
        assertThat(prescription.includeFmcg()).isFalse();

        CatalogRules.Listing bothEnds =
                CatalogRules.list("drug", null, null, "no", null, "tablet", "soap", null, "2", "10");
        assertThat(bothEnds.includeDrugs()).isFalse();
        assertThat(bothEnds.includeFmcg()).isFalse();

        assertThat(CatalogRules.list("nope", null, null, null, null, null, null, null, null, null)
                        .problem())
                .isEqualTo("Filter is not valid");
        assertThat(CatalogRules.list(null, "x".repeat(81), null, null, null, null, null, null, null, null)
                        .problem())
                .isEqualTo("Query is not valid");
        assertThat(CatalogRules.list(null, null, null, null, "y".repeat(81), null, null, null, null, null)
                        .problem())
                .isEqualTo("Filter is not valid");
        assertThat(CatalogRules.list(null, null, null, null, null, null, null, null, "0", "25")
                        .problem())
                .isEqualTo("Page is not valid");
    }
}
