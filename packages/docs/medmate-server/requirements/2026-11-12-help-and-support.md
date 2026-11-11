# Help and support API

## Context

A pharmacy owner raises a ticket or starts a chat. Both are one support case, and the chat is the message thread on that case. Platform admin and `staff:support` manage one FAQ list. Support staff pick up a waiting case and can all reply. Admin can read a transcript and cannot claim, reply, or resolve. Live updates use the socket in [0009](../decisions/0009-support-module-and-live-chat.md).

## Scope

- FAQ list, create, edit, hide, and reorder.
- Case create, list, read, message, claim, and resolve.
- The push socket at `/support/stream`.
- Name lookups for pharmacy and account display names stay in identity. Support does not query identity tables.

## Non-goals

- A phone number, Help centre, attachments, pagination, search, and outbound email.
- Deleting an FAQ.
- Reassigning a claimed case. The first claim wins.
- A second service, STOMP, or anything from server-core.
- The dispensary and admin screens. Those are specified in their own apps.

## Behavior

Statuses are `waiting`, `open`, and `resolved`. A new case is `waiting`. The public ticket id is `TKT-` plus the monotonic number.

`POST /support/cases` with `{ kind, subject, category, details }` is allowed for an approved pharmacy owner. `kind` `ticket` requires a category of Billing, Inventory, Online store, Payments, Account, or Other. A non-blank `details` value becomes the first message. `kind` `chat` stores the category `Live chat` and ignores `category` and `details`. The subject is required, trimmed, and at most 140 characters. Details and later messages are trimmed and at most 4000 characters. A blank subject is 400 with detail "Subject is required." An unknown kind is 400 with detail "Support case kind is not recognised." An unknown ticket category is 400 with detail "Category is not recognised."

The owner can send a message while the case is `waiting` or `open`. Any non-disabled `staff:support` account can send as well. Sending does not change the assignee. Platform admin, pharmacy staff, and other staff subtypes receive 403 with detail "This action is not allowed." A resolved case rejects a message with 409 and detail "This chat is already resolved."

`POST /support/cases/{id}/claim` is allowed for `staff:support` while the case is `waiting`. It stores that account as the assignee and sets `open`. A second claim is 409 with detail "This chat has already been picked up." Admin receives 403.

`POST /support/cases/{id}/resolve` is allowed for that pharmacy's owner or any `staff:support` account, from `waiting` or `open`. A second resolve is 409 with detail "This chat is already resolved." Admin receives 403. A resolved case is read-only.

`GET /support/cases` returns the caller's pharmacy for an owner, and every pharmacy for admin and support, newest first. Each item includes `id`, `ticketNumber`, `pharmacyId`, `pharmacyName`, `subject`, `category`, `status`, `assigneeId`, `assigneeName`, `createdAt`, and `resolvedAt`. `assigneeId` and `assigneeName` are null until someone claims it. `GET /support/cases/{id}` adds `messages`, each with `id`, `authorId`, `authorName`, `body`, and `createdAt`. An unknown id is 404 with detail "Support case was not found." An owner asking for another pharmacy's case receives 403.

FAQs are global. The migration seeds six published rows, in this order, using the question and answer text from the pharmacy support screen:

1. How do I add a new medicine to inventory?
2. How is GST calculated on my invoices?
3. Can I hide certain medicines from the online store?
4. How do I reorder stock from my distributor?
5. How do I share reports with my CA?
6. What happens when my subscription expires?

`GET /support/faqs` returns published rows for an owner, and every row for admin and support, ordered by position. A row is `id`, `question`, `answer`, `position`, and `published`.

`POST /support/faqs` with `{ question, answer }` appends a published row. `PATCH /support/faqs/{id}` with `{ question, answer, published }` edits it. `published` false hides it. There is no delete. `POST /support/faqs/order` with `{ ids }` sets the position to the list order. The ids must be the full set, once each, or the response is 400 with detail "FAQ order is incomplete." Question is required and at most 300 characters. Answer is required and at most 4000. Admin and support may write. An owner receives 403. An unknown FAQ is 404 with detail "FAQ was not found."

A disabled account, a pharmacy staff account, and any other staff subtype receive 403 on every support route. An owner who is not approved receives 403.

After a successful create, claim, message, or resolve, and after the database commit, open sockets that may read that case receive `{"type":"case.updated","caseId","pharmacyId"}`. A message also sends `{"type":"message.created","caseId","pharmacyId"}`. Writes are not accepted on the socket.

## Acceptance criteria

- An approved owner can raise a ticket and start a chat. The ticket details are the first message. The chat category is `Live chat`.
- Support can claim once, any support account can reply, and the owner or any support account can resolve. Admin can read and cannot claim, reply, or resolve.
- A resolved case rejects messages, claims, and a second resolve.
- The owner sees the six seeded FAQs. Hiding one removes it from the owner list and leaves it in the admin list.
- A bad auth frame closes the socket. A valid owner socket receives `message.created` after a support reply.

## Tests

- `SupportRulesTest` for category, the first message, claim, a reply that leaves the assignee unchanged, and resolve.
- `SupportAccessTest` for an approved owner, pharmacy staff, admin, support, and another staff subtype.
- `SupportControllerTest` for 200, 400, 401, 403, 404, and 409.
- `SupportFlowIT` for the seed, create, claim, message, resolve, and hide.
- `SupportStreamIT` for auth-frame rejection and a message event to the owner socket.
- Bruno requests under `bruno/medmate/support/`: list FAQs, create FAQ, update FAQ, reorder FAQs, create ticket, create chat, list cases, read case, claim, send message, and resolve.
