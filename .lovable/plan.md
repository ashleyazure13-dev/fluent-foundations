
# Phase 1 — Product Vision & Software Architecture

No code will be written in this phase. This document defines the foundation for all subsequent phases.

---

## 1. Product Philosophy

**Thesis:** Language is acquired, not memorized. The platform teaches *communication competence* through comprehensible input, meaningful output, spaced retrieval, and purposeful reuse — grounded in Krashen (Input Hypothesis), Swain (Output Hypothesis), VanPatten (Processing Instruction), Ebbinghaus/Bjork (spacing & desirable difficulty), and Anderson (ACT-R skill acquisition).

**Core principles**
1. **Message over word.** The atomic unit is a *communicative chunk* (a phrase that accomplishes intent), not a lexeme.
2. **Input before output, output before mastery.** Every concept flows: Notice → Understand → Retrieve → Produce → Reuse.
3. **Speak from day one.** Voice is a first-class input, not a bonus feature.
4. **Spaced retrieval by default.** Every item is scheduled, never "completed."
5. **Authentic context.** Dialogues, stories, real cultural situations — not decontextualized flashcards.
6. **Language-agnostic engine.** Pedagogy lives in the engine; linguistic content lives in swappable packs.

**Refusals:** no gamified streak-shaming, no isolated vocabulary drills as the primary loop, no translation-as-learning.

---

## 2. Platform Architecture

**Stack (aligned with current template)**
- Frontend: TanStack Start (React 19, SSR, file-based routing), Tailwind v4, shadcn.
- Backend: TanStack server functions + `/api/public/*` routes (webhooks, cron). Runtime: Cloudflare Workers with `nodejs_compat`.
- Data & auth: Lovable Cloud (Postgres + Auth + Storage + Realtime).
- AI: Lovable AI Gateway (chat, TTS, STT, embeddings).
- State: TanStack Query for server state; Zustand for ephemeral session state (current lesson, mic buffer, transcript).
- Observability: server-function logs + client error reporting (already wired).

**High-level modules**
```text
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│  Routes • Lesson Player • Speaking Studio • Review Deck  │
└───────────────┬─────────────────────────────┬───────────┘
                │                             │
        ┌───────▼────────┐            ┌───────▼────────┐
        │ Learning Engine │            │  AI Services   │
        │ (language-free) │◄──────────►│ Tutor/STT/TTS  │
        └───────┬────────┘            └───────┬────────┘
                │                             │
        ┌───────▼─────────────────────────────▼────────┐
        │           Language Pack Interface             │
        │  (Italian pack v1 • French/Spanish/… later)   │
        └───────┬───────────────────────────────────────┘
                │
        ┌───────▼────────┐
        │   Data Layer   │  Postgres + Storage + Realtime
        └────────────────┘
```

**Learning Engine responsibilities (language-agnostic)**
- SRS scheduler (FSRS algorithm; per-item stability & difficulty).
- Session composer (mix of new input, due retrievals, production tasks, review).
- Mastery model per skill dimension: *recognize, understand, retrieve, produce, reuse*.
- Difficulty controller (i+1 selection from pack).

**AI Services (language-agnostic prompts, pack-provided context)**
- Conversational tutor (roleplay, corrective feedback).
- Pronunciation scorer (STT + phoneme diff).
- Comprehension checker (semantic match, not string match).
- Dynamic example generator (variant sentences from a chunk template).

---

## 3. Database Schema

All tables in `public` schema. RLS on. `user_roles` separate from `profiles`. Grants added per table.

**Identity & profile**
- `profiles(id uuid pk → auth.users, display_name, locale_ui, created_at)`
- `user_roles(user_id, role app_role)` — enum: `learner|admin|content_editor`
- `has_role(uuid, app_role)` security-definer function.

**Language packs**
- `languages(code pk, name, script, rtl bool, phoneme_set jsonb)` — e.g. `it`, `fr`.
- `pack_versions(id, language_code fk, semver, published_at, checksum)`
- `learner_languages(user_id, language_code, active_pack_version, cefr_target, started_at)` — a learner can study multiple.

**Content (all rows carry `language_code` + `pack_version`)**
- `themes(id, language_code, slug, title, order)` — e.g. "Ordering at a café".
- `dialogues(id, theme_id, title, audio_url, transcript jsonb, translation jsonb)`
- `chunks(id, language_code, text, gloss, ipa, audio_url, cefr, tags[], embedding vector)` — the atomic communicative unit.
- `chunk_variants(chunk_id, text, context)` — surface forms for retrieval variety.
- `dialogue_chunks(dialogue_id, chunk_id, position)` — many-to-many.
- `grammar_notes(id, language_code, chunk_id nullable, title, body_md, examples jsonb)` — surfaced *after* exposure, not before.
- `tasks(id, chunk_id|dialogue_id, kind, prompt jsonb, expected jsonb)` — kind ∈ `listen|match|shadow|speak|roleplay|produce|translate_meaning`.

**Learner state**
- `learner_chunks(user_id, chunk_id, stability, difficulty, due_at, reps, lapses, last_grade, mastery_dim jsonb)` — FSRS state per skill dimension.
- `sessions(id, user_id, language_code, started_at, ended_at, summary jsonb)`
- `session_events(id, session_id, task_id, chunk_id, grade, latency_ms, audio_url, ai_feedback jsonb)`
- `conversations(id, user_id, language_code, scenario_id, transcript jsonb, created_at)` — freeform tutor chats.

**Ops**
- `audit_log`, `feature_flags`, `waitlist`, `subscriptions` (later).

Vector search on `chunks.embedding` for "find a chunk that expresses this meaning."

---

## 4. Folder Structure

```text
src/
  routes/
    __root.tsx
    index.tsx                    # marketing/landing
    _authenticated/
      route.tsx                  # auth gate
      dashboard.tsx
      learn.$languageCode.tsx    # today's session composer
      learn.$languageCode.session.$id.tsx
      speak.$languageCode.tsx    # freeform tutor
      review.$languageCode.tsx
      library.$languageCode.tsx  # themes & dialogues browser
      settings.tsx
    auth.tsx
    api/
      public/
        webhook.tts-callback.ts
        cron.due-notifications.ts
  components/
    lesson/                      # LessonPlayer, ChunkCard, TaskRunner
    speaking/                    # MicButton, WaveformViz, Transcript
    review/                      # DeckView, GradeButtons
    shared/                      # Layout, Nav, EmptyState
    ui/                          # shadcn primitives
  engine/                        # language-agnostic learning engine
    scheduler/                   # FSRS impl, session composer
    mastery/                     # skill dimensions, grading
    selection/                   # i+1 chunk picker
    types.ts
  packs/                         # language pack INTERFACE only (no content)
    contract.ts                  # LanguagePack, ChunkShape, TaskKind
    registry.ts                  # runtime pack loader from DB
  lib/
    ai/                          # gateway clients: tutor, stt, tts, embed
    supabase/                    # client, auth-middleware, admin (server)
    queries/                     # queryOptions factories
    server-fns/                  # *.functions.ts (client-safe imports)
    server-only/                 # *.server.ts (never imported by client)
  hooks/
  stores/                        # zustand: sessionStore, micStore
  styles.css
supabase/
  migrations/                    # schema, RLS, seed pack v1 (Italian)
```

Content itself lives in the database (pack rows), not in the repo. Editors ship packs via migrations or an admin UI.

---

## 5. Component Hierarchy (learning surfaces)

```text
<AppShell>
  <LanguageSwitcher/>
  <LessonPlayer>              # orchestrates a session
    <ProgressRail/>
    <TaskRunner>              # polymorphic on task.kind
      <ListenTask/>
      <MatchTask/>
      <ShadowTask/>           # STT + phoneme diff
      <SpeakTask/>            # open production
      <RoleplayTask/>         # AI tutor turn-by-turn
      <ProduceTask/>          # write/say to express intent
    </TaskRunner>
    <FeedbackPanel/>          # correction + reformulation
    <ChunkContextDrawer/>     # gloss, IPA, examples on demand
  </LessonPlayer>
  <ReviewDeck/>               # due retrievals
  <SpeakingStudio/>           # freeform tutor
</AppShell>
```

---

## 6. AI Architecture

**Providers:** Lovable AI Gateway.
- Text/tutor: Gemini 2.5 Flash (default), Pro for evaluation.
- STT: gateway speech-to-text.
- TTS: gateway text-to-speech, per-language voice map in the pack.
- Embeddings: for semantic comprehension checks and chunk retrieval.

**Prompt architecture (language-agnostic)**
- System prompt template parameterized by `{language.name, cefr, learner.known_chunks, scenario, correction_style}`.
- Pack provides linguistic conventions (formality registers, dialect notes, phoneme inventory).
- Structured outputs (JSON) for graded feedback: `{understood: bool, corrected: string, why: string, suggested_reuse: string[]}`.

**AI flows**
1. **Roleplay** — tutor stays in target language at learner CEFR, injects due chunks opportunistically.
2. **Corrective feedback** — recasts, not red ink. Highlights one error per turn.
3. **Pronunciation** — STT transcript → align → phoneme-level score → targeted drill.
4. **Comprehension check** — semantic similarity of learner paraphrase vs. expected meaning (embedding cosine + LLM judge fallback).
5. **Content expansion** — generate chunk variants at runtime; cache into `chunk_variants` for reuse.

All AI calls run in server functions (`requireSupabaseAuth`); no keys in the client.

---

## 7. Language-Pack Architecture

**Contract (TypeScript interface, DB-backed rows)**
```text
LanguagePack {
  code, name, script, rtl,
  cefrBands, phonemeSet,
  registers: ['tu','lei',...],       // pack-defined
  voices: { male, female, neutral }, // TTS voice ids
  tokenize(text) -> tokens,          // pack function (server)
  normalize(text) -> string,
  transliterate?(text) -> string,    // for non-Latin scripts later
  grader.pronunciation(expected, heard) -> score,
  prompts: { tutorSystem, correctionStyle, examplesGen }
}
```

- Packs are versioned; a learner is pinned to a `pack_version` until they opt into an upgrade.
- Italian v1 ships first. Adding French = new rows + a new pack module implementing the contract. **The engine never branches on `language_code`.**
- Non-Latin scripts (Japanese, Arabic) are anticipated via `script`, `rtl`, and `transliterate` — no schema change needed later.

---

## 8. Authentication & Authorization

- Lovable Cloud auth. Default methods: **email/password + Google**.
- Profiles auto-created via trigger on `auth.users` insert.
- Roles in `user_roles` (never on profile). `has_role()` security-definer used in all admin RLS.
- Route gate: `src/routes/_authenticated/route.tsx` (integration-managed).
- Server functions: `requireSupabaseAuth` middleware; admin operations verify role via `context.supabase` before touching `supabaseAdmin`.
- `/reset-password` public route required.
- HIBP leaked-password check enabled at launch.

---

## 9. State Management

- **Server state:** TanStack Query. Loader pattern: `ensureQueryData(queryOptions)` in loader → `useSuspenseQuery` in component. `defaultPreloadStaleTime: 0`.
- **Session state (ephemeral):** Zustand stores — `useSessionStore` (current task index, grades buffer), `useMicStore` (recording state, VAD).
- **URL state:** current language, session id, task index — kept in route params for shareable/resumable sessions.
- **Realtime:** Supabase Realtime for multi-device session sync (later phase).

---

## 10. Scalability Strategy

**Content scale**
- Packs are DB rows, not code. Adding a language = migration + pack module (~few hundred lines). No engine changes.
- Chunk embeddings enable semantic retrieval as libraries grow into the tens of thousands.

**User scale**
- Cloudflare Workers = horizontal by default; no sticky state.
- Read-heavy paths (library, due queue) cached via TanStack Query + short-TTL server responses.
- FSRS state kept per-row, indexed on `(user_id, language_code, due_at)`.

**AI cost**
- Cache TTS audio in Storage keyed by `(chunk_id, voice, pack_version)`. Generate once, reuse forever.
- Cache chunk variants after first generation.
- Cheap default model; escalate to Pro only for evaluation/roleplay endpoints.

**Team scale**
- Content editors work through an admin UI on `pack_versions` — never touch code.
- Engine has unit tests independent of any pack (mock pack fixture).
- Pack contract is versioned; breaking changes bump major.

**Reliability**
- All AI calls behind server functions with typed retries and structured error surfaces.
- Cron `/api/public/cron.due-notifications` for daily nudges (signed).
- Migrations idempotent; grants + RLS in the same file as `CREATE TABLE`.

---

## Out of scope for Phase 1
No code, no migrations, no UI. Next phase (Phase 2) will translate this into: migrations for the schema above, the pack contract module, the engine skeleton, and the first Italian pack seed.

Reply "approve" to lock this architecture, or tell me what to change (e.g. swap FSRS for SM-2, add offline mode, target CEFR bands, monetization model) and I'll revise.
