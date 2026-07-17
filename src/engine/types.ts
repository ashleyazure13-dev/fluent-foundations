// Language-agnostic learning engine types.
// No language-specific logic lives here.

export type Cefr = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type SessionStepKind =
  | "listen"
  | "understand"
  | "speak"
  | "notice"
  | "retrieve"
  | "converse"
  | "write"
  | "schedule";

export interface ChunkRow {
  id: string;
  text: string;
  gloss: string;
  ipa: string | null;
  tags: string[];
  register: string | null;
  cefr: Cefr;
}

export interface DialogueTurn {
  speaker: string;
  text: string;
  gloss: string;
}

export interface DialogueRow {
  id: string;
  title: string;
  scenario: string;
  cultural_note: string | null;
  turns: DialogueTurn[];
}

export interface Grade {
  // 0 = Again, 1 = Hard, 2 = Good, 3 = Easy
  value: 0 | 1 | 2 | 3;
}

export interface LearnerChunkState {
  stability: number;
  difficulty: number;
  reps: number;
  lapses: number;
  due_at: string;
}

// The canonical 8-step Daily Loop. Never reorder.
export const DAILY_LOOP: readonly SessionStepKind[] = [
  "listen",
  "understand",
  "speak",
  "notice",
  "retrieve",
  "converse",
  "write",
  "schedule",
] as const;

export const STEP_META: Record<
  SessionStepKind,
  { title: string; subtitle: string; index: number }
> = {
  listen: { title: "Listen", subtitle: "Authentic input", index: 1 },
  understand: { title: "Understand", subtitle: "Grasp meaning", index: 2 },
  speak: { title: "Speak", subtitle: "Say it out loud", index: 3 },
  notice: { title: "Notice", subtitle: "Study the expression", index: 4 },
  retrieve: { title: "Retrieve", subtitle: "Recall from memory", index: 5 },
  converse: { title: "Converse", subtitle: "Use it in dialogue", index: 6 },
  write: { title: "Write", subtitle: "Produce with intent", index: 7 },
  schedule: { title: "Review", subtitle: "Space for retention", index: 8 },
};
