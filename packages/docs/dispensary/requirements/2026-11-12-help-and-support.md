# Help and support

## Context

The dispensary shell is the pharmacy owner's console. Help & Support is the last Management item, after Profile. The screen follows the pharmacy support page: contact actions, frequently asked questions, and the ticket list. The pharmacy app stays untouched and is not imported. The API is [Help and support API](../../medmate-server/requirements/2026-11-12-help-and-support.md).

## Scope

- A Management heading and a Help & Support item for an approved pharmacy owner.
- `/support` and `/support/:caseId`.
- Live updates on the open list and the open thread.

## Non-goals

- Account, Employees, Invoice Settings, Subscription, Refer & Earn, and Settings. Those items stay where they are. Manage Users is the first Management item.
- A phone card, Help centre, reply-time text, and attachments.
- Pharmacy staff access.
- The admin portal, the pharmacy app, and medmate-server behavior beyond calling it.

## Behavior

The nav item is visible only when `pharmacyRole` is `owner`. Manage Users carries the Management heading. Profile follows it, then Help & Support. Pharmacy staff have no item. `/support` and `/support/:caseId` send staff to `/dashboard`.

The header title is Help & Support and the subtitle is FAQs, tickets & contact. That header stays while a chat is open.

`/support` order is the contact row, then the FAQ column, then the ticket column. The contact row is Live chat, then Email. Live chat's button is Start chat. Email shows `support@nammamedmate.com` and its button is a `mailto:support@nammamedmate.com` link. There is no phone card and no Help centre.

FAQs are an accordion. The first published FAQ starts open. An empty list says "No FAQs yet."

The ticket column heading is Support tickets, with Raise ticket. An empty list says "No tickets yet." A row shows the subject, the `TKT` id, the category, a relative time, and Waiting, Open, or Resolved.

Raise ticket opens a dialog with Subject, Category, and Details. The category choices are Billing, Inventory, Online store, Payments, Account, and Other. Submit stays disabled until the subject has text. Success opens the case in a right-side chat panel and sets the address to `/support/:caseId`. The Help & Support page stays behind the panel.

Start chat opens a dialog with Subject only. Success opens the same panel. The owner can type while the case is Waiting.

The panel slides in from the right, like a messenger thread. It shows the transcript, a composer, and Mark resolved until the case is resolved. The owner's messages sit on the right. After resolve, the composer and Mark resolved are gone. Closing the panel, or pressing Escape, returns to `/support`. The socket refreshes the open list and the open thread when a case or a message changes. A dropped socket reconnects and the screen loads the case again.

## Acceptance criteria

- An owner sees Management and Help & Support. Staff do not, and staff opening `/support` land on the dashboard.
- The page shows the six FAQ questions when the API returns them, the email link, and no Help centre or phone number.
- Raise ticket and Start chat require a subject and then open the thread.
- A waiting thread can send a message. A resolved thread has no composer.

## Tests

- `SupportPage.test.tsx` for the accordion, both dialogs, the email link, the empty ticket copy, and the absence of Help centre and a phone card.
- `ChatPanel.test.tsx` for sending while Waiting, and hiding the composer after Mark resolved.
- `AppRouter.test.tsx` for the owner nav item and the staff redirect.
