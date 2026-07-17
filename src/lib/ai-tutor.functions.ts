import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { getPack } from "@/packs/registry";
import { chat } from "./ai-gateway.server";

const turnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

export const converse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        languageCode: z.string(),
        scenario: z.string(),
        cefr: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).default("A1"),
        knownChunks: z.array(z.string()).default([]),
        history: z.array(turnSchema).default([]),
        userMessage: z.string().min(1).max(500),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const pack = getPack(data.languageCode);
    const reply = await chat({
      messages: [
        { role: "system", content: pack.prompts.tutorSystem({ cefr: data.cefr, scenario: data.scenario, knownChunks: data.knownChunks }) },
        ...data.history,
        { role: "user", content: data.userMessage },
      ],
      temperature: 0.7,
    });
    return { reply: reply.trim() };
  });

export const evaluateWriting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        languageCode: z.string(),
        cefr: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).default("A1"),
        targetChunks: z.array(z.string()).default([]),
        prompt: z.string(),
        learnerText: z.string().min(1).max(1000),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const pack = getPack(data.languageCode);
    const raw = await chat({
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: pack.prompts.writingEvalSystem({ cefr: data.cefr, targetChunks: data.targetChunks }) },
        { role: "user", content: `Prompt: ${data.prompt}\n\nLearner wrote: ${data.learnerText}` },
      ],
    });

    try {
      const parsed = JSON.parse(raw) as {
        understood: boolean;
        corrected: string;
        why: string;
        reused: string[];
      };
      return {
        understood: !!parsed.understood,
        corrected: parsed.corrected ?? data.learnerText,
        why: parsed.why ?? "",
        reused: Array.isArray(parsed.reused) ? parsed.reused.slice(0, 8) : [],
      };
    } catch {
      return {
        understood: false,
        corrected: data.learnerText,
        why: "Could not parse AI response. Try again.",
        reused: [],
      };
    }
  });
