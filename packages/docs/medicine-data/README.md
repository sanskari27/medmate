# medicine-data

`https://medicine-data.nammamedmate.com` is a Node 22 read API. It runs in Docker on the shared EC2 instance, with a 512 MB limit, and listens on port 3000.

It reads two catalogs in the shared Postgres database `medicine_data`:

- drugs, from `schema/drug-master-schema.sql`
- OTC and FMCG products, from `schema/otc-fmcg-master-schema.sql`

The process applies those files on startup. They create the tables when missing and create the search indexes. This application does not insert, update, or delete rows. Load data with the database secret `medmate/medicine-data/database` from outside the app.

The container has no data volume and does not use the uploads prefix.

`pg_trgm` is created by `ensure-database` when the database is provisioned. The GIN trigram indexes below depend on it.

Drug search indexes:

- primary key btree on `drugs.product_id`
- `drugs_product_name_trgm`
- `drugs_marketer_name_trgm`
- `drugs_medicine_type_trgm`
- `drugs_product_form_trgm`

OTC/FMCG search indexes:

- primary key btree on `otc_fmcg.product_id`
- `otc_fmcg_product_name_trgm`
- `otc_fmcg_marketer_name_trgm`
- `otc_fmcg_marketing_company_trgm`
- `otc_fmcg_type_trgm`
- `otc_fmcg_product_form_trgm`

Child tables keep their primary key `(product_id, position)`. Find-by-id uses that key. Search does not read child tables.

Infrastructure for the repository, DNS record, and database is `packages/infra/medicine-data`. Apply that stack, then run `python3 scripts/deploy_app.py medicine-data`.

## CORS

A browser call is allowed when the `Origin` header is:

- `https://nammamedmate.com` or any subdomain of `nammamedmate.com`
- `https://medmatepharmacy.com` or any subdomain of `medmatepharmacy.com`
- `http://localhost` on any port

A request with no `Origin` header is allowed. Any other origin receives `403`.

Allowed methods are `GET` and `OPTIONS`.

## Responses

Search and find-by-id both return the two catalogs together:

```json
{ "drug": [], "fmcg": [] }
```

A product id that exists in both catalogs appears once in each list. JSON fields are camelCase.

## Health

```bash
curl -sS "https://medicine-data.nammamedmate.com/health"
```

```json
{ "status": "ok" }
```

## Search

`GET /api/search?q=crocin&limit=2`

`q` is required, after trimming, and must be 2 to 80 characters. `limit` defaults to 20. A larger value is treated as 50. Each catalog is limited on its own, so the response can contain 20 drugs and 20 FMCG rows.

`product_id` matches the query exactly. The other fields match when they contain the query, ignoring case:

- drug: `product_name`, `marketer_name`, `medicine_type`, `product_form`
- fmcg: `product_name`, `marketer_name`, `marketing_company`, `type`, `product_form`

Search rows are summary fields. They do not include child lists or long text such as introduction, benefits, or directions.

```bash
curl -sS "https://medicine-data.nammamedmate.com/api/search?q=crocin&limit=2"
```

```json
{
  "drug": [
    {
      "productId": "DR100",
      "productName": "Crocin Advance",
      "marketerName": "GlaxoSmithKline",
      "medicineType": "allopathy",
      "productForm": "Tablet",
      "mrp": 25,
      "prescriptionRequired": false,
      "package": "Strip",
      "qtyAmount": 15,
      "qtyUnit": "tablets"
    }
  ],
  "fmcg": []
}
```

A query that matches nothing is `200` with both lists empty:

```bash
curl -sS "https://medicine-data.nammamedmate.com/api/search?q=zzzzqqqq"
```

```json
{ "drug": [], "fmcg": [] }
```

A query that is too short is `400`:

```bash
curl -sS "https://medicine-data.nammamedmate.com/api/search?q=a"
```

```json
{ "error": { "code": "BAD_REQUEST", "message": "q must be 2 to 80 characters" } }
```

A browser on the pharmacy console:

```bash
curl -sS \
  -H "Origin: https://pharmacy.nammamedmate.com" \
  "https://medicine-data.nammamedmate.com/api/search?q=crocin"
```

The response includes `Access-Control-Allow-Origin: https://pharmacy.nammamedmate.com`.

An origin outside the two zones:

```bash
curl -sS \
  -H "Origin: https://evil.example" \
  "https://medicine-data.nammamedmate.com/api/search?q=crocin"
```

```json
{ "error": { "code": "FORBIDDEN", "message": "Origin is not allowed" } }
```

## Find by id

`GET /api/products/{productId}` returns the full parent row and every child list, ordered by `position`.

Drug children are `ingredients`, `safety`, `facts`, `uses`, `sideEffects`, `questions`, `interactions`, and `images`.

FMCG children are `categories`, `highlights`, `ingredients`, `benefits`, `safety`, and `images`.

```bash
curl -sS "https://medicine-data.nammamedmate.com/api/products/DR100"
```

```json
{
  "drug": [
    {
      "productId": "DR100",
      "productName": "Crocin Advance",
      "marketerName": "GlaxoSmithKline",
      "marketerAddress": "Mumbai",
      "medicineType": "allopathy",
      "introduction": "Used for fever and pain.",
      "benefits": "Reduces fever.",
      "howToUse": "After food.",
      "ifMiss": "Skip the missed dose.",
      "packagingDetail": "Strip of 15 tablets",
      "package": "Strip",
      "qtyAmount": 15,
      "qtyUnit": "tablets",
      "qtyRaw": "15 tablets",
      "productForm": "Tablet",
      "mrp": 25,
      "prescriptionRequired": false,
      "storage": "Store in a cool place.",
      "howItWorks": "Blocks pain signals.",
      "countryOfOrigin": "India",
      "sourceFile": "drug.xlsx",
      "ingredients": [{ "name": "Paracetamol", "strength": "500 mg", "amount": 500, "unit": "mg" }],
      "safety": [{ "topic": "Alcohol", "level": "caution", "detail": "Avoid alcohol." }],
      "facts": [{ "label": "Habit forming", "value": "No" }],
      "uses": ["Fever"],
      "sideEffects": ["Nausea"],
      "questions": [{ "question": "Is it safe?", "answer": "Use as directed." }],
      "interactions": [
        {
          "drug": "Warfarin",
          "route": "oral",
          "severity": "moderate",
          "otherProduct": null,
          "interactsWith": "Warfarin",
          "detail": "Monitor."
        }
      ],
      "images": ["https://example.com/crocin.jpg"]
    }
  ],
  "fmcg": []
}
```

An unknown id is `404` with both lists empty:

```bash
curl -sS "https://medicine-data.nammamedmate.com/api/products/does-not-exist"
```

```json
{ "drug": [], "fmcg": [] }
```

## Local run

Postgres must already contain `pg_trgm`. The app creates tables and indexes on startup.

```bash
export PGHOST=127.0.0.1 PGPORT=5432 PGDATABASE=medicine_data PGUSER=medicine_data PGPASSWORD=medicine_data
npm ci
npm run build
npm start
```

The process listens on port 3000. Set `PGSSLMODE=require` when connecting to RDS. Leave it unset for a local Postgres server that does not use TLS.
