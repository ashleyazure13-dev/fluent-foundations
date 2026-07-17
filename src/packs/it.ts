import type { LanguagePack } from "./contract";

/** Italian pack v1. Content (themes, chunks, dialogues) lives in the DB. */
export const italianPack: LanguagePack = {
  code: "it",
  name: "Italian",
  script: "latin",
  rtl: false,
  registers: ["tu", "lei", "voi"],
  bcp47: "it-IT",
  voices: { default: "it-IT-Neural-A", female: "it-IT-Neural-A", male: "it-IT-Neural-B" },
  normalize: (text) =>
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\p{L}\s]/gu, "")
      .replace(/\s+/g, " ")
      .trim(),
  prompts: {
    tutorSystem: ({ cefr, scenario, knownChunks }) => `You are a warm Italian conversation partner.
- Speak ONLY in Italian at CEFR ${cefr}. Never translate unless asked.
- Scenario: ${scenario}
- Prefer these phrases when natural: ${knownChunks.slice(0, 6).join(" · ") || "(none yet)"}
- Reply in ONE short sentence, then a follow-up question.
- If the learner makes a mistake, gently recast the correct version inside your reply — do not lecture.`,
    writingEvalSystem: ({ cefr, targetChunks }) => `You evaluate short Italian writing from a CEFR ${cefr} learner.
Target phrases they should reuse: ${targetChunks.join(" · ")}.
Return STRICT JSON with keys:
  understood (boolean),
  corrected (string, Italian, natural rewording),
  why (string, English, one sentence, kind and specific),
  reused (string[], phrases from the target list they successfully used).
No prose outside the JSON.`,
  },
};
