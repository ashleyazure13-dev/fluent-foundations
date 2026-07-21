import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import type { ReactNode } from "react";
import { useEntitlement } from "@/hooks/use-entitlement";
import { Button } from "@/components/ui/button";

/**
 * Wrap protected app content. When the current user has no entitlement,
 * the children are rendered blurred and inert behind an "upgrade" overlay.
 *
 * While billing is disabled (dev-open provider) this always renders children
 * as-is. Once a real BillingProvider is plugged in, this component locks
 * every wrapped surface automatically — there are no product-code changes.
 */
export function PaywallGate({ children }: { children: ReactNode }) {
  const { data: entitlement, isLoading } = useEntitlement();

  // Fail closed on error, open while loading (avoids flash on every nav).
  if (isLoading) return <>{children}</>;
  if (entitlement?.hasFullAccess) return <>{children}</>;

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none select-none blur-md"
      >
        {children}
      </div>
      <div className="absolute inset-0 z-40 flex items-start justify-center px-4 pt-24">
        <div className="max-w-md rounded-2xl border border-border bg-background/95 p-8 text-center shadow-2xl backdrop-blur">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="mt-4 font-display text-2xl font-semibold">
            Your free trial has ended
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Upgrade to continue learning with Acquira.
          </p>
          <Button asChild className="mt-6 w-full">
            <Link to="/billing">Upgrade</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
