import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  getTeamSession,
  getAdminData,
  submitAnswer,
  saveTeamSession,
  onBroadcast,
  shuffleArray,
  eliminateTeam,
} from "@/lib/quizStore";
import { Question, Team } from "@/types/quiz";
import { Button } from "@/components/ui/button";

const StudentQuiz = () => {
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [quizActive, setQuizActive] = useState(false);
  const [eliminated, setEliminated] = useState(false);
  const [waiting, setWaiting] = useState(true);
  const shuffledRef = useRef(false);

  // Load team session
  useEffect(() => {
    const session = getTeamSession();
    if (!session) {
      navigate("/student");
      return;
    }
    setTeam(session);
    setAnswers(session.answers || {});
  }, [navigate]);

  // Poll for quiz state
  const syncQuizState = useCallback(() => {
    if (!team) return;
    const data = getAdminData();
    const teamData = data.teams.find((t) => t.id === team.id);

    if (teamData?.eliminated) {
      setEliminated(true);
      return;
    }

    if (data.quizState.isQuizActive && data.quizState.activeBundle) {
      const bundle = data.bundles.find((b) => b.id === data.quizState.activeBundle);
      if (bundle && !shuffledRef.current) {
        setQuestions(shuffleArray(bundle.questions));
        shuffledRef.current = true;
      }
      setQuizActive(true);
      setWaiting(false);

      // Calculate time left
      if (data.quizState.timerStartedAt && !data.quizState.timerPaused) {
        const elapsed = Math.floor((Date.now() - data.quizState.timerStartedAt) / 1000);
        const remaining = Math.max(0, data.quizState.timerDuration - elapsed);
        setTimeLeft(remaining);
        if (remaining === 0) {
          setQuizActive(false);
        }
      }
    } else {
      setQuizActive(false);
      setWaiting(true);
      shuffledRef.current = false;
    }
  }, [team]);

  useEffect(() => {
    syncQuizState();
    const interval = setInterval(syncQuizState, 1000);
    const unsub = onBroadcast((msg) => {
      if (msg.type === "QUIZ_STARTED" || msg.type === "QUIZ_STOPPED" || msg.type === "ADMIN_DATA_UPDATED") {
        shuffledRef.current = false;
        syncQuizState();
      }
      if (msg.type === "TEAM_ELIMINATED" && msg.data === team?.id) {
        setEliminated(true);
      }
    });
    return () => {
      clearInterval(interval);
      unsub();
    };
  }, [syncQuizState, team?.id]);

  // Anti-cheat: detect tab switch / minimize
  useEffect(() => {
    if (!quizActive || !team) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setEliminated(true);
        eliminateTeam(team.id);
      }
    };

    const handleBlur = () => {
      setEliminated(true);
      eliminateTeam(team.id);
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [quizActive, team]);

  const [submitted, setSubmitted] = useState(false);

  const handleSelectAnswer = (index: number) => {
    if (!team || !questions[currentIndex] || !quizActive || submitted) return;
    setSelectedAnswer(index);
    const qId = questions[currentIndex].id;
    const newAnswers = { ...answers, [qId]: index };
    setAnswers(newAnswers);
    submitAnswer(team.id, qId, index);

    // Update session with fresh team data
    const freshData = getAdminData();
    const freshTeam = freshData.teams.find((t) => t.id === team.id);
    if (freshTeam) {
      saveTeamSession(freshTeam);
      setTeam(freshTeam);
    }
  };

  const handleFinalSubmit = () => {
    if (!team) return;
    // Ensure all answers are saved
    const freshData = getAdminData();
    const freshTeam = freshData.teams.find((t) => t.id === team.id);
    if (freshTeam) {
      saveTeamSession(freshTeam);
      setTeam(freshTeam);
    }
    setSubmitted(true);
  };

  const goNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(answers[questions[currentIndex + 1]?.id] ?? null);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelectedAnswer(answers[questions[currentIndex - 1]?.id] ?? null);
    }
  };

  // Format timer
  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // ELIMINATED screen
  if (eliminated) {
    return (
      <div className="min-h-screen eliminated-overlay flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-6xl md:text-8xl font-display font-black text-destructive animate-pulse-neon">
            ELIMINATED
          </h1>
          <p className="text-xl font-body text-destructive-foreground">
            You left the quiz tab. Your team has been disqualified.
          </p>
        </div>
      </div>
    );
  }

  // WAITING screen
  if (waiting) {
    return (
      <div className="min-h-screen grid-bg flex items-center justify-center p-4">
        <div className="text-center space-y-6">
          <h1 className="text-3xl md:text-4xl font-display font-bold neon-text text-primary">
            ZENTHORIX
          </h1>
          <div className="glass rounded-lg p-8 neon-border max-w-sm mx-auto space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-lg font-body text-foreground">
              Welcome, <span className="text-primary font-bold">{team?.teamName}</span>
            </p>
            <p className="text-muted-foreground font-body">
              Waiting for the admin to start the quiz...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  if (!currentQ) return null;

  const optionLabels = ["A", "B", "C", "D"];

  return (
    <div className="min-h-screen grid-bg flex flex-col">
      {/* Header */}
      <header className="glass border-b border-border px-4 py-3 flex items-center justify-between">
        <div>
          <span className="font-display text-sm text-primary font-bold">ZENTHORIX</span>
          <span className="text-muted-foreground text-sm ml-2 font-body">| {team?.teamName}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground font-body">
            {currentIndex + 1} / {questions.length}
          </span>
          {timeLeft !== null && (
            <span
              className={`font-display font-bold text-lg tabular-nums ${
                timeLeft <= 30 ? "text-destructive animate-pulse-neon" : "text-primary neon-text"
              }`}
            >
              {formatTime(timeLeft)}
            </span>
          )}
        </div>
      </header>

      {/* Question */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 max-w-2xl mx-auto w-full">
        <div className="glass rounded-lg p-6 w-full space-y-6 neon-border">
          <h2 className="text-xl md:text-2xl font-body font-semibold text-foreground leading-relaxed">
            {currentQ.text}
          </h2>

          <div className="space-y-3">
            {currentQ.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleSelectAnswer(i)}
                className={`w-full text-left p-4 rounded-lg border font-body text-lg transition-all flex items-center gap-3 ${
                  selectedAnswer === i
                    ? "border-primary bg-primary/10 neon-border"
                    : "border-border bg-muted/30 hover:bg-muted/50 hover:border-muted-foreground/30"
                }`}
              >
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-display font-bold shrink-0 ${
                    selectedAnswer === i
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {optionLabels[i]}
                </span>
                <span className={selectedAnswer === i ? "text-foreground" : "text-muted-foreground"}>
                  {opt}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-4 mt-6">
          <Button
            variant="outline"
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="font-display tracking-wider border-border text-muted-foreground hover:text-foreground"
          >
            ← PREV
          </Button>
          <Button
            variant="outline"
            onClick={goNext}
            disabled={currentIndex === questions.length - 1}
            className="font-display tracking-wider border-border text-muted-foreground hover:text-foreground"
          >
            NEXT →
          </Button>
        </div>

        {/* Question dots */}
        <div className="flex flex-wrap gap-2 mt-6 justify-center">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => {
                setCurrentIndex(i);
                setSelectedAnswer(answers[q.id] ?? null);
              }}
              className={`w-8 h-8 rounded-full text-xs font-display font-bold transition-all ${
                i === currentIndex
                  ? "bg-primary text-primary-foreground neon-border"
                  : answers[q.id] !== undefined
                  ? "bg-secondary/30 text-secondary border border-secondary/50"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default StudentQuiz;
