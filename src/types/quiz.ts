export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
}

export interface QuestionBundle {
  id: string;
  name: string;
  questions: Question[];
}

export interface Team {
  id: string;
  teamName: string;
  collegeName: string;
  year: string;
  phoneNumber: string;
  eliminated: boolean;
  answers: Record<string, number>;
  score: number;
  joinedAt: number;
  currentRound: number;
  selectedForRound2: boolean;
}

export interface QuizState {
  activeBundle: string | null;
  isQuizActive: boolean;
  timerDuration: number; // seconds PER QUESTION
  timerStartedAt: number | null;
  timerPaused: boolean;
}

export interface AdminData {
  bundles: QuestionBundle[];
  teams: Team[];
  quizState: QuizState;
  adminPassword: string;
}

export const ADMIN_PASSWORD = "zenthorix2026";

export const STORAGE_KEYS = {
  ADMIN_DATA: "zenthorix_admin_data",
  TEAM_SESSION: "zenthorix_team_session",
  QUIZ_CHANNEL: "zenthorix_quiz_channel",
} as const;
