import { AdminData, Team, QuestionBundle, QuizState, STORAGE_KEYS } from "@/types/quiz";

const defaultQuizState: QuizState = {
  activeBundle: null,
  isQuizActive: false,
  timerDuration: 300,
  timerStartedAt: null,
  timerPaused: false,
};

const defaultAdminData: AdminData = {
  bundles: [],
  teams: [],
  quizState: defaultQuizState,
  adminPassword: "zenthorix2026",
};

// BroadcastChannel for cross-tab sync
let channel: BroadcastChannel | null = null;
try {
  channel = new BroadcastChannel(STORAGE_KEYS.QUIZ_CHANNEL);
} catch {
  console.warn("BroadcastChannel not supported");
}

export function broadcastUpdate(type: string, data?: unknown) {
  channel?.postMessage({ type, data, timestamp: Date.now() });
}

export function onBroadcast(callback: (msg: { type: string; data?: unknown }) => void) {
  if (!channel) return () => {};
  const handler = (e: MessageEvent) => callback(e.data);
  channel.addEventListener("message", handler);
  return () => channel?.removeEventListener("message", handler);
}

// Admin data operations
export function getAdminData(): AdminData {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ADMIN_DATA);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { ...defaultAdminData };
}

export function saveAdminData(data: AdminData) {
  localStorage.setItem(STORAGE_KEYS.ADMIN_DATA, JSON.stringify(data));
  broadcastUpdate("ADMIN_DATA_UPDATED", data);
}

// Bundle operations
export function addBundle(bundle: QuestionBundle) {
  const data = getAdminData();
  data.bundles.push(bundle);
  saveAdminData(data);
}

export function updateBundle(bundle: QuestionBundle) {
  const data = getAdminData();
  const idx = data.bundles.findIndex((b) => b.id === bundle.id);
  if (idx >= 0) data.bundles[idx] = bundle;
  saveAdminData(data);
}

export function deleteBundle(bundleId: string) {
  const data = getAdminData();
  data.bundles = data.bundles.filter((b) => b.id !== bundleId);
  if (data.quizState.activeBundle === bundleId) {
    data.quizState.activeBundle = null;
    data.quizState.isQuizActive = false;
  }
  saveAdminData(data);
}

// Quiz state operations
export function setActiveBundle(bundleId: string | null) {
  const data = getAdminData();
  data.quizState.activeBundle = bundleId;
  saveAdminData(data);
}

export function startQuiz() {
  const data = getAdminData();
  data.quizState.isQuizActive = true;
  data.quizState.timerStartedAt = Date.now();
  data.quizState.timerPaused = false;
  saveAdminData(data);
  broadcastUpdate("QUIZ_STARTED");
}

export function stopQuiz() {
  const data = getAdminData();
  data.quizState.isQuizActive = false;
  data.quizState.timerStartedAt = null;
  data.quizState.timerPaused = false;
  saveAdminData(data);
  broadcastUpdate("QUIZ_STOPPED");
}

export function setTimerDuration(seconds: number) {
  const data = getAdminData();
  data.quizState.timerDuration = seconds;
  saveAdminData(data);
}

// Team operations
export function registerTeam(team: Omit<Team, "id" | "eliminated" | "answers" | "score" | "joinedAt">): Team {
  const data = getAdminData();
  const newTeam: Team = {
    ...team,
    id: crypto.randomUUID(),
    eliminated: false,
    answers: {},
    score: 0,
    joinedAt: Date.now(),
  };
  data.teams.push(newTeam);
  saveAdminData(data);
  return newTeam;
}

export function eliminateTeam(teamId: string) {
  const data = getAdminData();
  const team = data.teams.find((t) => t.id === teamId);
  if (team) team.eliminated = true;
  saveAdminData(data);
  broadcastUpdate("TEAM_ELIMINATED", teamId);
}

export function submitAnswer(teamId: string, questionId: string, answerIndex: number) {
  const data = getAdminData();
  const team = data.teams.find((t) => t.id === teamId);
  if (!team) return;
  team.answers[questionId] = answerIndex;

  // Calculate score
  const activeBundle = data.bundles.find((b) => b.id === data.quizState.activeBundle);
  if (activeBundle) {
    let score = 0;
    for (const q of activeBundle.questions) {
      if (team.answers[q.id] === q.correctAnswer) score++;
    }
    team.score = score;
  }

  saveAdminData(data);
}

// Team session
export function getTeamSession(): Team | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TEAM_SESSION);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function saveTeamSession(team: Team) {
  localStorage.setItem(STORAGE_KEYS.TEAM_SESSION, JSON.stringify(team));
}

export function clearTeamSession() {
  localStorage.removeItem(STORAGE_KEYS.TEAM_SESSION);
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

// Clear all teams
export function clearAllTeams() {
  const data = getAdminData();
  data.teams = [];
  saveAdminData(data);
}
