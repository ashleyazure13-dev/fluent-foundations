import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listThemes, startSession } from "@/lib/learn.functions";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/learn")({
  head: () => ({ meta: [{ title: "Learn — Piazza" }, { name: "robots", content: "noindex" }] }),
  component: LearnPage,
});

function LearnPage() {
  const fetchThemes = useServerFn(listThemes);
  const startFn = useServerFn(startSession);
  const navigate = useNavigate();
  const [starting, setStarting] = useState<string | null>(null);

  const { data: themes = [] } = useQuery({
    queryKey: ["themes", "it"],
    queryFn: () => fetchThemes({ data: { languageCode: "it" } }),
  });

  const begin = async (themeId?: string) => {
    setStarting(themeId ?? "any");
    try {
      const { sessionId } = await startFn({ data: { languageCode: "it", themeId } });
      navigate({ to: "/session/$sessionId", params: { sessionId } });
    } finally {
      setStarting(null);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <p className="font-display italic text-primary">Today's practice</p>
          <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight md:text-5xl">
            Choose a scene
          </h1>
          <p className="mt-2 text-muted-foreground">
            Every session flows through eight steps: Listen · Understand · Speak · Notice · Retrieve · Converse · Write · Review.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {themes.map((t) => (
            <Card key={t.id} className="group overflow-hidden">
              <CardHeader>
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                  <Sparkles className="h-3 w-3" /> {t.cefr}
                </div>
                <CardTitle className="font-display text-2xl">{t.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">{t.description}</p>
                <Button
                  onClick={() => begin(t.id)}
                  disabled={starting !== null}
                  className="group-hover:translate-x-0.5 transition-transform"
                >
                  {starting === t.id ? "Starting…" : "Begin session"} <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
