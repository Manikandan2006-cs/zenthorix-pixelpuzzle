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
import { motion, AnimatePresence } from "framer-motion";

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
    if (!session) { navigate("/student"); return; }
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

  useEffect(() => {
    if (questionTimeLeft === 0 && quizActive && !submitted && !reviewMode) {
      const currentQ = questions[currentIndex];
      if (currentQ) setLockedQuestions((prev) => new Set(prev).add(currentQ.id));
      if (currentIndex < questions.length - 1) {
        let targetIdx = currentIndex + 1;
        while (targetIdx < questions.length && lockedQuestions.has(questions[targetIdx].id)) targetIdx++;
        if (targetIdx < questions.length) {
          setCurrentIndex(targetIdx);
          setSelectedAnswer(answers[questions[targetIdx]?.id] ?? null);
          startQuestionTimer(perQuestionTime);
        } else {
          if (teamId) { recalculateScore(teamId); setSubmitted(true); }
        }
      } else {
        if (teamId) { recalculateScore(teamId); setSubmitted(true); }
      }
    }
  }, [questionTimeLeft, quizActive, submitted, reviewMode, currentIndex, questions, answers, perQuestionTime, startQuestionTimer, teamId, lockedQuestions]);

  const syncQuizState = useCallback(async () => {
    if (!teamId) return;
    const [quizState, bundles, teams] = await Promise.all([fetchQuizState(), fetchBundles(), fetchTeams()]);
    const teamData = teams.find((t) => t.id === teamId);
    if (teamData) {
      setTeam(teamData);
      if (teamData.eliminated) { setEliminated(true); return; }
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
      if (!quizActive) { setWaiting(true); shuffledRef.current = false; }
    }
  }, [teamId, quizActive, submitted, startQuestionTimer]);

  useEffect(() => {
    syncQuizState();
    const interval = setInterval(syncQuizState, 2000);
    return () => clearInterval(interval);
  }, [syncQuizState]);

  useEffect(() => {
    return () => { if (questionTimerRef.current) clearInterval(questionTimerRef.current); };
  }, []);

  useEffect(() => {
    if (!quizActive || !teamId) return;
    const handleVisibilityChange = () => { if (document.hidden) { setEliminated(true); eliminateTeam(teamId); } };
    const handleBlur = () => { setEliminated(true); eliminateTeam(teamId); };
    const handleBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
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
    if (lockedQuestions.has(qId)) return;
    setSelectedAnswer(index);
    const newAnswers = { ...answers, [qId]: index };
    setAnswers(newAnswers);
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
      if (questionTimerRef.current) clearInterval(questionTimerRef.current);
      setQuestionTimeLeft(null);
    } else {
      startQuestionTimer(perQuestionTime);
    }
  };

  const goNext = () => {
    if (currentIndex < questions.length - 1) {
      const currentQ = questions[currentIndex];
      if (currentQ && answers[currentQ.id] !== undefined) {
        setLockedQuestions((prev) => new Set(prev).add(currentQ.id));
      }
      goToQuestion(currentIndex + 1);
    }
  };

  const goPrev = () => { if (currentIndex > 0) goToQuestion(currentIndex - 1); };

  if (eliminated) {
    return (
      <div className="min-h-screen eliminated-overlay flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-4"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5, repeat: 3 }}
            className="text-6xl md:text-8xl"
          >
            💀
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-display font-bold text-destructive">Eliminated</h1>
          <p className="text-lg font-body text-muted-foreground">
            You left the quiz tab. Your team has been disqualified.
          </p>
        </motion.div>
      </div>
    );
  }

  if (submitted) {
    const answeredCount = Object.keys(answers).length;
    return (
      <div className="min-h-screen soft-bg flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 w-full max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="text-6xl"
          >
            🎉
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Submitted!</h1>
          <div className="card-surface subtle-shadow-lg p-6 space-y-3 rounded-xl">
            <p className="text-base font-body text-foreground">
              Team: <span className="font-semibold text-primary">{team?.teamName}</span>
            </p>
            <div className="flex items-center justify-center gap-2 py-2">
              <span className="text-3xl font-display font-bold text-primary">{answeredCount}</span>
              <span className="text-muted-foreground font-body">/</span>
              <span className="text-3xl font-display font-bold text-muted-foreground">{questions.length}</span>
              <span className="text-sm text-muted-foreground font-body ml-1">answered</span>
            </div>
            <p className="text-xs text-muted-foreground font-body">
              Results will be announced by the admin 📊
            </p>
          </div>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button variant="outline" onClick={() => setReviewMode(true)} className="font-display tracking-wide">
              📝 Review Answers
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
              ← Back to Login
            </Button>
          </div>
          <AnimatePresence>
            {reviewMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-left space-y-3 mt-4 overflow-hidden"
              >
                {questions.map((q, i) => (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="card-surface subtle-shadow p-4 space-y-2 rounded-lg"
                  >
                    <p className="font-body text-sm font-medium text-foreground">
                      {i + 1}. {q.text}
                    </p>
                    <div className="space-y-1">
                      {q.options.map((opt, oi) => (
                        <div
                          key={oi}
                          className={`text-sm font-body px-3 py-1.5 rounded-md ${
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
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  }

  if (waiting) {
    return (
      <div className="min-h-screen soft-bg flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <motion.div
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-5xl"
          >
            ⚡
          </motion.div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Zenthorix</h1>
          <div className="card-surface subtle-shadow-lg p-6 max-w-sm mx-auto space-y-4 rounded-xl">
            <motion.div
              className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full mx-auto"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <p className="text-base font-body text-foreground">
              Welcome, <span className="font-semibold text-primary">{team?.teamName}</span> 👋
            </p>
            <p className="text-muted-foreground font-body text-sm">
              Waiting for the admin to start the quiz...
            </p>
            <motion.div
              className="flex gap-1 justify-center"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  if (!currentQ) return null;

  const isCurrentLocked = lockedQuestions.has(currentQ.id);
  const optionLabels = ["A", "B", "C", "D"];
  const timePercent = perQuestionTime > 0 ? ((questionTimeLeft ?? 0) / perQuestionTime) * 100 : 0;
  const isUrgent = (questionTimeLeft ?? 99) <= 3;

  return (
    <div className="min-h-screen soft-bg flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between subtle-shadow">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚡</span>
          <span className="font-display text-sm text-primary font-semibold">Zenthorix</span>
          <span className="text-muted-foreground text-xs ml-1 font-body">| {team?.teamName}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground font-body bg-muted px-2.5 py-1 rounded-md">
            <span className="font-semibold text-foreground">{currentIndex + 1}</span>
            <span className="mx-0.5">/</span>
            <span>{questions.length}</span>
          </span>
          {questionTimeLeft !== null && !isCurrentLocked && (
            <motion.span
              className={`font-display font-bold text-lg tabular-nums px-2.5 py-1 rounded-md ${
                isUrgent ? "text-destructive bg-destructive/10" : "text-foreground"
              }`}
              animate={isUrgent ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.5, repeat: isUrgent ? Infinity : 0 }}
            >
              {questionTimeLeft}s
            </motion.span>
          )}
          {isCurrentLocked && (
            <span className="text-xs font-display text-muted-foreground bg-muted px-2.5 py-1 rounded-md">
              🔒 Locked
            </span>
          )}
        </div>
      </header>

      {/* Timer bar */}
      {!isCurrentLocked && questionTimeLeft !== null && (
        <div className="h-1.5 bg-muted">
          <motion.div
            className={`h-full ${isUrgent ? "bg-destructive" : "bg-primary"}`}
            animate={{ width: `${timePercent}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>
      )}

      {/* Question */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 max-w-2xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="card-surface subtle-shadow-lg p-6 w-full space-y-5 rounded-xl"
          >
            <h2 className="text-lg md:text-xl font-body font-semibold text-foreground leading-relaxed">
              {currentQ.text}
            </h2>

            <div className="space-y-2.5">
              {currentQ.options.map((opt, i) => (
                <motion.button
                  key={i}
                  onClick={() => handleSelectAnswer(i)}
                  disabled={isCurrentLocked || (questionTimeLeft ?? 1) === 0}
                  whileTap={!isCurrentLocked ? { scale: 0.98 } : {}}
                  className={`w-full text-left p-3.5 rounded-xl border font-body text-base transition-all flex items-center gap-3 ${
                    selectedAnswer === i
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border bg-card hover:bg-muted/50 hover:border-primary/20"
                  } disabled:cursor-not-allowed ${isCurrentLocked && selectedAnswer !== i ? "opacity-40" : ""}`}
                >
                  <motion.span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-display font-bold shrink-0 ${
                      selectedAnswer === i
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                    animate={selectedAnswer === i ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {optionLabels[i]}
                  </motion.span>
                  <span className={selectedAnswer === i ? "text-foreground font-medium" : "text-muted-foreground"}>
                    {opt}
                  </span>
                  {selectedAnswer === i && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-auto text-primary"
                    >
                      ✓
                    </motion.span>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-3 mt-5">
          <Button variant="outline" onClick={goPrev} disabled={currentIndex === 0} className="font-display tracking-wide">
            ← Prev
          </Button>
          {currentIndex === questions.length - 1 ? (
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button onClick={handleFinalSubmit} disabled={submitted} className="font-display tracking-wide">
                🏁 Submit
              </Button>
            </motion.div>
          ) : (
            <Button variant="outline" onClick={goNext} className="font-display tracking-wide">
              Next →
            </Button>
          )}
        </div>

        {/* Question navigation dots */}
        <div className="flex flex-wrap gap-1.5 mt-5 justify-center">
          {questions.map((q, i) => (
            <motion.button
              key={q.id}
              onClick={() => goToQuestion(i)}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              className={`w-8 h-8 rounded-lg text-xs font-display font-semibold transition-all ${
                i === currentIndex
                  ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                  : answers[q.id] !== undefined
                  ? "bg-primary/15 text-primary border border-primary/20"
                  : lockedQuestions.has(q.id)
                  ? "bg-muted text-muted-foreground border border-border"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </motion.button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default StudentQuiz;
