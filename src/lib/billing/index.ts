// Active billing provider selection.
//
// To add a real provider later (Lemon Squeezy, Stripe, Paddle, ...):
//   1. Add its module under ./providers/<name>.ts implementing BillingProvider.
//   2. Register it below and switch `activeProvider` based on
//      process.env.BILLING_PROVIDER.
//   3. Add its webhook route under src/routes/api/public/billing/<name>.ts.
//
// No other part of the app should import from ./providers/* directly.

import type { BillingProvider } from "./types";
import { devOpenProvider } from "./providers/dev-open";

const providers: Record<string, BillingProvider> = {
  none: devOpenProvider,
};

function resolveProvider(): BillingProvider {
  const name = process.env.BILLING_PROVIDER ?? "none";
  return providers[name] ?? devOpenProvider;
}

export const billing: BillingProvider = resolveProvider();
export type { BillingProvider, Entitlement, EntitlementTier, CheckoutIntent } from "./types";
