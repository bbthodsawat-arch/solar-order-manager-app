# Release Acceptance Baseline

## Production verification

- [x] Production deployment is READY.
- [x] `GET /api/health` returns HTTP 200 and JSON health payload.
- [x] Root application returns HTTP 200 and serves the SPA shell.
- [x] Recent production runtime logs show no error/fatal events during verification.

## Automated regression coverage

- [x] TypeScript check via `npm run lint`.
- [x] Business workflow checks via `npm run test:workflow`.
- [x] Production build via `npm run build`.
- [x] Production server smoke test on configured port.
- [x] Invalid configured port fallback smoke test.

## Business workflow acceptance

The intended business progression is:

`Quote -> Order -> Payment -> Delivery -> Installation -> Warranty`

The automated workflow assertions cover:

- Quote can advance to Order without requiring an order ID.
- Required documents progress through Order, Receipt, Delivery, Installation, and Warranty after the corresponding workflow states are complete.
- Partial payment routes to receipt/payment review.
- Shipping routes to delivery review.
- Completed installation routes to installation acceptance.
- Document numbering preview and incrementing rules do not mutate the source rule.

## Final UAT scope

Manual UAT should confirm real Firebase-backed records and user-facing UI interactions for each stage, including permissions, document generation, status updates, notifications, and dashboard/report visibility.

## Release decision

**Status: READY FOR UAT / FINAL ACCEPTANCE**

Production infrastructure and automated regression checks are green. Final sign-off depends only on manual business-user acceptance of real-data UI flows.
