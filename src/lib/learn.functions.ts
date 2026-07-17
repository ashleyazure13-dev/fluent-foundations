import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { schedule } from "@/engine/scheduler";
import type { ChunkRow, DialogueRow, DialogueTurn } from "@/engine/types";

const DEFAULT_LANGUAGE = "it";

// ---------- Library ---------------------------------------------------------

export const listThemes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ languageCode: z.string().default(DEFAULT_LANGUAGE) }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { data: themes, error } = await context.supabase
      .from("themes")
      .select("id, slug, title, description, cefr, sort_order, language_code")
      .eq("language_code", data.languageCode)
      .order("sort_order");
    if (error) throw new Error(error.message);
    return themes ?? [];
  });

// ---------- Session lifecycle ----------------------------------------------

export const startSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        languageCode: z.string().default(DEFAULT_LANGUAGE),
        themeId: z.string().uuid().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Ensure learner_languages row.
    await supabase
      .from("learner_languages")
      .upsert({ user_id: userId, language_code: data.languageCode }, { onConflict: "user_id,language_code" });

    // Pick theme: caller-provided or first available.
    let themeId = data.themeId;
    if (!themeId) {
      const { data: theme } = await supabase
        .from("themes")
        .select("id")
        .eq("language_code", data.languageCode)
        .order("sort_order")
        .limit(1)
        .maybeSingle();
      themeId = theme?.id;
    }
    if (!themeId) throw new Error("No content available for this language yet.");

    const { data: dialogue, error: dErr } = await supabase
      .from("dialogues")
      .select("id, title, scenario, cultural_note, turns")
      .eq("theme_id", themeId)
      .limit(1)
      .maybeSingle();
    if (dErr) throw new Error(dErr.message);
    if (!dialogue) throw new Error("This theme has no dialogue yet.");

    const { data: session, error: sErr } = await supabase
      .from("sessions")
      .insert({
        user_id: userId,
        language_code: data.languageCode,
        theme_id: themeId,
        dialogue_id: dialogue.id,
      })
      .select("id")
      .single();
    if (sErr) throw new Error(sErr.message);
    return { sessionId: session.id };
  });

export const getSession = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ sessionId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: session, error } = await supabase
      .from("sessions")
      .select("id, language_code, theme_id, dialogue_id, started_at, completed_at, summary")
      .eq("id", data.sessionId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!session) throw new Error("Session not found.");

    const [dialogueRes, themeRes, grammarRes] = await Promise.all([
      supabase
        .from("dialogues")
        .select("id, title, scenario, cultural_note, turns")
        .eq("id", session.dialogue_id!)
        .single(),
      supabase.from("themes").select("id, title, slug, cefr, description").eq("id", session.theme_id!).single(),
      supabase
        .from("grammar_notes")
        .select("id, title, body_md, cefr")
        .eq("language_code", session.language_code)
        .limit(2),
    ]);

    if (dialogueRes.error) throw new Error(dialogueRes.error.message);
    if (themeRes.error) throw new Error(themeRes.error.message);

    const dialogue = dialogueRes.data as unknown as DialogueRow;

    const { data: chunkLinks, error: cErr } = await supabase
      .from("dialogue_chunks")
      .select("position, chunk:chunks(id, text, gloss, ipa, tags, register, cefr)")
      .eq("dialogue_id", dialogue.id)
      .order("position");
    if (cErr) throw new Error(cErr.message);

    const chunks: ChunkRow[] = (chunkLinks ?? [])
      .map((r) => r.chunk as unknown as ChunkRow)
      .filter(Boolean);

    return {
      session,
      theme: themeRes.data,
      dialogue: {
        ...dialogue,
        turns: (dialogue.turns as unknown as DialogueTurn[]) ?? [],
      },
      chunks,
      grammar: grammarRes.data ?? [],
    };
  });

// ---------- Grading / scheduling -------------------------------------------

export const gradeChunk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        sessionId: z.string().uuid().nullable().optional(),
        chunkId: z.string().uuid(),
        grade: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
        step: z.string().default("schedule"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: existing } = await supabase
      .from("learner_chunks")
      .select("stability, difficulty, reps, lapses")
      .eq("user_id", userId)
      .eq("chunk_id", data.chunkId)
      .maybeSingle();

    const next = schedule(
      {
        stability: existing?.stability ?? 1,
        difficulty: existing?.difficulty ?? 5,
        reps: existing?.reps ?? 0,
        lapses: existing?.lapses ?? 0,
      },
      data.grade,
    );

    const { error: upErr } = await supabase.from("learner_chunks").upsert(
      {
        user_id: userId,
        chunk_id: data.chunkId,
        stability: next.stability,
        difficulty: next.difficulty,
        reps: next.reps,
        lapses: next.lapses,
        last_grade: data.grade,
        last_reviewed_at: new Date().toISOString(),
        due_at: next.due_at,
      },
      { onConflict: "user_id,chunk_id" },
    );
    if (upErr) throw new Error(upErr.message);

    if (data.sessionId) {
      await supabase.from("session_events").insert({
        session_id: data.sessionId,
        user_id: userId,
        step: data.step,
        chunk_id: data.chunkId,
        grade: data.grade,
      });
    }

    return { ok: true, due_at: next.due_at };
  });

export const completeSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ sessionId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("sessions")
      .update({ completed_at: new Date().toISOString() })
      .eq("id", data.sessionId)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Review queue ---------------------------------------------------

export const listDueChunks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ languageCode: z.string().default(DEFAULT_LANGUAGE), limit: z.number().default(20) }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const nowIso = new Date().toISOString();
    const { data: rows, error } = await supabase
      .from("learner_chunks")
      .select("chunk_id, due_at, stability, reps, chunk:chunks(id, text, gloss, ipa, tags, register, cefr, language_code)")
      .eq("user_id", userId)
      .lte("due_at", nowIso)
      .order("due_at")
      .limit(data.limit);
    if (error) throw new Error(error.message);
    return (rows ?? []).filter((r) => (r.chunk as unknown as ChunkRow & { language_code: string })?.language_code === data.languageCode);
  });

// ---------- Progress -------------------------------------------------------

export const getProgress = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ count: seen }, { count: sessions }, { data: dueRows }] = await Promise.all([
      supabase.from("learner_chunks").select("*", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("sessions").select("*", { count: "exact", head: true }).eq("user_id", userId).not("completed_at", "is", null),
      supabase.from("learner_chunks").select("due_at").eq("user_id", userId).lte("due_at", new Date().toISOString()),
    ]);
    return {
      chunksSeen: seen ?? 0,
      sessionsCompleted: sessions ?? 0,
      dueNow: dueRows?.length ?? 0,
    };
  });
