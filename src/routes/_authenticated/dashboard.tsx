import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyProfile } from "@/lib/profile.functions";
import { getProgress } from "@/lib/learn.functions";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, Sprout, Timer, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Acquira" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const fetchProfile = useServerFn(getMyProfile);
  const fetchProgress = useServerFn(getProgress);
  const { data: profile } = useQuery({ queryKey: ["profile", "me"], queryFn: () => fetchProfile() });
  const { data: progress } = useQuery({ queryKey: ["progress"], queryFn: () => fetchProgress() });

  const first = profile?.display_name?.split(" ")[0] ?? "there";

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">
        <div className="mb-10">
          <p className="font-display italic text-primary">Ciao, {first}.</p>
          <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight md:text-5xl">
            Ready to speak Italian?
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Every session flows the same way: listen, understand, speak, notice, retrieve, converse, write, review.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Stat icon={<Sprout className="h-4 w-4" />} label="Phrases seen" value={String(progress?.chunksSeen ?? 0)} />
          <Stat icon={<Timer className="h-4 w-4" />} label="Sessions" value={String(progress?.sessionsCompleted ?? 0)} />
          <Stat icon={<Flame className="h-4 w-4" />} label="Due to review" value={String(progress?.dueNow ?? 0)} />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Today's session</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Start a fresh eight-step lesson built around one Italian scene.
              </p>
              <Button asChild className="mt-4">
                <Link to="/learn">Start learning <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Review queue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {progress?.dueNow ? `${progress.dueNow} phrase${progress.dueNow === 1 ? "" : "s"} waiting.` : "You're all caught up."}
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link to="/review">Open review <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </div>
      <p className="mt-2 font-display text-3xl font-semibold">{value}</p>
    </div>
  );
}
