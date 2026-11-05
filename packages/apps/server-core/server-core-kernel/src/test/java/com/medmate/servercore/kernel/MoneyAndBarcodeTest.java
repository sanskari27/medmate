package com.medmate.servercore.kernel;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import org.junit.jupiter.api.Test;

class MoneyAndBarcodeTest {
    @Test
    void rupeesBecomePaiseOnTheWire() {
        var node = JsonNodeFactory.instance.objectNode().put("mrp", 12.5);
        assertEquals(1250, MoneyCodec.toPaise(node).path("mrp").asInt());
        assertEquals(12.5, MoneyCodec.fromPaise(MoneyCodec.toPaise(node)).path("mrp").asDouble());
    }

    @Test
    void code128EncodesZero() {
        assertEquals("1101001000010011101100100111001101100011101011", Code128.bits("0"));
    }

    @Test
    void productBarcodeUsesTheId() {
        assertEquals("NMp1", StockMath.productBarcode("p1"));
        assertTrue(StockMath.batchBarcode("p1", "B1").startsWith("890"));
    }
}
