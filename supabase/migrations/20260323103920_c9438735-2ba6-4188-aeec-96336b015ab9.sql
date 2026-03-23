
-- Create bundles table
CREATE TABLE public.bundles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create questions table
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bundle_id UUID NOT NULL REFERENCES public.bundles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  options TEXT[] NOT NULL,
  correct_answer INTEGER NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz_state table (single row)
CREATE TABLE public.quiz_state (
  id INTEGER NOT NULL DEFAULT 1 PRIMARY KEY CHECK (id = 1),
  active_bundle UUID REFERENCES public.bundles(id) ON DELETE SET NULL,
  is_quiz_active BOOLEAN NOT NULL DEFAULT false,
  timer_duration INTEGER NOT NULL DEFAULT 300,
  timer_started_at BIGINT,
  timer_paused BOOLEAN NOT NULL DEFAULT false
);

-- Insert default quiz state
INSERT INTO public.quiz_state (id) VALUES (1);

-- Create teams table
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_name TEXT NOT NULL,
  college_name TEXT NOT NULL,
  year TEXT NOT NULL,
  eliminated BOOLEAN NOT NULL DEFAULT false,
  score INTEGER NOT NULL DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create answers table
CREATE TABLE public.answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, question_id)
);

-- Enable RLS on all tables
ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (no auth - quiz app uses fixed admin password)
CREATE POLICY "Anyone can read bundles" ON public.bundles FOR SELECT USING (true);
CREATE POLICY "Anyone can insert bundles" ON public.bundles FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update bundles" ON public.bundles FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete bundles" ON public.bundles FOR DELETE USING (true);

CREATE POLICY "Anyone can read questions" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert questions" ON public.questions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update questions" ON public.questions FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete questions" ON public.questions FOR DELETE USING (true);

CREATE POLICY "Anyone can read quiz_state" ON public.quiz_state FOR SELECT USING (true);
CREATE POLICY "Anyone can update quiz_state" ON public.quiz_state FOR UPDATE USING (true);

CREATE POLICY "Anyone can read teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Anyone can insert teams" ON public.teams FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update teams" ON public.teams FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete teams" ON public.teams FOR DELETE USING (true);

CREATE POLICY "Anyone can read answers" ON public.answers FOR SELECT USING (true);
CREATE POLICY "Anyone can insert answers" ON public.answers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update answers" ON public.answers FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete answers" ON public.answers FOR DELETE USING (true);

-- Create indexes
CREATE INDEX idx_questions_bundle_id ON public.questions(bundle_id);
CREATE INDEX idx_answers_team_id ON public.answers(team_id);
CREATE INDEX idx_answers_question_id ON public.answers(question_id);
