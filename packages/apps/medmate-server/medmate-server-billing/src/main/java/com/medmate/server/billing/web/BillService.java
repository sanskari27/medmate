package com.medmate.server.billing.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.server.billing.BillRules;
import com.medmate.server.billing.store.BillStore;
import com.medmate.server.identity.access.Access;
import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.identity.pharmacy.InvoiceNumbers;
import com.medmate.server.offers.ActiveOffers;
import com.medmate.server.shared.error.ApiProblem;
import com.medmate.server.stock.CounterStock;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Profile({"local", "prod", "identity-it"})
public class BillService {

    static final ZoneId ZONE = ZoneId.of("Asia/Kolkata");

    private final BillStore bills;
    private final CounterStock stock;
    private final ActiveOffers offers;
    private final InvoiceNumbers numbers;

    public BillService(BillStore bills, CounterStock stock, ActiveOffers offers, InvoiceNumbers numbers) {
        this.bills = bills;
        this.stock = stock;
        this.offers = offers;
        this.numbers = numbers;
    }

    @Transactional
    public BillViews.OneResponse create(AccountPrincipal actor, JsonNode body) {
        require(actor, BillRules.CREATE, "Bills cannot be created");
        UUID pharmacyId = actor.pharmacyId();
        if (!stock.lockPharmacy(pharmacyId)) {
            throw missingPharmacy();
        }
        BillRules.Prepared prepared = BillRules.prepare(body);
        if (prepared.problem() != null) {
            throw problem(prepared.problem());
        }
        BillRules.Priced priced = BillRules.price(
                prepared.request(), stockLines(pharmacyId), offerLines(pharmacyId), YearMonth.now(ZONE));
        if (priced.problem() != null) {
            throw problem(priced.problem());
        }
        for (BillRules.PricedLine line : priced.lines()) {
            if (!stock.decrement(pharmacyId, line.productId(), line.batchNo(), line.qty())) {
                throw problem("Not enough stock");
            }
        }
        String number = BillRules.number(numbers.prefix(pharmacyId), bills.allocate(pharmacyId));
        Instant soldAt = Instant.now();
        bills.insert(
                pharmacyId,
                number,
                prepared.request().patientName(),
                prepared.request().patientPhone(),
                priced.prescribedBy(),
                priced.prescriptionNumber(),
                soldAt,
                priced.subtotal(),
                priced.discount(),
                priced.payable(),
                priced.extraType(),
                priced.extraValue(),
                priced.extraAmount());
        int position = 0;
        List<BillViews.LineView> lines = new ArrayList<>();
        for (BillRules.PricedLine line : priced.lines()) {
            bills.insertLine(pharmacyId, number, position, line);
            lines.add(lineView(line));
            position++;
        }
        return new BillViews.OneResponse(new BillViews.BillView(
                number,
                prepared.request().patientName(),
                prepared.request().patientPhone(),
                priced.prescribedBy(),
                priced.prescriptionNumber(),
                "cash",
                soldAt,
                money(priced.subtotal()),
                money(priced.discount()),
                money(priced.payable()),
                priced.extraType(),
                money(priced.extraValue()),
                money(priced.extraAmount()),
                lines));
    }

    private List<BillRules.StockLine> stockLines(UUID pharmacyId) {
        List<BillRules.StockLine> lines = new ArrayList<>();
        for (CounterStock.Batch batch : stock.batches(pharmacyId)) {
            lines.add(new BillRules.StockLine(
                    batch.productId(),
                    batch.name(),
                    batch.composition(),
                    batch.prescriptionRequired(),
                    batch.batchNo(),
                    batch.expiry(),
                    batch.qty(),
                    batch.mrp(),
                    batch.gst()));
        }
        return lines;
    }

    private List<BillRules.Offer> offerLines(UUID pharmacyId) {
        List<BillRules.Offer> lines = new ArrayList<>();
        for (ActiveOffers.Discount discount : offers.list(pharmacyId)) {
            lines.add(new BillRules.Offer(
                    discount.id(),
                    discount.title(),
                    discount.type(),
                    discount.value(),
                    discount.scope(),
                    discount.target()));
        }
        return lines;
    }

    private static BillViews.LineView lineView(BillRules.PricedLine line) {
        return new BillViews.LineView(
                line.productId(),
                line.name(),
                line.composition(),
                line.batchNo(),
                line.expiry(),
                line.qty(),
                money(line.mrp()),
                money(line.unitPrice()),
                line.gst(),
                line.offerId(),
                line.offerTitle(),
                money(line.discount()));
    }

    private static String money(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private boolean allowed(AccountPrincipal actor, String key) {
        return Access.pharmacy(
                actor.accountType(),
                actor.disabled(),
                actor.pharmacyRole(),
                actor.pharmacyId(),
                actor.pharmacyId(),
                actor.verificationStatus(),
                actor.permissions(),
                key);
    }

    private void require(AccountPrincipal actor, String key, String detail) {
        if (!allowed(actor, key)) {
            throw new ApiProblem(HttpStatus.FORBIDDEN, "Forbidden", detail);
        }
    }

    private static ApiProblem problem(String detail) {
        if ("Batch was not found".equals(detail) || "Pharmacy was not found".equals(detail)) {
            return new ApiProblem(HttpStatus.NOT_FOUND, "Not found", detail);
        }
        if ("Not enough stock".equals(detail)) {
            return new ApiProblem(HttpStatus.CONFLICT, "Conflict", detail);
        }
        return new ApiProblem(HttpStatus.BAD_REQUEST, "Bad request", detail);
    }

    private static ApiProblem missingPharmacy() {
        return new ApiProblem(HttpStatus.NOT_FOUND, "Not found", "Pharmacy was not found");
    }
}
