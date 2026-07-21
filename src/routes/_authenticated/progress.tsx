import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/progress")({
  head: () => ({
    meta: [
      { title: "Progress — Acquira" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Progress,
});

function Progress() {
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="font-display text-4xl font-semibold tracking-tight">Progress</h1>
          <p className="mt-2 text-muted-foreground">
            Your journey with Italian, phrase by phrase.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Known phrases", value: "0" },
            { label: "Due for review", value: "0" },
            { label: "New this week", value: "0" },
            { label: "Retention rate", value: "—" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {s.label}
              </p>
              <p className="mt-2 font-display text-3xl font-semibold">{s.value}</p>
            </div>
          ))}
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <TrendingUp className="h-5 w-5 text-primary" />
              Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-dashed border-border p-12 text-center">
              <p className="font-display text-lg italic text-muted-foreground">
                No sessions yet
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your practice history and retention curves will appear here once
                lessons are available.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
