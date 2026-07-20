import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEntitlement } from "@/hooks/use-entitlement";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/billing")({
  head: () => ({
    meta: [
      { title: "Billing — Piazza" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Billing,
});

function Billing() {
  const { data: entitlement } = useEntitlement();

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Billing</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your Piazza subscription.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-display">Current plan</CardTitle>
            <CardDescription>
              Provider: <span className="font-mono">{entitlement?.provider ?? "none"}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-accent/50 p-4">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <div className="text-sm">
                <p className="font-medium">Full access</p>
                <p className="text-muted-foreground">
                  Billing is disabled during development. Every authenticated
                  user has full access.
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              A real payment provider can be plugged in later without changing
              product code — see <span className="font-mono">src/lib/billing/README.md</span>.
            </p>
            <Button variant="outline" asChild>
              <Link to="/dashboard">Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
