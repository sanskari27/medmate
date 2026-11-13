package com.medmate.server.shared.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.catchThrowable;

import com.medmate.server.shared.error.ApiProblem;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

class PageQueryTest {

    @Test
    void defaultsTheFirstPage() {
        PageQuery page = PageQuery.parse(null, null);
        assertThat(page.page()).isEqualTo(1);
        assertThat(page.size()).isEqualTo(25);
        assertThat(page.offset()).isZero();
    }

    @Test
    void readsALaterPage() {
        PageQuery page = PageQuery.parse("2", "10");
        assertThat(page.offset()).isEqualTo(10);
    }

    @Test
    void rejectsABlankZeroOrOversizedValue() {
        assertThatThrownBy(() -> PageQuery.parse(" ", "25"))
                .isInstanceOf(ApiProblem.class)
                .hasMessage("Page is not valid");
        assertThatThrownBy(() -> PageQuery.parse("0", "25")).isInstanceOf(ApiProblem.class);
        assertThatThrownBy(() -> PageQuery.parse("1", "0")).isInstanceOf(ApiProblem.class);
        assertThatThrownBy(() -> PageQuery.parse("1", "101")).isInstanceOf(ApiProblem.class);
        assertThatThrownBy(() -> PageQuery.parse("1", "nope")).isInstanceOf(ApiProblem.class);
        Throwable thrown = catchThrowable(() -> PageQuery.parse("-1", null));
        assertThat(thrown).isInstanceOf(ApiProblem.class);
        assertThat(((ApiProblem) thrown).status()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void escapesALikeNeedle() {
        assertThat(PageQuery.like(null)).isEmpty();
        assertThat(PageQuery.like("  ")).isEmpty();
        assertThat(PageQuery.like("50%_a\\b")).isEqualTo("%50\\%\\_a\\\\b%");
        assertThat(PageQuery.needle("  Crocin ")).isEqualTo("crocin");
    }
}
