# Inventory low stock

## Context

The inventory screen treats low stock as a quantity at or below a reorder level, and the product dialog shows and edits that level. Purchases still store a reorder level, and the server route that updates it stays. This change is only how the dispensary inventory screen decides and shows low stock. The API is unchanged from [Pharmacy purchases and inventory](../../medmate-server/requirements/2026-11-12-pharmacy-purchases-and-inventory.md).

## Scope

- The dispensary inventory table, filters, low-stock card, and product dialog.
- Low stock from cost value.
- Composition text in the main inventory table.
- Purchase history shown only on the Batches tab.
- Batch rows with quantity zero omitted from the Batches tab.

## Non-goals

- The medmate-server stock module, `PATCH /pharmacy/inventory/{productId}`, the `reorder_level` column, and the default reorder level on a new product.
- Removing `inventory:update` from the catalog or the Manage Users dialog.
- The admin portal, the pharmacy app, purchases, and distributors.

## Behavior

Low stock is a product with quantity above zero whose cost value is under ₹1,000. Cost value is rate × quantity across batches, the same figure as the Value column. The comparison uses the rounded rupee that column shows, so a cost that displays as ₹1,000 is not low. Out of stock stays quantity zero and is not also low. The Low stock filter, the gold stock figure, and the Low and out of stock card use this rule. The card still adds low and out, and its hint is still the out-of-stock count.

The product dialog no longer shows a reorder level, an input, or Save reorder level, including for an owner and for a staff member with `inventory:update`. The low-stock badge reads `Low stock — value under ₹1,000`. The out-of-stock badge stays `Out of stock — reorder now`. The screen does not call the reorder update.

In the main table, the composition under the product name is at most 50 characters. A longer composition is cut after the 50th character, with no ellipsis. The marketer still follows that text. Search and the product dialog use the full composition.

The dialog opens on Details. That tab shows product details only. Purchase history is inside the Batches tab, under the batch table. It still lists that medicine's purchase and return lines from `GET /pharmacy/purchases?productId=`, and choosing one still opens `/purchases/:id`.

The Batches tab lists only batches with quantity above zero. A batch with quantity zero is not a row. The product stays on the inventory list, including under Out of stock, when every batch has quantity zero. The batch count, expiry, and MRP on the main table already use batches with quantity above zero.

## Acceptance criteria

- A product with quantity above zero and a rounded cost under ₹1,000 is low stock. A product whose rounded cost is ₹1,000 or more is not, even when its quantity is at or below the stored reorder level. A product with no quantity is out of stock only.
- The product dialog has no reorder level for a staff member with `inventory:update`. Export is still absent without `inventory:export`.
- A composition longer than 50 characters shows 50 characters in the table and the full composition in the dialog.
- Details does not show Purchase history. Batches shows it under the batch table. A batch with quantity zero is absent there. The product remains on the inventory list.

## Tests

- `model.test.ts` for low stock from rounded cost, out of stock excluded from low, and composition cut at 50 characters.
- `InventoryPage.test.tsx` for the five cards, the four filters, reorder absent with `inventory:update`, export hidden without `inventory:export`, the batches tab, a high-quantity row under ₹1,000 in the Low stock filter, a long composition truncated in the table, purchase history absent on Details and present on Batches, and a zero-quantity batch absent from Batches.
