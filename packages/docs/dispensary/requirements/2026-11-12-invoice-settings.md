# Invoice settings

## Context

An approved pharmacy chooses how a future invoice will print. The dispensary screen copies pharmacy Invoice Settings: template, accent, branding, and content, in that order, then a live preview of a sample bill. The settings form does not collect a footer, MRP savings, a prescribing doctor, or an HSN column. The sample bill still prints those pharmacy defaults. The pharmacy app stays untouched and is not imported. The API is [Pharmacy invoice settings](../../medmate-server/requirements/2026-11-12-pharmacy-invoice-settings.md).

Terms and the pharmacist signature leave the Profile invoice card. Logo stays on the Profile business card and can also be replaced here. The setup wizard still collects the prefix, terms, and signature.

## Scope

- An Invoice Settings item under Management, after Employees and before Manage Users.
- `/invoice-settings`.
- Editing the stored print settings, including the logo, the signature, the prefix, and the terms.
- A live preview of a fixed sample bill, and a Print sample action.
- A confirmation before every save.
- A warning, then the existing application-status screen, when a new signature starts a compliance review.
- The Manage Users dialog gains the Invoice Settings module under Management.

## Non-goals

- Footer note, “you saved …” on MRP, prescribing doctor, and the HSN column as settings on this page. The sample bill still shows the pharmacy defaults: a prescribing doctor, the MRP savings line, and the thank-you footer.
- An HSN column on the sample bill.
- A second signature image. This page has one signature / seal file. It prints only when “Show stamp on invoice” is on. The pharmacist name prints as text under the signatory.
- Removing a stored logo or signature from this page.
- Changing the setup wizard.
- The admin portal, the pharmacy app, and Profile’s business logo field.

## Behavior

The nav label is Invoice Settings. The shell title is Invoice Settings and the subtitle is `Customise your GST invoice`. The item sits under the existing Management heading, after Employees and before Manage Users. An approved owner always sees it. A staff member sees it only with `invoice-settings:read`. Update alone leaves the item hidden, and `/invoice-settings` sends that person to the dashboard. Manage Users, Profile, and Help & Support stay owner-only.

The page loads `GET /pharmacy/invoice-settings` through the portal API client. Settings sit in the left column and the preview sits on the right. Below 1080px the preview stacks under the settings. The settings column is template, then branding, then content.

Template lists Classic (`Traditional GST invoice, ruled header`), Modern (`Coloured header band with logo`), Minimal (`Clean, airy, thin lines`), and Thermal (`80mm receipt / counter roll`). Accent follows: `#1B3D29`, `#2F7D52`, `#1f7d8c`, `#2f5fd0`, `#6d4fc4`, `#b9842f`, `#c0392b`, then a custom colour input.

Branding is the brand logo, then “Show logo on invoice”, then Signature / seal stamp, then “Show stamp on invoice”. Each file offers Upload or Change. Neither file can be cleared here. A newly chosen image is previewed.

Content is document title, invoice number prefix, signatory label, bank details line, and terms. Title offers `TAX INVOICE`, `INVOICE`, `RETAIL INVOICE`, `BILL OF SUPPLY`, `CASH MEMO`, and `CREDIT NOTE`, and still accepts other text. Display options then has one toggle, “Print bank details”.

The preview card is sticky. Its heading is `Live preview`, and `Print sample` sits on the right of that heading. The sample bill redraws from the current draft, including an unsaved logo or signature, before Save. `Print sample` calls the browser print dialog. The bill carries `print-area`, so the existing print rule prints the sample and hides the rest of the console. Read-only staff still see the preview and can print.

The bill uses this pharmacy’s name, address, phone, email, GSTIN, drug licence number, and pharmacist name from the GET. Address joins street, city, state, and pincode with commas and skips blanks. The sample is not a real sale. The customer is `Preview`, payment is `UPI`, the channel line is `Counter sale`, and the number is the current prefix plus `PREVIEW`. The lines are Paracetamol 500mg (batch `PRE-12`, expiry `12/2027`, qty 2, MRP 30.00, rate 24.00, GST 12%) and Cetirizine 10mg (batch `PRE-7`, expiry `06/2027`, qty 1, MRP 18.00, rate 15.00, GST 5%). Discount is zero. Prices are GST-inclusive. Tax is backed out per slab and split into CGST and SGST. The payable amount is the net rounded to the rupee. Classic, Modern, and Minimal are an A4 sheet in the preview and on paper. Thermal stays an 80mm roll on the lined preview background and prints at that width. The logo prints only when “Show logo on invoice” is on and a logo exists. The stamp prints only when “Show stamp on invoice” is on and a signature exists. The customer block includes the sample phone, `Prescribed by: Dr. Rao`, and the sample address. On an A4 sheet the amount block sits at the bottom, just above the footer. Rules separate the customer block, each item row, the amount rows, and the footer. Terms print under the totals, then `You saved ₹15 on MRP.` and `Thank you — get well soon! Powered by Namma MedMate.` The bank line prints only when “Print bank details” is on. Classic rules the header and the payable amount in the accent colour. Modern paints the header band in the accent colour. Minimal uses a thin grey rule and leaves the accent off the type. Thermal colours the total in the accent.

`invoice-settings:update` shows Save. A staff member with only read sees the values with the controls disabled and no Save. Save stays disabled until something changed. Save always confirms. When the signature file changed, the body is `A signature change is sent for review. You will not be able to use the console until the pharmacy is approved again.` Otherwise the body is `Save invoice settings?` The dialog title is `Save invoice settings?` with Cancel and Save.

A successful save that leaves the pharmacy `approved` stays on the page and clears the dirty state. A signature save sets the session to `pending_compliance`. The existing home path then opens `/application-status`.

The permission dialog lists Management, then Manage users, Manage Employees, Invoice Settings, and Help & Support. Invoice Settings has Read and Update. The keys are `invoice-settings:read` and `invoice-settings:update`. The access count is `n / 12`.

The feature exports `InvoiceSettingsPage`, `canOpenInvoiceSettings`, `InvoicePrintSettings`, and `InvoicePaper` from its `index.ts`. `InvoicePaper` is the sample bill a later sale screen can render. Other features do not import the feature internals.

## Acceptance criteria

- An owner sees Management, then Employees, then Invoice Settings, then Manage Users. A staff member with `invoice-settings:read` sees Invoice Settings and does not see Manage Users. A staff member without that key who opens `/invoice-settings` lands on the dashboard.
- The page has the three settings cards and a Live preview. The preview shows the pharmacy name, `TAX INVOICE` until the title changes, both sample lines, `Prescribed by: Dr. Rao`, the savings line, and the thank-you footer. It does not show an HSN column or those fields as settings. Changing the title updates the preview before Save. Classic, Modern, and Minimal style the header from the accent and use an A4 sheet. Thermal uses the roll layout. Turning off the logo hides it. Print sample calls `window.print`.
- Save is absent without update. A title change asks `Save invoice settings?` and stays on the page. A new signature shows the review warning and then leaves the console.

## Tests

- `model.test.ts` for a dirty title, a signature that counts as a review, and the multipart body.
- `InvoiceSettingsPage.test.tsx` for the three cards, the live preview, a title change before save, the thermal roll, a hidden logo, print sample, save hidden without update, and the two confirm bodies.
- `invoice.test.ts` for the sample totals: gross 63.00, payable 63, and a 12% and a 5% tax line.
- `catalog.test.ts` for the twelve keys and the Invoice Settings module.
- `UsersPage.test.tsx` for the Invoice Settings rows and the `n / 12` count.
- `AppRouter.test.tsx` for Invoice Settings after Employees, a staff member with `invoice-settings:read`, and a staff member without it sent to the dashboard.
