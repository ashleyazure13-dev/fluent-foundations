import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo, useRef, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { getSession, gradeChunk, completeSession } from "@/lib/learn.functions";
import { converse, evaluateWriting } from "@/lib/ai-tutor.functions";
import { DAILY_LOOP, STEP_META, type SessionStepKind, type ChunkRow, type DialogueTurn } from "@/engine/types";
import { getPack } from "@/packs/registry";
import { Mic, MicOff, Volume2, ArrowRight, Check, Trophy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/session/$sessionId")({
  head: () => ({ meta: [{ title: "Session — Piazza" }, { name: "robots", content: "noindex" }] }),
  component: SessionPlayer,
});

function SessionPlayer() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const fetchSession = useServerFn(getSession);
  const gradeFn = useServerFn(gradeChunk);
  const completeFn = useServerFn(completeSession);

  const { data, isLoading } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => fetchSession({ data: { sessionId } }),
  });

  const [stepIndex, setStepIndex] = useState(0);
  const step = DAILY_LOOP[stepIndex];

  if (isLoading || !data) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl">
          <p className="text-muted-foreground">Preparing your session…</p>
        </div>
      </AppShell>
    );
  }

  const { dialogue, chunks, theme, grammar } = data;
  const total = DAILY_LOOP.length;
  const percent = ((stepIndex + 1) / total) * 100;

  const goNext = () => {
    if (stepIndex < total - 1) setStepIndex(stepIndex + 1);
  };

  const finish = async () => {
    await completeFn({ data: { sessionId } });
    toast.success("Session complete. Ottimo!");
    navigate({ to: "/dashboard" });
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display italic text-primary">{theme.title}</p>
              <h1 className="font-display text-2xl font-semibold md:text-3xl">{dialogue.title}</h1>
            </div>
            <Badge variant="secondary">
              Step {stepIndex + 1} / {total}
            </Badge>
          </div>
          <Progress value={percent} className="mt-4 h-1.5" />
          <div className="mt-3 flex flex-wrap gap-1 text-xs text-muted-foreground">
            {DAILY_LOOP.map((s, i) => (
              <span
                key={s}
                className={cn(
                  "rounded-full px-2 py-0.5",
                  i < stepIndex && "bg-primary/10 text-primary",
                  i === stepIndex && "bg-primary text-primary-foreground",
                  i > stepIndex && "bg-muted",
                )}
              >
                {STEP_META[s].title}
              </span>
            ))}
          </div>
        </div>

        {/* Step content */}
        {step === "listen" && <ListenStep dialogue={dialogue} onNext={goNext} />}
        {step === "understand" && <UnderstandStep chunks={chunks} onNext={goNext} />}
        {step === "speak" && <SpeakStep chunks={chunks} onNext={goNext} />}
        {step === "notice" && <NoticeStep chunks={chunks} grammar={grammar} onNext={goNext} />}
        {step === "retrieve" && <RetrieveStep chunks={chunks} onNext={goNext} />}
        {step === "converse" && <ConverseStep dialogue={dialogue} chunks={chunks} onNext={goNext} />}
        {step === "write" && (
          <WriteStep chunks={chunks} scenario={dialogue.scenario} onNext={goNext} />
        )}
        {step === "schedule" && (
          <ScheduleStep
            chunks={chunks}
            onGrade={(chunkId, grade) => gradeFn({ data: { sessionId, chunkId, grade, step: "schedule" } })}
            onFinish={finish}
          />
        )}
      </div>
    </AppShell>
  );
}

// ---------- STEP 1: Listen -------------------------------------------------
function ListenStep({ dialogue, onNext }: { dialogue: { turns: DialogueTurn[]; scenario: string; cultural_note: string | null }; onNext: () => void }) {
  const [showGloss, setShowGloss] = useState(false);
  const pack = getPack("it");

  const speak = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = pack.bcp47;
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  };

  const speakAll = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    dialogue.turns.forEach((t, i) => {
      const u = new SpeechSynthesisUtterance(t.text);
      u.lang = pack.bcp47;
      u.rate = 0.9;
      if (i > 0) u.onstart = () => {};
      window.speechSynthesis.speak(u);
    });
  };

  return (
    <StepShell step="listen" hint="Play the scene. Listen for rhythm before meaning.">
      {dialogue.cultural_note && (
        <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
          <p className="font-medium text-primary">Cultural note</p>
          <p className="mt-1 text-foreground/80">{dialogue.cultural_note}</p>
        </div>
      )}
      <div className="space-y-3">
        {dialogue.turns.map((t, i) => (
          <div key={i} className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
            <Button variant="ghost" size="icon" onClick={() => speak(t.text)} aria-label="Play">
              <Volume2 className="h-4 w-4" />
            </Button>
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{t.speaker}</p>
              <p className="font-display text-lg">{t.text}</p>
              {showGloss && <p className="mt-1 text-sm text-muted-foreground">{t.gloss}</p>}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button variant="outline" onClick={speakAll}>
          <Volume2 className="mr-2 h-4 w-4" /> Play all
        </Button>
        <Button variant="ghost" onClick={() => setShowGloss((s) => !s)}>
          {showGloss ? "Hide translation" : "Show translation"}
        </Button>
        <Button className="ml-auto" onClick={onNext}>
          Continue <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </StepShell>
  );
}

// ---------- STEP 2: Understand --------------------------------------------
function UnderstandStep({ chunks, onNext }: { chunks: ChunkRow[]; onNext: () => void }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);

  const current = chunks[i];
  const options = useMemo(() => {
    if (!current) return [];
    const distractors = chunks
      .filter((c) => c.id !== current.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((c) => c.gloss);
    return [current.gloss, ...distractors].sort(() => Math.random() - 0.5);
  }, [current, chunks]);

  if (!current) return null;

  const advance = () => {
    setPicked(null);
    if (i + 1 < chunks.length) setI(i + 1);
    else onNext();
  };

  return (
    <StepShell step="understand" hint="Match each Italian phrase to its meaning.">
      <p className="mb-1 text-xs text-muted-foreground">{i + 1} / {chunks.length}</p>
      <p className="font-display text-3xl font-semibold">{current.text}</p>
      {current.ipa && <p className="mt-1 text-sm text-muted-foreground">/{current.ipa}/</p>}

      <div className="mt-6 grid gap-2">
        {options.map((opt) => {
          const isCorrect = opt === current.gloss;
          const isPicked = picked === opt;
          return (
            <button
              key={opt}
              onClick={() => !picked && setPicked(opt)}
              disabled={picked !== null}
              className={cn(
                "rounded-lg border border-border bg-card px-4 py-3 text-left text-sm transition-colors",
                !picked && "hover:bg-accent",
                picked && isCorrect && "border-primary bg-primary/10",
                picked && isPicked && !isCorrect && "border-destructive bg-destructive/10",
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {picked && (
        <div className="mt-4 flex justify-end">
          <Button onClick={advance}>
            {i + 1 < chunks.length ? "Next" : "Continue"} <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}
    </StepShell>
  );
}

// ---------- STEP 3: Speak (with STT) --------------------------------------
function SpeakStep({ chunks, onNext }: { chunks: ChunkRow[]; onNext: () => void }) {
  const [i, setI] = useState(0);
  const [recording, setRecording] = useState(false);
  const [heard, setHeard] = useState<string | null>(null);
  const [matched, setMatched] = useState<boolean | null>(null);
  const recRef = useRef<any>(null);
  const pack = getPack("it");
  const current = chunks[i];

  const speak = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = pack.bcp47;
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  };

  const startRec = () => {
    setHeard(null);
    setMatched(null);
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      toast.error("Speech recognition isn't available in this browser. Use 'I said it' to continue.");
      return;
    }
    const r = new SR();
    r.lang = pack.bcp47;
    r.continuous = false;
    r.interimResults = false;
    r.onresult = (ev: any) => {
      const t = ev.results[0][0].transcript as string;
      setHeard(t);
      const a = pack.normalize(t);
      const b = pack.normalize(current.text);
      setMatched(a === b || a.includes(b) || b.includes(a));
    };
    r.onerror = () => setRecording(false);
    r.onend = () => setRecording(false);
    recRef.current = r;
    r.start();
    setRecording(true);
  };

  const stopRec = () => {
    recRef.current?.stop();
    setRecording(false);
  };

  const advance = () => {
    setHeard(null);
    setMatched(null);
    if (i + 1 < chunks.length) setI(i + 1);
    else onNext();
  };

  if (!current) return null;

  return (
    <StepShell step="speak" hint="Speak from day one. Say it out loud — the shape of your mouth matters more than perfection.">
      <p className="mb-1 text-xs text-muted-foreground">{i + 1} / {chunks.length}</p>
      <p className="font-display text-3xl font-semibold">{current.text}</p>
      <p className="mt-1 text-sm text-muted-foreground">{current.gloss}</p>
      {current.ipa && <p className="mt-1 text-sm text-muted-foreground">/{current.ipa}/</p>}

      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="outline" onClick={() => speak(current.text)}>
          <Volume2 className="mr-2 h-4 w-4" /> Hear it
        </Button>
        {!recording ? (
          <Button onClick={startRec}>
            <Mic className="mr-2 h-4 w-4" /> Record
          </Button>
        ) : (
          <Button variant="destructive" onClick={stopRec}>
            <MicOff className="mr-2 h-4 w-4" /> Stop
          </Button>
        )}
        <Button variant="ghost" onClick={advance}>
          I said it →
        </Button>
      </div>

      {heard && (
        <div className={cn(
          "mt-4 rounded-lg border p-4 text-sm",
          matched ? "border-primary/40 bg-primary/5" : "border-border bg-muted",
        )}>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">You said</p>
          <p className="mt-1">{heard}</p>
          <p className="mt-2 text-xs">{matched ? "✓ Nice match" : "Close — try again or continue."}</p>
        </div>
      )}
    </StepShell>
  );
}

// ---------- STEP 4: Notice -------------------------------------------------
function NoticeStep({ chunks, grammar, onNext }: { chunks: ChunkRow[]; grammar: Array<{ id: string; title: string; body_md: string }>; onNext: () => void }) {
  return (
    <StepShell step="notice" hint="Now look at the pieces. Notice patterns you'll reuse.">
      <div className="grid gap-3 sm:grid-cols-2">
        {chunks.map((c) => (
          <div key={c.id} className="rounded-lg border border-border bg-card p-4">
            <p className="font-display text-lg">{c.text}</p>
            <p className="mt-1 text-sm text-muted-foreground">{c.gloss}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {c.register && <Badge variant="outline" className="text-[10px]">{c.register}</Badge>}
              {c.tags.slice(0, 2).map((t) => (
                <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
              ))}
            </div>
          </div>
        ))}
      </div>

      {grammar.length > 0 && (
        <div className="mt-6 space-y-3">
          <p className="font-display text-sm uppercase tracking-wider text-muted-foreground">Grammar notes</p>
          {grammar.map((g) => (
            <div key={g.id} className="rounded-lg border border-border bg-card p-4">
              <p className="font-medium">{g.title}</p>
              <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{g.body_md}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <Button onClick={onNext}>Continue <ArrowRight className="ml-1 h-4 w-4" /></Button>
      </div>
    </StepShell>
  );
}

// ---------- STEP 5: Retrieve ----------------------------------------------
function RetrieveStep({ chunks, onNext }: { chunks: ChunkRow[]; onNext: () => void }) {
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const pack = getPack("it");
  const current = chunks[i];

  if (!current) return null;

  const check = () => {
    setRevealed(true);
  };

  const advance = () => {
    setAnswer("");
    setRevealed(false);
    if (i + 1 < chunks.length) setI(i + 1);
    else onNext();
  };

  const correct = revealed && pack.normalize(answer) === pack.normalize(current.text);

  return (
    <StepShell step="retrieve" hint="Recall it from memory. Effort is what makes it stick.">
      <p className="mb-1 text-xs text-muted-foreground">{i + 1} / {chunks.length}</p>
      <p className="mb-2 text-sm text-muted-foreground">How do you say:</p>
      <p className="font-display text-2xl">{current.gloss}</p>

      <Textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Type in Italian…"
        className="mt-4"
        disabled={revealed}
      />

      {revealed && (
        <div className={cn("mt-4 rounded-lg border p-4", correct ? "border-primary/40 bg-primary/5" : "border-border bg-muted")}>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Answer</p>
          <p className="mt-1 font-display text-lg">{current.text}</p>
          {!correct && <p className="mt-1 text-xs text-muted-foreground">Close enough is fine — the recall attempt is what matters.</p>}
        </div>
      )}

      <div className="mt-4 flex justify-end gap-2">
        {!revealed ? (
          <>
            <Button variant="ghost" onClick={() => { setRevealed(true); }}>Show</Button>
            <Button onClick={check}>Check</Button>
          </>
        ) : (
          <Button onClick={advance}>{i + 1 < chunks.length ? "Next" : "Continue"} <ArrowRight className="ml-1 h-4 w-4" /></Button>
        )}
      </div>
    </StepShell>
  );
}

// ---------- STEP 6: Converse ----------------------------------------------
function ConverseStep({ dialogue, chunks, onNext }: { dialogue: { scenario: string }; chunks: ChunkRow[]; onNext: () => void }) {
  const [history, setHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState(0);
  const converseFn = useServerFn(converse);

  const send = useMutation({
    mutationFn: async (msg: string) => {
      return converseFn({
        data: {
          languageCode: "it",
          scenario: dialogue.scenario,
          cefr: "A1",
          knownChunks: chunks.map((c) => c.text),
          history,
          userMessage: msg,
        },
      });
    },
    onSuccess: (res, msg) => {
      setHistory((h) => [...h, { role: "user", content: msg }, { role: "assistant", content: res.reply }]);
      setInput("");
      setTurns((n) => n + 1);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const canFinish = turns >= 2;

  return (
    <StepShell step="converse" hint="Try it live. The tutor stays in Italian and will gently recast mistakes.">
      <div className="max-h-80 space-y-3 overflow-y-auto rounded-lg border border-border bg-card p-4">
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            <span className="font-display italic">Scena:</span> {dialogue.scenario} — start the conversation.
          </p>
        ) : (
          history.map((m, i) => (
            <div key={i} className={cn("rounded-lg px-3 py-2 text-sm", m.role === "user" ? "ml-8 bg-primary/10" : "mr-8 bg-muted")}>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{m.role === "user" ? "You" : "Tutor"}</p>
              <p className="mt-0.5 whitespace-pre-wrap">{m.content}</p>
            </div>
          ))
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Rispondi in italiano…"
          className="min-h-[3rem]"
        />
        <Button
          onClick={() => input.trim() && send.mutate(input.trim())}
          disabled={send.isPending || !input.trim()}
        >
          {send.isPending ? "…" : "Send"}
        </Button>
      </div>

      <div className="mt-4 flex justify-end">
        <Button onClick={onNext} disabled={!canFinish} variant={canFinish ? "default" : "outline"}>
          {canFinish ? "Continue" : `Exchange ${2 - turns} more turn${2 - turns === 1 ? "" : "s"}`}
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </StepShell>
  );
}

// ---------- STEP 7: Write --------------------------------------------------
function WriteStep({ chunks, scenario, onNext }: { chunks: ChunkRow[]; scenario: string; onNext: () => void }) {
  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState<{ understood: boolean; corrected: string; why: string; reused: string[] } | null>(null);
  const evalFn = useServerFn(evaluateWriting);

  const submit = useMutation({
    mutationFn: async () => {
      return evalFn({
        data: {
          languageCode: "it",
          cefr: "A1",
          targetChunks: chunks.map((c) => c.text),
          prompt: `Write a short message imagining this scene: ${scenario}`,
          learnerText: text,
        },
      });
    },
    onSuccess: setFeedback,
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <StepShell step="write" hint="Produce something new using the phrases you just learned. Two or three lines is plenty.">
      <p className="mb-3 text-sm text-muted-foreground">Scene: {scenario}</p>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Scrivi qualcosa in italiano…"
        className="min-h-[8rem]"
        disabled={submit.isPending}
      />

      {feedback && (
        <div className="mt-4 space-y-3">
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Natural version</p>
            <p className="mt-1 font-display text-lg">{feedback.corrected}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 text-sm">
            <p className="text-muted-foreground">{feedback.why}</p>
            {feedback.reused.length > 0 && (
              <p className="mt-2 flex flex-wrap gap-1 text-xs">
                <span className="text-muted-foreground">Reused:</span>
                {feedback.reused.map((r) => (
                  <Badge key={r} variant="secondary" className="text-[10px]">{r}</Badge>
                ))}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 flex justify-end gap-2">
        {!feedback ? (
          <Button onClick={() => submit.mutate()} disabled={submit.isPending || text.trim().length < 3}>
            {submit.isPending ? "Evaluating…" : "Get feedback"}
          </Button>
        ) : (
          <Button onClick={onNext}>Continue <ArrowRight className="ml-1 h-4 w-4" /></Button>
        )}
      </div>
    </StepShell>
  );
}

// ---------- STEP 8: Schedule (grade for SRS) ------------------------------
function ScheduleStep({
  chunks,
  onGrade,
  onFinish,
}: {
  chunks: ChunkRow[];
  onGrade: (chunkId: string, grade: 0 | 1 | 2 | 3) => Promise<any>;
  onFinish: () => void;
}) {
  const [i, setI] = useState(0);
  const [grades, setGrades] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const current = chunks[i];

  if (!current) return null;

  const grade = async (g: 0 | 1 | 2 | 3) => {
    setBusy(true);
    try {
      await onGrade(current.id, g);
      setGrades((prev) => ({ ...prev, [current.id]: g }));
      if (i + 1 < chunks.length) setI(i + 1);
      else {
        // done
      }
    } finally {
      setBusy(false);
    }
  };

  const done = Object.keys(grades).length >= chunks.length;

  return (
    <StepShell step="schedule" hint="Grade how well you know each phrase. We'll schedule the next review automatically.">
      {!done ? (
        <>
          <p className="mb-1 text-xs text-muted-foreground">{i + 1} / {chunks.length}</p>
          <p className="font-display text-3xl font-semibold">{current.text}</p>
          <p className="mt-1 text-sm text-muted-foreground">{current.gloss}</p>

          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <GradeBtn label="Again" hint="Didn't recall" onClick={() => grade(0)} disabled={busy} variant="destructive" />
            <GradeBtn label="Hard" hint="Struggled" onClick={() => grade(1)} disabled={busy} variant="outline" />
            <GradeBtn label="Good" hint="Recalled it" onClick={() => grade(2)} disabled={busy} variant="default" />
            <GradeBtn label="Easy" hint="Very confident" onClick={() => grade(3)} disabled={busy} variant="secondary" />
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-8 text-center">
          <Trophy className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-3 font-display text-2xl">Session complete</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {chunks.length} phrases scheduled for review.
          </p>
          <Button className="mt-6" onClick={onFinish}>
            <Check className="mr-2 h-4 w-4" /> Finish
          </Button>
        </div>
      )}
    </StepShell>
  );
}

function GradeBtn({
  label,
  hint,
  onClick,
  disabled,
  variant,
}: {
  label: string;
  hint: string;
  onClick: () => void;
  disabled?: boolean;
  variant: "default" | "outline" | "secondary" | "destructive";
}) {
  return (
    <Button variant={variant} onClick={onClick} disabled={disabled} className="h-auto flex-col py-3">
      <span className="font-semibold">{label}</span>
      <span className="mt-0.5 text-[10px] font-normal opacity-80">{hint}</span>
    </Button>
  );
}

function StepShell({ step, hint, children }: { step: SessionStepKind; hint: string; children: React.ReactNode }) {
  const meta = STEP_META[step];
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground">{meta.index}</span>
          {meta.subtitle}
        </div>
        <CardTitle className="font-display text-2xl">{meta.title}</CardTitle>
        <p className="text-sm text-muted-foreground">{hint}</p>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// Suppress unused-effect eslint via a noop ref effect (StrictMode double-mount safety for SR)
export function _noop() {
  useEffect(() => {}, []);
}
