import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchBundles,
  fetchTeams,
  fetchQuizState,
  addBundle,
  updateBundle,
  deleteBundle,
  setActiveBundle,
  startQuiz,
  stopQuiz,
  setTimerDuration,
  eliminateTeam,
  clearAllTeams,
  selectTeamForRound2,
  deselectTeamFromRound2,
} from "@/lib/quizStore";
import { sendRound2SMS } from "@/lib/quizStore";
import { QuestionBundle, Team, QuizState } from "@/types/quiz";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BundleEditor from "@/components/BundleEditor";
import TeamResults from "@/components/TeamResults";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [bundles, setBundles] = useState<QuestionBundle[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [quizState, setQuizState] = useState<QuizState>({
    activeBundle: null,
    isQuizActive: false,
    timerDuration: 15,
    timerStartedAt: null,
    timerPaused: false,
  });
  const [tab, setTab] = useState<"bundles" | "quiz" | "teams" | "results">("bundles");
  const [timerInput, setTimerInput] = useState("15");
  const [showBundleEditor, setShowBundleEditor] = useState(false);
  const [editingBundle, setEditingBundle] = useState<QuestionBundle | null>(null);
  const timerInputFocusedRef = useRef(false);

  const [twilioFrom, setTwilioFrom] = useState(() => localStorage.getItem("zenthorix_twilio_from") || "");

  useEffect(() => {
    if (sessionStorage.getItem("zenthorix_admin") !== "true") {
      navigate("/admin");
    }
  }, [navigate]);

  const refresh = useCallback(async () => {
    const [b, t, q] = await Promise.all([fetchBundles(), fetchTeams(), fetchQuizState()]);
    setBundles(b);
    setTeams(t);
    setQuizState(q);
    if (!timerInputFocusedRef.current) setTimerInput(String(q.timerDuration));
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleSetTimer = async () => {
    const secs = parseInt(timerInput);
    if (!isNaN(secs) && secs > 0) {
      await setTimerDuration(secs);
      refresh();
    }
  };

  const handleSelectBundle = async (bundleId: string) => {
    await setActiveBundle(bundleId);
    refresh();
  };

  const handleStartQuiz = async () => { await startQuiz(); refresh(); };
  const handleStopQuiz = async () => { await stopQuiz(); refresh(); };

  const handleSaveBundle = async (bundle: QuestionBundle) => {
    if (editingBundle) {
      await updateBundle(bundle);
    } else {
      await addBundle(bundle);
    }
    setShowBundleEditor(false);
    setEditingBundle(null);
    refresh();
  };

  const handleDeleteBundle = async (id: string) => { await deleteBundle(id); refresh(); };
  const handleEliminateTeam = async (id: string) => { await eliminateTeam(id); refresh(); };
  const handleClearTeams = async () => { await clearAllTeams(); refresh(); };

  const handleSelectForRound2 = async (teamId: string) => {
    await selectTeamForRound2(teamId);
    // Send SMS notification
    const team = teams.find((t) => t.id === teamId);
    if (team && team.phoneNumber && twilioFrom) {
      try {
        await sendRound2SMS(team.phoneNumber, team.teamName, twilioFrom);
      } catch (e) {
        console.error("SMS failed:", e);
      }
    }
    refresh();
  };

  const handleDeselectFromRound2 = async (teamId: string) => {
    await deselectTeamFromRound2(teamId);
    refresh();
  };

  const tabs = [
    { id: "bundles" as const, label: "Bundles" },
    { id: "quiz" as const, label: "Quiz Control" },
    { id: "teams" as const, label: "Teams" },
    { id: "results" as const, label: "Results" },
  ];

  const activeBundle = bundles.find((b) => b.id === quizState.activeBundle);
  const round1Teams = teams.filter((t) => !t.selectedForRound2);
  const round2Teams = teams.filter((t) => t.selectedForRound2);

  const adminData = { bundles, teams, quizState, adminPassword: "" };

  return (
    <div className="min-h-screen soft-bg">
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between subtle-shadow">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-lg font-bold text-foreground">Zenthorix</h1>
          <span className="text-muted-foreground font-body text-sm">Admin</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${quizState.isQuizActive ? "bg-primary" : "bg-muted-foreground"}`} />
          <span className="text-sm font-body text-muted-foreground">
            {quizState.isQuizActive ? "Live" : "Idle"}
          </span>
        </div>
      </header>

      <nav className="bg-card border-b border-border px-4 flex gap-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-3 font-display text-sm font-medium tracking-wide transition-colors whitespace-nowrap ${
              tab === t.id
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="p-4 max-w-5xl mx-auto">
        {tab === "bundles" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-semibold text-foreground">Question Bundles</h2>
              <Button
                onClick={() => { setEditingBundle(null); setShowBundleEditor(true); }}
                className="font-display tracking-wide"
              >
                + New Bundle
              </Button>
            </div>

            {showBundleEditor && (
              <BundleEditor
                bundle={editingBundle}
                onSave={handleSaveBundle}
                onCancel={() => { setShowBundleEditor(false); setEditingBundle(null); }}
              />
            )}

            {bundles.length === 0 && !showBundleEditor && (
              <div className="card-surface subtle-shadow p-8 text-center">
                <p className="text-muted-foreground font-body">No bundles yet. Create one to get started.</p>
              </div>
            )}

            <div className="grid gap-3">
              {bundles.map((b) => (
                <div key={b.id} className={`card-surface subtle-shadow p-4 flex items-center justify-between ${
                  quizState.activeBundle === b.id ? "ring-2 ring-primary/30" : ""
                }`}>
                  <div>
                    <h3 className="font-display font-semibold text-foreground">{b.name}</h3>
                    <p className="text-sm text-muted-foreground font-body">{b.questions.length} questions</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setEditingBundle(b); setShowBundleEditor(true); }}
                      className="font-display text-xs">Edit</Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteBundle(b.id)}
                      className="font-display text-xs text-destructive border-destructive/30">Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "quiz" && (
          <div className="space-y-5">
            <h2 className="text-xl font-display font-semibold text-foreground">Quiz Control</h2>

            <div className="card-surface subtle-shadow p-5 space-y-3">
              <h3 className="font-display font-medium text-foreground">Timer Per Question</h3>
              <div className="flex gap-2 items-center mb-3">
                <Input
                  type="text"
                  value={twilioFrom}
                  onChange={(e) => {
                    setTwilioFrom(e.target.value);
                    localStorage.setItem("zenthorix_twilio_from", e.target.value);
                  }}
                  placeholder="Twilio From Number (e.g. +1234567890)"
                  className="flex-1 text-sm"
                />
                <span className="text-muted-foreground font-body text-xs">SMS sender</span>
              </div>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  value={timerInput}
                  onChange={(e) => setTimerInput(e.target.value)}
                  onFocus={() => { timerInputFocusedRef.current = true; }}
                  onBlur={() => { timerInputFocusedRef.current = false; }}
                  className="w-24"
                  min={5}
                />
                <span className="text-muted-foreground font-body text-sm">seconds per question</span>
                <Button onClick={handleSetTimer} variant="outline" size="sm" className="font-display text-xs">
                  Set
                </Button>
              </div>
              <p className="text-sm text-muted-foreground font-body">
                Current: {quizState.timerDuration}s per question
              </p>
            </div>

            <div className="card-surface subtle-shadow p-5 space-y-3">
              <h3 className="font-display font-medium text-foreground">Select Bundle</h3>
              {bundles.length === 0 ? (
                <p className="text-muted-foreground font-body text-sm">No bundles available.</p>
              ) : (
                <div className="grid gap-2">
                  {bundles.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => handleSelectBundle(b.id)}
                      className={`p-3 rounded-lg border text-left font-body transition-all ${
                        quizState.activeBundle === b.id
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:bg-muted/50"
                      }`}
                    >
                      <span className="font-semibold text-foreground">{b.name}</span>
                      <span className="text-sm text-muted-foreground ml-2">({b.questions.length} questions)</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="card-surface subtle-shadow p-5 space-y-3">
              <h3 className="font-display font-medium text-foreground">Status</h3>
              {quizState.isQuizActive ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-primary font-display font-semibold">Quiz is Live</span>
                  </div>
                  <p className="text-muted-foreground font-body text-sm">
                    Bundle: {activeBundle?.name || "—"} · Teams: {teams.filter(t => !t.eliminated).length} active
                  </p>
                  <Button onClick={handleStopQuiz} variant="destructive" className="font-display tracking-wide">
                    Stop Quiz
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-muted-foreground font-body text-sm">
                    {quizState.activeBundle ? `Ready: "${activeBundle?.name}"` : "Select a bundle first"}
                  </p>
                  <Button onClick={handleStartQuiz} disabled={!quizState.activeBundle} className="font-display tracking-wide">
                    Start Quiz
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "teams" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-semibold text-foreground">
                Teams ({teams.length})
              </h2>
              <Button onClick={handleClearTeams} variant="outline" size="sm"
                className="font-display text-xs text-destructive border-destructive/30">
                Clear All
              </Button>
            </div>

            {/* Round 1 Teams */}
            <div className="space-y-3">
              <h3 className="font-display font-medium text-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                Round 1 ({round1Teams.length})
              </h3>
              {round1Teams.length === 0 ? (
                <div className="card-surface subtle-shadow p-6 text-center">
                  <p className="text-muted-foreground font-body text-sm">No teams in Round 1.</p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {round1Teams.map((t) => (
                    <div key={t.id} className={`card-surface subtle-shadow p-3 flex items-center justify-between ${
                      t.eliminated ? "opacity-50" : ""
                    }`}>
                      <div>
                        <h4 className="font-display font-medium text-foreground text-sm">
                          {t.teamName}
                          {t.eliminated && <span className="ml-2 text-xs text-destructive">[Eliminated]</span>}
                        </h4>
                        <p className="text-xs text-muted-foreground font-body">{t.collegeName} · {t.year} · {t.phoneNumber}</p>
                      </div>
                      <div className="flex gap-2">
                        {!t.eliminated && (
                          <Button variant="outline" size="sm" onClick={() => handleEliminateTeam(t.id)}
                            className="font-display text-xs text-destructive border-destructive/30">
                            Eliminate
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Round 2 Teams */}
            <div className="space-y-3">
              <h3 className="font-display font-medium text-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-secondary" />
                Round 2 ({round2Teams.length})
              </h3>
              {round2Teams.length === 0 ? (
                <div className="card-surface subtle-shadow p-6 text-center">
                  <p className="text-muted-foreground font-body text-sm">No teams selected for Round 2 yet. Use the Results tab to promote teams.</p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {round2Teams.map((t) => (
                    <div key={t.id} className={`card-surface subtle-shadow p-3 flex items-center justify-between ring-1 ring-secondary/20 ${
                      t.eliminated ? "opacity-50" : ""
                    }`}>
                      <div>
                        <h4 className="font-display font-medium text-foreground text-sm">
                          {t.teamName}
                          {t.eliminated && <span className="ml-2 text-xs text-destructive">[Eliminated]</span>}
                        </h4>
                        <p className="text-xs text-muted-foreground font-body">{t.collegeName} · {t.year} · {t.phoneNumber}</p>
                      </div>
                      <div className="flex gap-2">
                        {!t.eliminated && (
                          <Button variant="outline" size="sm" onClick={() => handleEliminateTeam(t.id)}
                            className="font-display text-xs text-destructive border-destructive/30">
                            Eliminate
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "results" && (
          <TeamResults
            data={adminData}
            onSelectForRound2={handleSelectForRound2}
            onDeselectFromRound2={handleDeselectFromRound2}
          />
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
