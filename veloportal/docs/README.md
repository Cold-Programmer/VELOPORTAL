# VeloPortal Test Plan & QA Notes

This folder contains the academic **System Test Plan** (`VeloPortal_System_Test_Plan.pdf`,
Chapter Seven of the project report) alongside notes on how its testing strategy maps to the
actual implementation in this repository.

## What's in the PDF

The test plan defines the testing approach for VeloPortal's three core modules — the component
compatibility simulator, the rental scheduling engine, and the administrative dashboard — across
four levels:

1. **Unit testing** — individual logic functions (e.g. the geometric fit calculation)
2. **Integration testing** — frontend ↔ database ↔ REST service interaction
3. **System testing** — full workflows from user input to database record updates
4. **User Acceptance Testing (UAT)** — validating the experience for storekeepers and student
   commuters

## How it maps to this codebase

| Test plan concept | Where it lives in this repo |
|---|---|
| Geometric fit calculation (unit logic) | `backend/routes/customizer.js` → `checkCompatibility()`, mirrored client-side in `frontend/src/pages/Customizer.jsx` for instant feedback |
| Booking/scheduling logic | `backend/routes/rentals.js` — overlap detection via Sequelize `Op.lt`/`Op.gt` date-range queries |
| Frontend ↔ DB ↔ REST integration | Every route in `backend/routes/*.js` plus the corresponding `frontend/src/pages/*.jsx` that calls it through `frontend/src/api/client.js` |
| Security boundary enforcement | `backend/middleware/auth.js` (`requireRole`, `adminOnly`, `staffOrAdmin`, `mechanicOrAdmin`) — see the roles table in the main `README.md` |
| End-to-end checkout workflow | `POST /api/orders/checkout` → M-Pesa STK push → `POST /api/payments/mpesa/callback` → `GET /api/orders/:id` (polled by `Checkout.jsx`) → `ReceiptModal.jsx` |

## Suggested manual test pass (UAT-style)

Since this repo does not yet include an automated test runner (see honest scope note in the main
README), use this as a manual pass before a demo or submission:

- [ ] Register a new customer account (with and without the optional student reg. number/phone)
- [ ] Browse `/shop`, filter by category, add an item to cart, complete checkout with a sandbox
      M-Pesa number, confirm the receipt modal shows a pending → success/failed state
- [ ] Book a rental on `/rentals/:slug` for an available time window; try an overlapping window
      and confirm it's rejected with "already booked"
- [ ] Build a bike on `/customize`: pick a mismatched fork and confirm the red conflict banner
      and blocked "Save" button; pick a matching one and confirm it saves
- [ ] Book a repair on `/repair` and confirm it appears in the dashboard's Repairs tab
- [ ] Register for an event on `/events/:slug` and confirm the ticket code shows in the dashboard
- [ ] Post, comment, and like something on `/community`
- [ ] Log in as `mechanic@veloportal.app` and confirm only the Repairs tab is visible under
      "Operations console" (`/admin`)
- [ ] Log in as `staff@veloportal.app` and confirm Users/Payments tabs are **not** visible
- [ ] Log in as `admin@veloportal.app` and confirm every tab is visible, including Users/Payments
- [ ] From the dashboard's Profile tab, update your name/phone, change your password, then log
      out and log back in with the new password
