# Medicine catalog

## Context

Medicine identity for purchases is read from the Node medicine-data service. That process is the only one that opens the Postgres database `medicine_data`. The dispensary does not call that host. It calls medmate-server, which then calls medicine-data over HTTP. The module boundary is [0027](../decisions/0027-medicine-catalog.md). This does not read the old server-core service.

## Scope

- A new `medmate-server-catalog` module that opens `medicine_data` and applies its schema.
- Anonymous `GET /api/search`, `GET /api/products`, and `GET /api/products/{productId}`.
- `POST` and `PUT` for a whole drug or FMCG product, for a platform admin or sales staff.
- Stock reads the catalog through JDBC and no longer calls medicine-data.

## Non-goals

- Deleting a product, a pharmacy permission key, or a change to `PharmacyPermissions`.
- An admin or dispensary screen.
- Merging `medicine_data` into `medmate_server`.
- Retiring the Node app, its host, or its Terraform.
- Reading `server_core`, `app-uploads/server-core/`, or `/medmate-repo/server-core/*`.

## Behavior

The catalog database stays `medicine_data`. Local development connects as `medicine_data` / `medicine_data` on `127.0.0.1:5432`. Production reads `MEDICINE_DATASOURCE_URL`, `MEDICINE_DATASOURCE_USERNAME`, and `MEDICINE_DATASOURCE_PASSWORD` from the existing secret `medmate/medicine-data/database`. The primary Flyway history is unchanged. Catalog migrations live only in `medicine_data`.

`GET /api/search` is anonymous. `q` is required after trimming and must be 2 to 80 characters. `limit` defaults to 20. A larger value is treated as 50. A missing, blank, or non-numeric `limit`, or a value below 1, is 400 with detail `Query is not valid`. Each catalog is limited on its own. `product_id` matches the query exactly. `product_name` and `marketer_name` contain the query, ignoring case. FMCG `marketing_company` contains it too. `medicine_type`, `product_form`, and FMCG `type` match when the query is a case-insensitive prefix of the whole value, so `tab` matches form `Tablet` and `drug` matches type `drugs`. A substring in the middle of those three columns does not match on its own. Results stay ordered by `product_name`, then `product_id`, with null FMCG names last. The response is `{ "drug", "fmcg" }` with summary fields. A query that matches nothing is 200 with both lists empty.

`GET /api/products?ids=` is anonymous. Commas separate the ids. Blank pieces and repeated ids are ignored. The order of the first occurrence is kept. One to 200 ids are accepted. An empty list, more than 200 ids, or a piece longer than 80 characters is 400 with detail `Product ids are not valid`. The response is `{ "drug", "fmcg", "missing" }`. `missing` lists ids found in neither catalog. An id that exists is 200 even when other ids are missing.

`GET /api/products/{productId}` returns the full parent row and every child list, ordered by `position`. An id found in neither catalog is 404 with detail `Product was not found` and both lists empty. An id found in both catalogs appears once in each list. JSON fields are camelCase. The field stored as `package` is returned as `package`.

Drug children are `ingredients`, `safety`, `facts`, `uses`, `sideEffects`, `questions`, `interactions`, and `images`. FMCG children are `categories`, `highlights`, `ingredients`, `benefits`, `safety`, and `images`.

`POST /api/v1/catalog/drugs`, `PUT /api/v1/catalog/drugs/{productId}`, `POST /api/v1/catalog/fmcg`, and `PUT /api/v1/catalog/fmcg/{productId}` require a non-disabled platform admin or a non-disabled staff account whose subtypes include `sales`. Anyone else, including a missing session, a pharmacy owner, and any other staff subtype, receives 403 with detail `This action is not allowed.` A bearer the existing JWT filter rejects stays 401 with detail `Session was not accepted`.

The body is the whole product. `PUT` replaces the parent and replaces every child list. List order becomes `position` starting at 1. The other catalog is left alone, so the same id may exist in both. `productId` is required, trimmed, and 1 to 80 characters. On `PUT` it must match the path. `productName` is required for both catalogs. `prescriptionRequired` is required for a drug. Optional blank text is stored as null. A child row missing its required text, a list that is not an array, or a list longer than 200 rows is 400 with detail `Product is not valid`. Creating an id that already exists in that catalog is 409 with detail `Product already exists`. Updating an id missing from that catalog is 404 with detail `Product was not found`. Create responds 201 and update responds 200. The body is the same `{ "drug", "fmcg" }` document `GET` returns for that product.

A catalog database failure on a read or a write is 503 with detail `Medicine catalog is unavailable`. Stock purchase search and validation use the same detail when the catalog cannot be read.

| Status | Detail |
| --- | --- |
| 400 | `Query is not valid` |
| 400 | `Product ids are not valid` |
| 400 | `Product is not valid` |
| 403 | `This action is not allowed.` |
| 404 | `Product was not found` |
| 409 | `Product already exists` |
| 503 | `Medicine catalog is unavailable` |

## Acceptance criteria

- `GET /api/search?q=crocin` returns matching drugs and FMCG rows without a session. `q=a` is 400. A query that matches nothing is 200 with both lists empty.
- `GET /api/products?ids=` with a known id and an unknown id is 200 and lists the unknown id in `missing`. More than 200 ids is 400. One unknown id on `GET /api/products/{productId}` is 404 with both lists empty.
- A platform admin and a sales staff member can create a drug and replace its ingredients. A second create of that id is 409. An update of an unknown id is 404. A pharmacy owner, a support staff member, and a request with no session receive 403.
- After an update, the stored ingredient order is the order in the body, and the previous ingredients are gone.
- Stock search and validation no longer call medicine-data. The identity flow tests still use the in-process catalog fake.

## Tests

- `CatalogRulesTest` for search bounds, id limits, a valid drug and FMCG body, a missing required child field, and replacement order.
- `CatalogControllerTest` for anonymous search, 400, 403 for a pharmacy owner and support staff, 404, and 409.
- `CatalogIT` for schema startup, search, create, and an update that replaces ingredients.
- `StoreMedicineCatalogTest` for the stock snapshot, including composition and an id present in both catalogs.
- Bruno requests `catalog/search-products.bru`, `catalog/read-product.bru`, `catalog/create-drug.bru`, and `catalog/update-drug.bru`.
