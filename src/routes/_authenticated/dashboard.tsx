import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyProfile } from "@/lib/profile.functions";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Sprout, Timer } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Piazza" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const fetchProfile = useServerFn(getMyProfile);
  const { data: profile } = useQuery({
    queryKey: ["profile", "me"],
    queryFn: () => fetchProfile(),
  });

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
            Your learning engine is being prepared. Lessons and practice will
            appear here soon.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Stat icon={<Sprout className="h-4 w-4" />} label="Phrases seen" value="0" />
          <Stat icon={<Timer className="h-4 w-4" />} label="Minutes practiced" value="0" />
          <Stat icon={<Flame className="h-4 w-4" />} label="Days active" value="0" />
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="font-display">Today's session</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <p className="font-display text-lg italic text-muted-foreground">
                Coming soon
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Content packs and the learning engine ship in the next phase.
              </p>
            </div>
          </CardContent>
        </Card>
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
