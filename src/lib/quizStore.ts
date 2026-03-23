import { supabase } from "@/integrations/supabase/client";
import { QuestionBundle, Question, Team, QuizState, ADMIN_PASSWORD } from "@/types/quiz";

// ─── Bundle operations ───

export async function fetchBundles(): Promise<QuestionBundle[]> {
  const { data: bundles, error } = await supabase
    .from("bundles")
    .select("id, name")
    .order("created_at", { ascending: true });

  if (error || !bundles) return [];

  const { data: questions } = await supabase
    .from("questions")
    .select("id, bundle_id, text, options, correct_answer, sort_order")
    .order("sort_order", { ascending: true });

  return bundles.map((b) => ({
    id: b.id,
    name: b.name,
    questions: (questions || [])
      .filter((q) => q.bundle_id === b.id)
      .map((q) => ({
        id: q.id,
        text: q.text,
        options: q.options,
        correctAnswer: q.correct_answer,
      })),
  }));
}

export async function addBundle(bundle: QuestionBundle) {
  const { error } = await supabase.from("bundles").insert({ id: bundle.id, name: bundle.name });
  if (error) throw error;

  if (bundle.questions.length > 0) {
    const rows = bundle.questions.map((q, i) => ({
      id: q.id,
      bundle_id: bundle.id,
      text: q.text,
      options: q.options,
      correct_answer: q.correctAnswer,
      sort_order: i,
    }));
    const { error: qErr } = await supabase.from("questions").insert(rows);
    if (qErr) throw qErr;
  }
}

export async function updateBundle(bundle: QuestionBundle) {
  await supabase.from("bundles").update({ name: bundle.name }).eq("id", bundle.id);
  // Delete old questions and re-insert
  await supabase.from("questions").delete().eq("bundle_id", bundle.id);
  if (bundle.questions.length > 0) {
    const rows = bundle.questions.map((q, i) => ({
      id: q.id,
      bundle_id: bundle.id,
      text: q.text,
      options: q.options,
      correct_answer: q.correctAnswer,
      sort_order: i,
    }));
    await supabase.from("questions").insert(rows);
  }
}

export async function deleteBundle(bundleId: string) {
  // Clear active bundle if it's the one being deleted
  const state = await fetchQuizState();
  if (state.activeBundle === bundleId) {
    await supabase.from("quiz_state").update({ active_bundle: null, is_quiz_active: false }).eq("id", 1);
  }
  await supabase.from("bundles").delete().eq("id", bundleId);
}

// ─── Quiz state operations ───

export async function fetchQuizState(): Promise<QuizState> {
  const { data } = await supabase.from("quiz_state").select("*").eq("id", 1).single();
  if (!data) return { activeBundle: null, isQuizActive: false, timerDuration: 300, timerStartedAt: null, timerPaused: false };
  return {
    activeBundle: data.active_bundle,
    isQuizActive: data.is_quiz_active,
    timerDuration: data.timer_duration,
    timerStartedAt: data.timer_started_at ? Number(data.timer_started_at) : null,
    timerPaused: data.timer_paused,
  };
}

export async function setActiveBundle(bundleId: string | null) {
  await supabase.from("quiz_state").update({ active_bundle: bundleId }).eq("id", 1);
}

export async function startQuiz() {
  await supabase.from("quiz_state").update({
    is_quiz_active: true,
    timer_started_at: Date.now(),
    timer_paused: false,
  }).eq("id", 1);
}

export async function stopQuiz() {
  await supabase.from("quiz_state").update({
    is_quiz_active: false,
    timer_started_at: null,
    timer_paused: false,
  }).eq("id", 1);
}

export async function setTimerDuration(seconds: number) {
  await supabase.from("quiz_state").update({ timer_duration: seconds }).eq("id", 1);
}

// ─── Team operations ───

export async function fetchTeams(): Promise<Team[]> {
  const { data: teams } = await supabase
    .from("teams")
    .select("*")
    .order("joined_at", { ascending: true });

  if (!teams) return [];

  const { data: answers } = await supabase.from("answers").select("team_id, question_id, selected_option");

  return teams.map((t) => {
    const teamAnswers: Record<string, number> = {};
    (answers || []).filter((a) => a.team_id === t.id).forEach((a) => {
      teamAnswers[a.question_id] = a.selected_option;
    });
    return {
      id: t.id,
      teamName: t.team_name,
      collegeName: t.college_name,
      year: t.year,
      eliminated: t.eliminated,
      answers: teamAnswers,
      score: t.score,
      joinedAt: new Date(t.joined_at).getTime(),
    };
  });
}

export async function registerTeam(info: { teamName: string; collegeName: string; year: string }): Promise<Team> {
  const { data, error } = await supabase
    .from("teams")
    .insert({ team_name: info.teamName, college_name: info.collegeName, year: info.year })
    .select()
    .single();
  if (error || !data) throw error || new Error("Failed to register team");
  return {
    id: data.id,
    teamName: data.team_name,
    collegeName: data.college_name,
    year: data.year,
    eliminated: data.eliminated,
    answers: {},
    score: data.score,
    joinedAt: new Date(data.joined_at).getTime(),
  };
}

export async function eliminateTeam(teamId: string) {
  await supabase.from("teams").update({ eliminated: true }).eq("id", teamId);
}

export async function submitAnswer(teamId: string, questionId: string, answerIndex: number) {
  await supabase.from("answers").upsert(
    { team_id: teamId, question_id: questionId, selected_option: answerIndex },
    { onConflict: "team_id,question_id" }
  );
}

export async function recalculateScore(teamId: string) {
  // Get team's answers and the active bundle questions
  const state = await fetchQuizState();
  if (!state.activeBundle) return;

  const { data: questions } = await supabase
    .from("questions")
    .select("id, correct_answer")
    .eq("bundle_id", state.activeBundle);

  const { data: answers } = await supabase
    .from("answers")
    .select("question_id, selected_option")
    .eq("team_id", teamId);

  if (!questions || !answers) return;

  let score = 0;
  for (const q of questions) {
    const ans = answers.find((a) => a.question_id === q.id);
    if (ans && ans.selected_option === q.correct_answer) score++;
  }

  await supabase.from("teams").update({ score }).eq("id", teamId);
}

export async function clearAllTeams() {
  await supabase.from("teams").delete().neq("id", "00000000-0000-0000-0000-000000000000");
}

// ─── Team session (localStorage for current tab only) ───

const TEAM_SESSION_KEY = "zenthorix_team_session";

export function getTeamSession(): { id: string } | null {
  try {
    const raw = localStorage.getItem(TEAM_SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function saveTeamSession(teamId: string) {
  localStorage.setItem(TEAM_SESSION_KEY, JSON.stringify({ id: teamId }));
}

export function clearTeamSession() {
  localStorage.removeItem(TEAM_SESSION_KEY);
}

// Shuffle array (Fisher-Yates)
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
