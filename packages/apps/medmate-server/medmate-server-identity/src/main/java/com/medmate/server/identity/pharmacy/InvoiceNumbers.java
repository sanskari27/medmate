package com.medmate.server.identity.pharmacy;

import java.util.UUID;

public interface InvoiceNumbers {

    String prefix(UUID pharmacyId);
}
