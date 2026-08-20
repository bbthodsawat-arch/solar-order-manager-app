# POS Workflow Verification

## Scope

This verification covers the current POS workflow implemented in `src/pages/AddTransaction.tsx` and the shared feedback layer in `src/utils/feedback.ts`.

## Verified workflow paths

1. **Open POS**
   - App routes the POS tab to `AddTransaction` when the user can add transactions.
   - POS supports four operational modes: solar sale, custom sale/service, general income, and expense.

2. **Solar sale**
   - Product selection adds standard sets to the cart.
   - Custom items can be added.
   - Quantity, discount, and shipping fee affect the calculated grand total.
   - Customer details can be selected from recent transactions or CRM.
   - Payment status/method and shipping status are captured.
   - Checkout persists the sale through `addTransaction` and records an action-history CREATE event.
   - Success state provides receipt printing, new-sale reset, and history navigation.

3. **General income / expense**
   - Required detail and positive amount are validated before submit.
   - Successful persistence records an action-history CREATE event.
   - Success state provides a clear completion screen and navigation.

4. **Feedback**
   - POS actions use the shared `notifyReaction` helper for success, warning, error, delete, cash, and info feedback.
   - Feedback also supports optional sound cues.

## UX hardening applied in this iteration

- Mobile controls use touch-friendly sizing at narrow viewports.
- POS feedback is standardized through the shared notification helper.
- The POS workflow keeps Firebase/Firestore data sources and existing transaction hooks unchanged.

## Remaining manual acceptance test

The final runtime verification should be performed on a real mobile browser: login -> POS -> add product -> customer -> payment -> shipping -> checkout -> receipt/history -> reopen POS. This validates browser/device behavior that static source inspection cannot fully prove.
