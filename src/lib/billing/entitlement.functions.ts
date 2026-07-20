import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { billing } from "./index";

/**
 * Returns the current user's entitlement. In development this always grants
 * full access; swap the provider in src/lib/billing/index.ts to enforce paid
 * plans without changing callers.
 */
export const getMyEntitlement = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    return billing.getEntitlement(context.userId);
  });
