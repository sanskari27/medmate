ALTER TABLE inventory_product
    ADD COLUMN prescription_required BOOLEAN;

ALTER TABLE inventory_batch
    ADD COLUMN gst INTEGER,
    ADD CONSTRAINT inventory_batch_gst CHECK (gst IS NULL OR gst IN (0, 5, 12, 18));

UPDATE inventory_batch AS batch
SET gst = source.gst
FROM (
    SELECT DISTINCT ON (line.pharmacy_id, line.product_id, line.batch_no)
        line.pharmacy_id,
        line.product_id,
        line.batch_no,
        line.gst
    FROM purchase_line AS line
    JOIN purchase ON purchase.pharmacy_id = line.pharmacy_id AND purchase.code = line.purchase_code
    ORDER BY line.pharmacy_id, line.product_id, line.batch_no, purchase.recorded_at DESC, line.position DESC
) AS source
WHERE batch.pharmacy_id = source.pharmacy_id
  AND batch.product_id = source.product_id
  AND batch.batch_no = source.batch_no
  AND batch.gst IS NULL;
