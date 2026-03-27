import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  getTeamSession,
  fetchQuizState,
  fetchBundles,
  fetchTeams,
  submitAnswer,
  recalculateScore,
  eliminateTeam,
  shuffleArray,
} from "@/lib/quizStore";
import { Question, Team } from "@/types/quiz";
import { Button } from "@/components/ui/button";

const StudentQuiz = () => {
  const navigate = useNavigate();
  const [teamId, setTeamId] = useState<string | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [lockedQuestions, setLockedQuestions] = useState<Set<string>>(new Set());
  const [perQuestionTime, setPerQuestionTime] = useState(15);
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number | null>(null);
  const [quizActive, setQuizActive] = useState(false);
  const [eliminated, setEliminated] = useState(false);
  const [waiting, setWaiting] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const shuffledRef = useRef(false);
  const questionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const questionStartRef = useRef<number | null>(null);

  useEffect(() => {
    const session = getTeamSession();
    if (!session) {
      navigate("/student");
      return;
    }
    setTeamId(session.id);
  }, [navigate]);

  const startQuestionTimer = useCallback((duration: number) => {
    if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    questionStartRef.current = Date.now();
    setQuestionTimeLeft(duration);

    questionTimerRef.current = setInterval(() => {
      if (!questionStartRef.current) return;
      const elapsed = Math.floor((Date.now() - questionStartRef.current) / 1000);
      const remaining = Math.max(0, duration - elapsed);
      setQuestionTimeLeft(remaining);
      if (remaining === 0) {
        if (questionTimerRef.current) clearInterval(questionTimerRef.current);
      }
    }, 200);
  }, []);

  // When time runs out, lock the question and auto-advance
  useEffect(() => {
    if (questionTimeLeft === 0 && quizActive && !submitted && !reviewMode) {
      const currentQ = questions[currentIndex];
      if (currentQ) {
        setLockedQuestions((prev) => new Set(prev).add(currentQ.id));
      }

      if (currentIndex < questions.length - 1) {
        const nextIdx = currentIndex + 1;
        // Skip to next unlocked question
        let targetIdx = nextIdx;
        while (targetIdx < questions.length && lockedQuestions.has(questions[targetIdx].id)) {
          targetIdx++;
        }
        if (targetIdx < questions.length) {
          setCurrentIndex(targetIdx);
          setSelectedAnswer(answers[questions[targetIdx]?.id] ?? null);
          startQuestionTimer(perQuestionTime);
        } else {
          // All done
          if (teamId) {
            recalculateScore(teamId);
            setSubmitted(true);
          }
        }
      } else {
        if (teamId) {
          recalculateScore(teamId);
          setSubmitted(true);
        }
      }
    }
  }, [questionTimeLeft, quizActive, submitted, reviewMode, currentIndex, questions, answers, perQuestionTime, startQuestionTimer, teamId, lockedQuestions]);

  const syncQuizState = useCallback(async () => {
    if (!teamId) return;

    const [quizState, bundles, teams] = await Promise.all([
      fetchQuizState(),
      fetchBundles(),
      fetchTeams(),
    ]);

    const teamData = teams.find((t) => t.id === teamId);
    if (teamData) {
      setTeam(teamData);
      if (teamData.eliminated) {
        setEliminated(true);
        return;
      }
    }

    if (quizState.isQuizActive && quizState.activeBundle) {
      const bundle = bundles.find((b) => b.id === quizState.activeBundle);
      if (bundle && !shuffledRef.current) {
        setQuestions(shuffleArray(bundle.questions));
        shuffledRef.current = true;
        setPerQuestionTime(quizState.timerDuration);
        startQuestionTimer(quizState.timerDuration);
      }
      setQuizActive(true);
      setWaiting(false);
    } else {
      if (!quizActive) {
        setWaiting(true);
        shuffledRef.current = false;
      }
    }
  }, [teamId, quizActive, submitted, startQuestionTimer]);

  useEffect(() => {
    syncQuizState();
    const interval = setInterval(syncQuizState, 2000);
    return () => clearInterval(interval);
  }, [syncQuizState]);

  useEffect(() => {
    return () => {
      if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    };
  }, []);

  // Anti-cheat
  useEffect(() => {
    if (!quizActive || !teamId) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setEliminated(true);
        eliminateTeam(teamId);
      }
    };
    const handleBlur = () => {
      setEliminated(true);
      eliminateTeam(teamId);
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
  }, [quizActive, teamId]);

  const handleSelectAnswer = async (index: number) => {
    if (!teamId || !questions[currentIndex] || !quizActive || submitted || reviewMode) return;
    const qId = questions[currentIndex].id;
    // If question is already locked (answered or timed out), don't allow changes
    if (lockedQuestions.has(qId)) return;

    setSelectedAnswer(index);
    const newAnswers = { ...answers, [qId]: index };
    setAnswers(newAnswers);
    // Lock the question after answering
    setLockedQuestions((prev) => new Set(prev).add(qId));
    await submitAnswer(teamId, qId, index);
    await recalculateScore(teamId);
  };

  const handleFinalSubmit = async () => {
    if (!teamId) return;
    await recalculateScore(teamId);
    setSubmitted(true);
    if (questionTimerRef.current) clearInterval(questionTimerRef.current);
  };

  const goToQuestion = (idx: number) => {
    setCurrentIndex(idx);
    setSelectedAnswer(answers[questions[idx]?.id] ?? null);
    const qId = questions[idx]?.id;
    if (submitted || reviewMode || lockedQuestions.has(qId)) {
      // Review mode — no timer
      if (questionTimerRef.current) clearInterval(questionTimerRef.current);
      setQuestionTimeLeft(null);
    } else {
      startQuestionTimer(perQuestionTime);
    }
  };

  const goNext = () => {
    if (currentIndex < questions.length - 1) goToQuestion(currentIndex + 1);
  };

  const goPrev = () => {
    if (currentIndex > 0) goToQuestion(currentIndex - 1);
  };

  if (eliminated) {
    return (
      <div className="min-h-screen eliminated-overlay flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-7xl font-display font-bold text-destructive">Eliminated</h1>
          <p className="text-lg font-body text-muted-foreground">
            You left the quiz tab. Your team has been disqualified.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    const answeredCount = Object.keys(answers).length;
    return (
      <div className="min-h-screen soft-bg flex items-center justify-center p-4">
        <div className="text-center space-y-6 w-full max-w-md">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <span className="text-3xl">✓</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Submitted</h1>
          <div className="card-surface subtle-shadow-lg p-6 space-y-3">
            <p className="text-base font-body text-foreground">
              Team: <span className="font-semibold text-primary">{team?.teamName}</span>
            </p>
            <p className="text-muted-foreground font-body text-sm">
              You answered {answeredCount} of {questions.length} questions.
            </p>
            <p className="text-xs text-muted-foreground font-body">
              Results will be announced by the admin.
            </p>
          </div>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button
              variant="outline"
              onClick={() => setReviewMode(true)}
              className="font-display tracking-wide"
            >
              Review Your Answers
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                import("@/lib/quizStore").then(({ clearTeamSession }) => {
                  clearTeamSession();
                  navigate("/student");
                });
              }}
              className="font-display tracking-wide"
            >
              Back to Login
            </Button>
          </div>
          {reviewMode && (
            <div className="text-left space-y-3 mt-4">
              {questions.map((q, i) => (
                <div key={q.id} className="card-surface subtle-shadow p-4 space-y-2">
                  <p className="font-body text-sm font-medium text-foreground">
                    {i + 1}. {q.text}
                  </p>
                  <div className="space-y-1">
                    {q.options.map((opt, oi) => (
                      <div
                        key={oi}
                        className={`text-sm font-body px-3 py-1.5 rounded ${
                          answers[q.id] === oi
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground"
                        }`}
                      >
                        {["A", "B", "C", "D"][oi]}. {opt}
                        {answers[q.id] === oi && " ✓"}
                      </div>
                    ))}
                    {answers[q.id] === undefined && (
                      <p className="text-xs text-muted-foreground italic">Not answered</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (waiting) {
    return (
      <div className="min-h-screen soft-bg flex items-center justify-center p-4">
        <div className="text-center space-y-6">
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Zenthorix</h1>
          <div className="card-surface subtle-shadow-lg p-6 max-w-sm mx-auto space-y-4">
            <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-base font-body text-foreground">
              Welcome, <span className="font-semibold text-primary">{team?.teamName}</span>
            </p>
            <p className="text-muted-foreground font-body text-sm">
              Waiting for the admin to start the quiz...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  if (!currentQ) return null;

  const isCurrentLocked = lockedQuestions.has(currentQ.id);
  const optionLabels = ["A", "B", "C", "D"];
  const timePercent = perQuestionTime > 0 ? ((questionTimeLeft ?? 0) / perQuestionTime) * 100 : 0;

  return (
    <div className="min-h-screen soft-bg flex flex-col">
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between subtle-shadow">
        <div>
          <span className="font-display text-sm text-primary font-semibold">Zenthorix</span>
          <span className="text-muted-foreground text-sm ml-2 font-body">| {team?.teamName}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground font-body">
            {currentIndex + 1} / {questions.length}
          </span>
          {questionTimeLeft !== null && !isCurrentLocked && (
            <span
              className={`font-display font-bold text-lg tabular-nums ${
                questionTimeLeft <= 3 ? "text-destructive" : "text-foreground"
              }`}
            >
              {questionTimeLeft}s
            </span>
          )}
          {isCurrentLocked && (
            <span className="text-xs font-display text-muted-foreground bg-muted px-2 py-0.5 rounded">
              Locked
            </span>
          )}
        </div>
      </header>

      {!isCurrentLocked && questionTimeLeft !== null && (
        <div className="h-1 bg-muted">
          <div
            className={`h-full transition-all duration-200 ${
              (questionTimeLeft ?? 0) <= 3 ? "bg-destructive" : "bg-primary"
            }`}
            style={{ width: `${timePercent}%` }}
          />
        </div>
      )}

      <main className="flex-1 flex flex-col items-center justify-center p-4 max-w-2xl mx-auto w-full">
        <div className="card-surface subtle-shadow-lg p-6 w-full space-y-5">
          <h2 className="text-lg md:text-xl font-body font-semibold text-foreground leading-relaxed">
            {currentQ.text}
          </h2>

          <div className="space-y-2.5">
            {currentQ.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleSelectAnswer(i)}
                disabled={isCurrentLocked || (questionTimeLeft ?? 1) === 0}
                className={`w-full text-left p-3.5 rounded-lg border font-body text-base transition-all flex items-center gap-3 ${
                  selectedAnswer === i
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:bg-muted/50"
                } disabled:cursor-not-allowed ${isCurrentLocked && selectedAnswer !== i ? "opacity-40" : ""}`}
              >
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-display font-bold shrink-0 ${
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

        <div className="flex gap-3 mt-5">
          <Button variant="outline" onClick={goPrev} disabled={currentIndex === 0} className="font-display tracking-wide">
            ← Prev
          </Button>
          {currentIndex === questions.length - 1 ? (
            <Button onClick={handleFinalSubmit} disabled={submitted} className="font-display tracking-wide">
              Submit
            </Button>
          ) : (
            <Button variant="outline" onClick={goNext} className="font-display tracking-wide">
              Next →
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mt-5 justify-center">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => goToQuestion(i)}
              className={`w-7 h-7 rounded-full text-xs font-display font-semibold transition-all ${
                i === currentIndex
                  ? "bg-primary text-primary-foreground"
                  : lockedQuestions.has(q.id)
                  ? "bg-secondary/20 text-secondary border border-secondary/30"
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
