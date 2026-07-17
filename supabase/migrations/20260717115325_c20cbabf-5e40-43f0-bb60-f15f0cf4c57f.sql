
-- ============================================================
-- PHASE 3/4: Learning engine schema + Italian pack seed
-- ============================================================

-- Languages
CREATE TABLE public.languages (
  code text PRIMARY KEY,
  name text NOT NULL,
  script text NOT NULL DEFAULT 'latin',
  rtl boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.languages TO anon, authenticated;
GRANT ALL ON public.languages TO service_role;
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "languages readable by all" ON public.languages FOR SELECT TO anon, authenticated USING (true);

-- Themes (per-language)
CREATE TABLE public.themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language_code text NOT NULL REFERENCES public.languages(code) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  description text,
  cefr text NOT NULL DEFAULT 'A1',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (language_code, slug)
);
GRANT SELECT ON public.themes TO anon, authenticated;
GRANT ALL ON public.themes TO service_role;
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "themes readable by all" ON public.themes FOR SELECT TO anon, authenticated USING (true);

-- Chunks: the atomic communicative unit
CREATE TABLE public.chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language_code text NOT NULL REFERENCES public.languages(code) ON DELETE CASCADE,
  text text NOT NULL,
  gloss text NOT NULL,
  ipa text,
  cefr text NOT NULL DEFAULT 'A1',
  tags text[] NOT NULL DEFAULT '{}',
  register text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.chunks TO authenticated;
GRANT ALL ON public.chunks TO service_role;
ALTER TABLE public.chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chunks readable by authed" ON public.chunks FOR SELECT TO authenticated USING (true);

-- Dialogues
CREATE TABLE public.dialogues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id uuid NOT NULL REFERENCES public.themes(id) ON DELETE CASCADE,
  title text NOT NULL,
  scenario text NOT NULL,
  cultural_note text,
  turns jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.dialogues TO authenticated;
GRANT ALL ON public.dialogues TO service_role;
ALTER TABLE public.dialogues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dialogues readable by authed" ON public.dialogues FOR SELECT TO authenticated USING (true);

-- Dialogue <-> chunk association
CREATE TABLE public.dialogue_chunks (
  dialogue_id uuid NOT NULL REFERENCES public.dialogues(id) ON DELETE CASCADE,
  chunk_id uuid NOT NULL REFERENCES public.chunks(id) ON DELETE CASCADE,
  position int NOT NULL DEFAULT 0,
  PRIMARY KEY (dialogue_id, chunk_id)
);
GRANT SELECT ON public.dialogue_chunks TO authenticated;
GRANT ALL ON public.dialogue_chunks TO service_role;
ALTER TABLE public.dialogue_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dialogue_chunks readable by authed" ON public.dialogue_chunks FOR SELECT TO authenticated USING (true);

-- Grammar notes
CREATE TABLE public.grammar_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language_code text NOT NULL REFERENCES public.languages(code) ON DELETE CASCADE,
  title text NOT NULL,
  body_md text NOT NULL,
  cefr text NOT NULL DEFAULT 'A1',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.grammar_notes TO authenticated;
GRANT ALL ON public.grammar_notes TO service_role;
ALTER TABLE public.grammar_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "grammar_notes readable by authed" ON public.grammar_notes FOR SELECT TO authenticated USING (true);

-- Learner FSRS-lite state per chunk
CREATE TABLE public.learner_chunks (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chunk_id uuid NOT NULL REFERENCES public.chunks(id) ON DELETE CASCADE,
  stability real NOT NULL DEFAULT 1.0,
  difficulty real NOT NULL DEFAULT 5.0,
  reps int NOT NULL DEFAULT 0,
  lapses int NOT NULL DEFAULT 0,
  last_grade int,
  last_reviewed_at timestamptz,
  due_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, chunk_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learner_chunks TO authenticated;
GRANT ALL ON public.learner_chunks TO service_role;
ALTER TABLE public.learner_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "learner_chunks own read" ON public.learner_chunks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "learner_chunks own insert" ON public.learner_chunks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "learner_chunks own update" ON public.learner_chunks FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "learner_chunks own delete" ON public.learner_chunks FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_learner_chunks_due ON public.learner_chunks (user_id, due_at);

-- Sessions
CREATE TABLE public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language_code text NOT NULL REFERENCES public.languages(code) ON DELETE RESTRICT,
  theme_id uuid REFERENCES public.themes(id) ON DELETE SET NULL,
  dialogue_id uuid REFERENCES public.dialogues(id) ON DELETE SET NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sessions TO authenticated;
GRANT ALL ON public.sessions TO service_role;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions own all" ON public.sessions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Session events
CREATE TABLE public.session_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step text NOT NULL,
  chunk_id uuid REFERENCES public.chunks(id) ON DELETE SET NULL,
  grade int,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.session_events TO authenticated;
GRANT ALL ON public.session_events TO service_role;
ALTER TABLE public.session_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "session_events own read" ON public.session_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "session_events own insert" ON public.session_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Learner-language preferences
CREATE TABLE public.learner_languages (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language_code text NOT NULL REFERENCES public.languages(code) ON DELETE CASCADE,
  cefr_target text NOT NULL DEFAULT 'B1',
  started_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, language_code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learner_languages TO authenticated;
GRANT ALL ON public.learner_languages TO service_role;
ALTER TABLE public.learner_languages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "learner_languages own all" ON public.learner_languages FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- updated_at trigger for learner_chunks
CREATE TRIGGER trg_learner_chunks_updated_at
  BEFORE UPDATE ON public.learner_chunks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Italian pack v1 seed
-- ============================================================
INSERT INTO public.languages (code, name, script, rtl) VALUES ('it', 'Italian', 'latin', false);

INSERT INTO public.themes (id, language_code, slug, title, description, cefr, sort_order) VALUES
  ('11111111-1111-1111-1111-111111111111', 'it', 'al-bar', 'Al bar', 'Order coffee and pastries like a local.', 'A1', 1),
  ('22222222-2222-2222-2222-222222222222', 'it', 'presentarsi', 'Presentarsi', 'Introduce yourself and greet people warmly.', 'A1', 2);

-- Chunks for Al bar
INSERT INTO public.chunks (id, language_code, text, gloss, ipa, cefr, tags, register) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'it', 'Un caffè, per favore.', 'A coffee, please.', 'un kafˈfɛ per faˈvoːre', 'A1', ARRAY['bar','request'], 'lei'),
  ('a1000000-0000-0000-0000-000000000002', 'it', 'Buongiorno!', 'Good morning!', 'bwonˈdʒorno', 'A1', ARRAY['greeting'], 'lei'),
  ('a1000000-0000-0000-0000-000000000003', 'it', 'Vorrei un cornetto.', 'I would like a croissant.', 'vorˈrɛi un korˈnetto', 'A1', ARRAY['bar','request'], 'lei'),
  ('a1000000-0000-0000-0000-000000000004', 'it', 'Quanto costa?', 'How much does it cost?', 'ˈkwanto ˈkɔsta', 'A1', ARRAY['money'], 'lei'),
  ('a1000000-0000-0000-0000-000000000005', 'it', 'Grazie mille!', 'Thanks a lot!', 'ˈɡrattsje ˈmille', 'A1', ARRAY['gratitude'], 'lei'),
  ('a1000000-0000-0000-0000-000000000006', 'it', 'Il conto, per favore.', 'The check, please.', 'il ˈkonto per faˈvoːre', 'A1', ARRAY['bar','money'], 'lei');

-- Chunks for Presentarsi
INSERT INTO public.chunks (id, language_code, text, gloss, ipa, cefr, tags, register) VALUES
  ('b2000000-0000-0000-0000-000000000001', 'it', 'Mi chiamo Marco.', 'My name is Marco.', 'mi ˈkjaːmo ˈmarko', 'A1', ARRAY['introduction'], 'tu'),
  ('b2000000-0000-0000-0000-000000000002', 'it', 'Piacere di conoscerti.', 'Nice to meet you.', 'pjaˈtʃeːre di konoʃˈʃerti', 'A1', ARRAY['introduction'], 'tu'),
  ('b2000000-0000-0000-0000-000000000003', 'it', 'Di dove sei?', 'Where are you from?', 'di ˈdoːve ˈsɛi', 'A1', ARRAY['introduction'], 'tu'),
  ('b2000000-0000-0000-0000-000000000004', 'it', 'Sono di Roma.', 'I am from Rome.', 'ˈsoːno di ˈroːma', 'A1', ARRAY['introduction'], 'tu');

-- Dialogue for Al bar
INSERT INTO public.dialogues (id, theme_id, title, scenario, cultural_note, turns) VALUES
  ('d1000000-0000-0000-0000-000000000001',
   '11111111-1111-1111-1111-111111111111',
   'Al bar di Piazza Navona',
   'You walk into a bustling Roman bar for a morning coffee.',
   'In Italy, "un caffè" always means espresso. Order at the register first, then present the receipt to the barista.',
   '[
     {"speaker":"barista","text":"Buongiorno! Prego?","gloss":"Good morning! What can I get you?"},
     {"speaker":"you","text":"Buongiorno! Un caffè, per favore.","gloss":"Good morning! A coffee, please."},
     {"speaker":"barista","text":"Subito. Qualcos''altro?","gloss":"Right away. Anything else?"},
     {"speaker":"you","text":"Vorrei un cornetto. Quanto costa?","gloss":"I''d like a croissant. How much is it?"},
     {"speaker":"barista","text":"Due euro e cinquanta.","gloss":"Two fifty."},
     {"speaker":"you","text":"Grazie mille!","gloss":"Thanks a lot!"}
   ]'::jsonb);

INSERT INTO public.dialogue_chunks (dialogue_id, chunk_id, position) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', 0),
  ('d1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 1),
  ('d1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003', 2),
  ('d1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000004', 3),
  ('d1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000005', 4),
  ('d1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000006', 5);

-- Dialogue for Presentarsi
INSERT INTO public.dialogues (id, theme_id, title, scenario, cultural_note, turns) VALUES
  ('d2000000-0000-0000-0000-000000000001',
   '22222222-2222-2222-2222-222222222222',
   'Un incontro a Trastevere',
   'You meet someone new at an evening aperitivo.',
   'Italians typically use "tu" among peers and in casual settings. Switch to "Lei" for elders, strangers in shops, and formal contexts.',
   '[
     {"speaker":"marco","text":"Ciao! Mi chiamo Marco.","gloss":"Hi! My name is Marco."},
     {"speaker":"you","text":"Piacere di conoscerti. Di dove sei?","gloss":"Nice to meet you. Where are you from?"},
     {"speaker":"marco","text":"Sono di Roma. E tu?","gloss":"I''m from Rome. And you?"}
   ]'::jsonb);

INSERT INTO public.dialogue_chunks (dialogue_id, chunk_id, position) VALUES
  ('d2000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000001', 0),
  ('d2000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000002', 1),
  ('d2000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000003', 2),
  ('d2000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000004', 3);

-- Grammar notes
INSERT INTO public.grammar_notes (language_code, title, body_md, cefr) VALUES
  ('it', 'Formal vs informal: tu / Lei',
   'Italian distinguishes an informal **tu** (friends, peers) from a formal **Lei** (strangers, shops, elders). Verbs change: *"Come stai?"* (tu) vs *"Come sta?"* (Lei).',
   'A1'),
  ('it', 'Definite articles',
   'The word for "the" agrees in gender and number: **il** (m.sg.), **la** (f.sg.), **i** (m.pl.), **le** (f.pl.). Use **lo** before z / s+consonant / gn / ps.',
   'A1');
