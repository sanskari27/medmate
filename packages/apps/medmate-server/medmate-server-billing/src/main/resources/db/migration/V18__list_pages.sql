CREATE INDEX bill_sold ON bill (pharmacy_id, sold_at DESC, number DESC);

CREATE INDEX sale_return_recorded ON sale_return (pharmacy_id, recorded_at DESC, code DESC);

CREATE INDEX purchase_return_recorded ON purchase_return (pharmacy_id, recorded_at DESC, code DESC);

CREATE INDEX inventory_product_name ON inventory_product (pharmacy_id, name, product_id);

CREATE INDEX pharmacy_submitted ON pharmacy (verification_status, submitted_at, id);

CREATE INDEX pharmacy_name ON pharmacy (lower(name), id);
