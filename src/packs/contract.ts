// Language pack contract. Content lives in the DB; packs carry
// only the linguistic conventions the engine needs at runtime.
import type { Cefr } from "@/engine/types";

export interface LanguagePack {
  code: string;
  name: string;
  script: "latin" | "cyrillic" | "arabic" | "cjk" | "devanagari" | "other";
  rtl: boolean;

  /** Registers the pack recognizes (e.g. tu/Lei/voi). */
  registers: string[];

  /** BCP-47 locale hint for browser SpeechRecognition + TTS. */
  bcp47: string;

  /** Voice metadata for TTS providers (unused when Web Speech API is used). */
  voices: {
    default: string;
    male?: string;
    female?: string;
  };

  /** Levenshtein-normalized string comparison for pronunciation/writing grading. */
  normalize: (text: string) => string;

  /** Prompt fragments injected into the AI tutor. */
  prompts: {
    tutorSystem: (opts: { cefr: Cefr; scenario: string; knownChunks: string[] }) => string;
    writingEvalSystem: (opts: { cefr: Cefr; targetChunks: string[] }) => string;
  };
}
