// Development provider: grants full access to every authenticated user.
// This is the default while billing is disabled. Swap out via
// src/lib/billing/index.ts when a real provider is added.

import type { BillingProvider, Entitlement } from "../types";

export const devOpenProvider: BillingProvider = {
  name: "none",
  async getEntitlement(_userId: string): Promise<Entitlement> {
    return {
      hasFullAccess: true,
      tier: "pro",
      trialEndsAt: null,
      subscriptionEndsAt: null,
      provider: "none",
    };
  },
};
