# Seaport website review and proposed fixes

## What I checked
- Public home, shop, sign-in, password reset, two product pages, and the signed-out checkout redirect.
- Desktop and mobile screenshots: no page crashes, broken loaded images, or sideways scrolling in the checked views.
- Twenty existing tests passed and the latest preview check reported no errors.
- Reviewed payment, shipping, account, inventory, and order-handling code and ran the database configuration checker.

Signed-in purchases, password-reset emails, admin actions, and live payments are **not yet verified end to end**. These checks do not mean the entire website is finished or secure.

## Proposed changes — awaiting your confirmation

### 1. Payments and delivery promises — high priority
- Checkout still uses simulated QRIS, virtual accounts, and e-wallet payments, but the footer claims an official instant payment gateway. Correct that claim until a real provider is connected.
- Connect real payments only after you provide your business country and approve the provider setup. Verify payment confirmation, failed payments, cancellation, and refunds before accepting money.
- The announcement promises free shipping over Rp 1,000,000, but checkout still charges delivery. Make the advertised offer and actual totals agree; confirm the exact threshold and eligible delivery options before changing charges.

### 2. Account and access protections — high priority
- Test email signup, sign-in, sign-out, return to checkout, and password recovery with a signed-in account.
- Review blocked-account handling: sign-in can start redirecting before the blocked-account check finishes; restrictions must also apply to protected actions.
- Remove automatic administrator assignment to the first new account if no administrator exists; administrator access should be assigned deliberately.
- Tighten unnecessary public access to privileged account/order operations. The checker reports warnings that need individual review, not proof that every flagged operation is exploitable.
- Review the email auto-confirm trigger and keep the confirmation policy you approve; do not silently change it.

### 3. Shipping tracking and order reliability — high priority
- Tracking numbers are saved in the admin browser, while the attempted order update can fail silently. Save tracking numbers centrally so customers can actually read them.
- Prevent repeated or simultaneous cancellation from returning stock more than once.
- Apply payment-channel, quantity, duplicate-item, and stock checks where orders are created, not only in the screen.
- Verify order history and invoice totals after each order action.

### 4. Sizes and inventory
- Correct the adult size-guide label from EU 36–45 to your EU 39–45 rule; retain kids EU 29–37.
- Prevent removed inventory variants from remaining available after a product is saved.
- Replace preset quantities that automatically invent ten items with zero until real stock is entered.
- Keep unavailable kids sizes unavailable until you confirm actual kids products and inventory.

### 5. Catalog accuracy
- Review mismatched product names and page addresses: KAI 1 Playoffs and KAI 3 Triple Black currently appear under each other's old addresses.
- Confirm the exact Nike and Wade models, photos, current comparable prices, and real stock. Do not claim a guaranteed market-low price.
- Keep proposed catalog entries unavailable until inventory is confirmed; do not invent availability.

### 6. Store and member claims
- The current store-management page is administrator-only, unlike the older multi-seller plan. Preserve the current official-store setup unless you request independent sellers again.
- Verify or remove unsupported promises such as member promotions, priority drops, authenticity guarantees, and exchange terms. Do not invent policies.

### 7. Final checks
- Test an actual signed-in purchase through payment, invoice, order history, shipment, and cancellation.
- Check phone and desktop layouts, empty/error states, and account permissions; run relevant automated tests and security checks after approved fixes.
- Do not redesign the site, add extra login providers, or publish it without your approval.

## Decisions still needed
- Business registration country and existing payment provider, if any.
- Free-delivery eligibility and whether the threshold includes exactly Rp 1,000,000.
- Real product stock and supported member/exchange policies.

## Technical details
Keep private pages under the existing authenticated layout. Use authenticated server functions for payment and tracking operations, and transactional database functions for inventory, cancellations, and order totals. Store tracking information with orders rather than browser storage; retain shared validation and sizing modules and add tests for approved business rules.