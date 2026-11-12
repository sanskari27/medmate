package com.medmate.server.stock;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class HttpMedicineCatalogTest {

    @Test
    void lookupEncodesCommasOnce() {
        RestClient.Builder builder = RestClient.builder().baseUrl("https://medicine-data.test");
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        server.expect((request) -> assertThat(decodedIds(request.getURI().getRawQuery()))
                        .isEqualTo("DRS091817,DRS074347,DR077268"))
                .andRespond(withSuccess(
                        """
                        {"drug":[{"productId":"DRS091817","productName":"Dolo 650 Tablet","mrp":22.84}],"fmcg":[],"missing":[]}
                        """,
                        MediaType.APPLICATION_JSON));

        MedicineCatalog.Lookup lookup = new HttpMedicineCatalog(builder.build(), new ObjectMapper())
                .lookup(List.of("DRS091817", "DRS074347", "DR077268"));

        server.verify();
        assertThat(lookup.products())
                .extracting(MedicineCatalog.Snapshot::productId)
                .containsExactly("DRS091817");
        assertThat(lookup.missing()).isEmpty();
    }

    @Test
    void lookupDoesNotDoubleEncodeALongIdList() {
        RestClient.Builder builder = RestClient.builder().baseUrl("https://medicine-data.test");
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        List<String> ids = List.of(
                "DRS091817",
                "DRS074347",
                "DRS033955",
                "DRS232735",
                "DRS192698",
                "DRS136695",
                "DRS280880",
                "DR036431",
                "DR077268");
        server.expect((request) -> {
                    assertThat(request.getURI().getRawQuery()).doesNotContain("%252C");
                    assertThat(decodedIds(request.getURI().getRawQuery())).isEqualTo(String.join(",", ids));
                })
                .andRespond(withSuccess("{\"drug\":[],\"fmcg\":[],\"missing\":[]}", MediaType.APPLICATION_JSON));

        new HttpMedicineCatalog(builder.build(), new ObjectMapper()).lookup(ids);

        server.verify();
    }

    private static String decodedIds(String rawQuery) {
        String decoded = URLDecoder.decode(rawQuery, StandardCharsets.UTF_8);
        return decoded.startsWith("ids=") ? decoded.substring(4) : decoded;
    }
}
