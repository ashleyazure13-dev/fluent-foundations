import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listDueChunks, gradeChunk } from "@/lib/learn.functions";
import { getPack } from "@/packs/registry";
import { Volume2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/review")({
  head: () => ({ meta: [{ title: "Review — Piazza" }, { name: "robots", content: "noindex" }] }),
  component: ReviewPage,
});

type DueRow = {
  chunk_id: string;
  due_at: string;
  chunk: { id: string; text: string; gloss: string; ipa: string | null };
};

function ReviewPage() {
  const fetchDue = useServerFn(listDueChunks);
  const gradeFn = useServerFn(gradeChunk);
  const { data: due = [], refetch } = useQuery({
    queryKey: ["review", "due"],
    queryFn: () => fetchDue({ data: { languageCode: "it" } }) as Promise<DueRow[]>,
  });

  const [i, setI] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const pack = getPack("it");
  const current = due[i]?.chunk;

  const speak = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = pack.bcp47;
    window.speechSynthesis.speak(u);
  };

  const grade = async (g: 0 | 1 | 2 | 3) => {
    if (!current) return;
    try {
      await gradeFn({ data: { sessionId: crypto.randomUUID(), chunkId: current.id, grade: g, step: "review" } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Grade failed");
      return;
    }
    setRevealed(false);
    if (i + 1 < due.length) setI(i + 1);
    else {
      toast.success("All caught up. Ottimo!");
      refetch();
      setI(0);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <p className="font-display italic text-primary">Spaced retrieval</p>
          <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight md:text-5xl">Review</h1>
          <p className="mt-2 text-muted-foreground">Phrases due right now. Grade each honestly.</p>
        </div>

        {due.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Sparkles className="mx-auto h-8 w-8 text-primary" />
              <p className="mt-3 font-display text-xl">Nothing due right now.</p>
              <p className="mt-1 text-sm text-muted-foreground">Come back later, or start a new session.</p>
            </CardContent>
          </Card>
        ) : current ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-display">Recall</CardTitle>
                <span className="text-xs text-muted-foreground">{i + 1} / {due.length}</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">How do you say:</p>
              <p className="mt-2 font-display text-2xl">{current.gloss}</p>

              {revealed && (
                <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="ghost" onClick={() => speak(current.text)}>
                      <Volume2 className="h-4 w-4" />
                    </Button>
                    <p className="font-display text-2xl">{current.text}</p>
                  </div>
                  {current.ipa && <p className="mt-1 text-xs text-muted-foreground">/{current.ipa}/</p>}
                </div>
              )}

              {!revealed ? (
                <Button className="mt-6" onClick={() => setRevealed(true)}>Show answer</Button>
              ) : (
                <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Button variant="destructive" onClick={() => grade(0)}>Again</Button>
                  <Button variant="outline" onClick={() => grade(1)}>Hard</Button>
                  <Button onClick={() => grade(2)}>Good</Button>
                  <Button variant="secondary" onClick={() => grade(3)}>Easy</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
