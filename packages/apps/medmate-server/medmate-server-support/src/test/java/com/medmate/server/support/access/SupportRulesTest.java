package com.medmate.server.support.access;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.UUID;
import org.junit.jupiter.api.Test;

class SupportRulesTest {

    private final UUID assignee = UUID.fromString("00000000-0000-4000-8000-000000000201");

    @Test
    void ticketKeepsTheCategoryAndTheFirstMessage() {
        SupportRules.Opened opened = SupportRules.open("ticket", "  GST rate  ", "Billing", "  One line is wrong.  ");

        assertThat(opened.subject()).isEqualTo("GST rate");
        assertThat(opened.category()).isEqualTo("Billing");
        assertThat(opened.firstMessage()).isEqualTo("One line is wrong.");
    }

    @Test
    void blankTicketDetailsDoNotCreateAMessageAndChatIgnoresTheCategory() {
        SupportRules.Opened ticket = SupportRules.open("ticket", "Stock", "Inventory", "  ");
        SupportRules.Opened chat = SupportRules.open("chat", "Need a person", "Billing", "ignore me");

        assertThat(ticket.firstMessage()).isNull();
        assertThat(chat.category()).isEqualTo("Live chat");
        assertThat(chat.firstMessage()).isNull();
    }

    @Test
    void unknownCategoryAndBlankSubjectAreRejected() {
        assertThatThrownBy(() -> SupportRules.open("ticket", "GST", "Shipping", null))
                .isInstanceOf(SupportProblem.class)
                .hasMessage("Category is not recognised.");
        assertThatThrownBy(() -> SupportRules.open("chat", "  ", null, null))
                .isInstanceOf(SupportProblem.class)
                .hasMessage("Subject is required.");
    }

    @Test
    void claimOpensTheCaseAndASecondClaimConflicts() {
        SupportRules.Phase waiting = new SupportRules.Phase(SupportRules.Status.WAITING, null);
        SupportRules.Phase open = SupportRules.claim(waiting, assignee);

        assertThat(open.status()).isEqualTo(SupportRules.Status.OPEN);
        assertThat(open.assigneeId()).isEqualTo(assignee);
        assertThatThrownBy(() -> SupportRules.claim(open, UUID.randomUUID()))
                .isInstanceOf(SupportProblem.class)
                .hasMessage("This chat has already been picked up.");
    }

    @Test
    void replyLeavesTheAssigneeUnchangedUntilResolve() {
        SupportRules.Phase waiting = new SupportRules.Phase(SupportRules.Status.WAITING, null);
        SupportRules.Phase open = SupportRules.claim(waiting, assignee);

        assertThat(SupportRules.reply(waiting)).isEqualTo(waiting);
        assertThat(SupportRules.reply(open)).isEqualTo(open);

        SupportRules.Phase resolved = SupportRules.resolve(open);
        assertThat(resolved.status()).isEqualTo(SupportRules.Status.RESOLVED);
        assertThat(resolved.assigneeId()).isEqualTo(assignee);
        assertThatThrownBy(() -> SupportRules.reply(resolved))
                .isInstanceOf(SupportProblem.class)
                .hasMessage("This chat is already resolved.");
        assertThatThrownBy(() -> SupportRules.resolve(resolved))
                .isInstanceOf(SupportProblem.class)
                .hasMessage("This chat is already resolved.");
    }
}
