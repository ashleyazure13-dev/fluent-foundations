// Billing abstraction. Keep this file provider-agnostic.
// The rest of the app depends only on these types + the exported provider
// from ./index.ts — never on a concrete billing SDK.

export type EntitlementTier = "free" | "trial" | "pro";

export interface Entitlement {
  /** Whether the user currently has full access to paid features. */
  hasFullAccess: boolean;
  tier: EntitlementTier;
  /** ISO timestamp; null if not on a trial or not applicable. */
  trialEndsAt: string | null;
  /** ISO timestamp when a paid subscription lapses; null if none. */
  subscriptionEndsAt: string | null;
  /** Opaque provider name, for UI/telemetry. "none" in development. */
  provider: string;
}

export interface CheckoutIntent {
  /** Where to redirect the browser to complete purchase. */
  url: string;
}

/**
 * A billing provider is anything that can answer "what is this user entitled
 * to?" and (optionally) start a checkout flow. Webhook handling is owned by
 * the concrete provider module, not the core app.
 */
export interface BillingProvider {
  readonly name: string;
  /** Return the entitlement for the given authenticated user id. */
  getEntitlement(userId: string): Promise<Entitlement>;
  /** Optional: start a checkout session. Absent providers throw. */
  createCheckout?(userId: string, opts?: { plan?: string }): Promise<CheckoutIntent>;
}
