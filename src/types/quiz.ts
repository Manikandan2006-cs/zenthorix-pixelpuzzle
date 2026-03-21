export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number; // index of correct option
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
  eliminated: boolean;
  answers: Record<string, number>; // questionId -> selectedOption index
  score: number;
  joinedAt: number;
}

export interface QuizState {
  activeBundle: string | null; // bundle id
  isQuizActive: boolean;
  timerDuration: number; // seconds
  timerStartedAt: number | null; // timestamp
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
