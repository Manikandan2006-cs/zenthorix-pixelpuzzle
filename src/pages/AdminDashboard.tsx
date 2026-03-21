import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAdminData,
  addBundle,
  deleteBundle,
  setActiveBundle,
  startQuiz,
  stopQuiz,
  setTimerDuration,
  eliminateTeam,
  clearAllTeams,
  saveAdminData,
} from "@/lib/quizStore";
import { AdminData, Question, QuestionBundle } from "@/types/quiz";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import BundleEditor from "@/components/BundleEditor";
import TeamResults from "@/components/TeamResults";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<AdminData>(getAdminData());
  const [tab, setTab] = useState<"bundles" | "quiz" | "teams" | "results">("bundles");
  const [timerInput, setTimerInput] = useState(String(data.quizState.timerDuration));
  const [showBundleEditor, setShowBundleEditor] = useState(false);
  const [editingBundle, setEditingBundle] = useState<QuestionBundle | null>(null);

  // Check auth
  useEffect(() => {
    if (sessionStorage.getItem("zenthorix_admin") !== "true") {
      navigate("/admin");
    }
  }, [navigate]);

  // Refresh data periodically
  const refresh = useCallback(() => setData(getAdminData()), []);
  useEffect(() => {
    const interval = setInterval(refresh, 2000);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleSetTimer = () => {
    const secs = parseInt(timerInput);
    if (!isNaN(secs) && secs > 0) {
      setTimerDuration(secs);
      refresh();
    }
  };

  const handleSelectBundle = (bundleId: string) => {
    setActiveBundle(bundleId);
    refresh();
  };

  const handleStartQuiz = () => {
    startQuiz();
    refresh();
  };

  const handleStopQuiz = () => {
    stopQuiz();
    refresh();
  };

  const handleSaveBundle = (bundle: QuestionBundle) => {
    if (editingBundle) {
      const d = getAdminData();
      const idx = d.bundles.findIndex((b) => b.id === bundle.id);
      if (idx >= 0) d.bundles[idx] = bundle;
      saveAdminData(d);
    } else {
      addBundle(bundle);
    }
    setShowBundleEditor(false);
    setEditingBundle(null);
    refresh();
  };

  const handleDeleteBundle = (id: string) => {
    deleteBundle(id);
    refresh();
  };

  const handleEliminateTeam = (id: string) => {
    eliminateTeam(id);
    refresh();
  };

  const handleClearTeams = () => {
    clearAllTeams();
    refresh();
  };

  const tabs = [
    { id: "bundles" as const, label: "BUNDLES" },
    { id: "quiz" as const, label: "QUIZ CONTROL" },
    { id: "teams" as const, label: "TEAMS" },
    { id: "results" as const, label: "RESULTS" },
  ];

  const activeBundle = data.bundles.find((b) => b.id === data.quizState.activeBundle);

  return (
    <div className="min-h-screen grid-bg">
      {/* Header */}
      <header className="glass border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-xl font-bold text-secondary neon-text-purple">ZENTHORIX</h1>
          <span className="text-muted-foreground font-body text-sm">Admin Portal</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${data.quizState.isQuizActive ? "bg-primary animate-pulse-neon" : "bg-muted-foreground"}`} />
          <span className="text-sm font-body text-muted-foreground">
            {data.quizState.isQuizActive ? "LIVE" : "IDLE"}
          </span>
        </div>
      </header>

      {/* Tabs */}
      <nav className="glass border-b border-border px-4 flex gap-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-3 font-display text-sm font-semibold tracking-wider transition-colors whitespace-nowrap ${
              tab === t.id
                ? "text-secondary border-b-2 border-secondary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="p-4 max-w-5xl mx-auto">
        {/* BUNDLES TAB */}
        {tab === "bundles" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-bold text-foreground">Question Bundles</h2>
              <Button
                onClick={() => { setEditingBundle(null); setShowBundleEditor(true); }}
                className="bg-secondary text-secondary-foreground font-display tracking-wider"
              >
                + NEW BUNDLE
              </Button>
            </div>

            {showBundleEditor && (
              <BundleEditor
                bundle={editingBundle}
                onSave={handleSaveBundle}
                onCancel={() => { setShowBundleEditor(false); setEditingBundle(null); }}
              />
            )}

            {data.bundles.length === 0 && !showBundleEditor && (
              <div className="glass rounded-lg p-8 text-center">
                <p className="text-muted-foreground font-body text-lg">No bundles yet. Create one to get started.</p>
              </div>
            )}

            <div className="grid gap-3">
              {data.bundles.map((b) => (
                <div key={b.id} className={`glass rounded-lg p-4 flex items-center justify-between ${
                  data.quizState.activeBundle === b.id ? "neon-border-purple" : ""
                }`}>
                  <div>
                    <h3 className="font-display font-semibold text-foreground">{b.name}</h3>
                    <p className="text-sm text-muted-foreground font-body">{b.questions.length} questions</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setEditingBundle(b); setShowBundleEditor(true); }}
                      className="font-display text-xs border-border text-muted-foreground"
                    >
                      EDIT
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteBundle(b.id)}
                      className="font-display text-xs border-destructive text-destructive"
                    >
                      DELETE
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* QUIZ CONTROL TAB */}
        {tab === "quiz" && (
          <div className="space-y-6">
            <h2 className="text-xl font-display font-bold text-foreground">Quiz Control</h2>

            {/* Timer Setting */}
            <div className="glass rounded-lg p-5 space-y-3">
              <h3 className="font-display font-semibold text-foreground">Timer Duration</h3>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  value={timerInput}
                  onChange={(e) => setTimerInput(e.target.value)}
                  className="bg-muted border-border text-foreground w-32"
                  min={10}
                />
                <span className="text-muted-foreground font-body">seconds</span>
                <Button
                  onClick={handleSetTimer}
                  variant="outline"
                  className="font-display text-xs border-border text-muted-foreground"
                >
                  SET
                </Button>
              </div>
              <p className="text-sm text-muted-foreground font-body">
                Current: {Math.floor(data.quizState.timerDuration / 60)}m {data.quizState.timerDuration % 60}s
              </p>
            </div>

            {/* Select Bundle */}
            <div className="glass rounded-lg p-5 space-y-3">
              <h3 className="font-display font-semibold text-foreground">Select Question Bundle</h3>
              {data.bundles.length === 0 ? (
                <p className="text-muted-foreground font-body">No bundles available. Create one first.</p>
              ) : (
                <div className="grid gap-2">
                  {data.bundles.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => handleSelectBundle(b.id)}
                      className={`p-3 rounded-lg border text-left font-body transition-all ${
                        data.quizState.activeBundle === b.id
                          ? "border-secondary bg-secondary/10 neon-border-purple"
                          : "border-border bg-muted/30 hover:bg-muted/50"
                      }`}
                    >
                      <span className="font-semibold text-foreground">{b.name}</span>
                      <span className="text-sm text-muted-foreground ml-2">({b.questions.length} questions)</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Start/Stop */}
            <div className="glass rounded-lg p-5 space-y-3">
              <h3 className="font-display font-semibold text-foreground">Quiz Status</h3>
              {data.quizState.isQuizActive ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-primary animate-pulse-neon" />
                    <span className="text-primary font-display font-bold">QUIZ IS LIVE</span>
                  </div>
                  <p className="text-muted-foreground font-body">
                    Bundle: {activeBundle?.name || "—"} | Teams: {data.teams.filter(t => !t.eliminated).length} active
                  </p>
                  <Button
                    onClick={handleStopQuiz}
                    className="bg-destructive text-destructive-foreground font-display tracking-wider"
                  >
                    STOP QUIZ
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-muted-foreground font-body">
                    {data.quizState.activeBundle
                      ? `Ready to start with "${activeBundle?.name}"`
                      : "Select a bundle first"}
                  </p>
                  <Button
                    onClick={handleStartQuiz}
                    disabled={!data.quizState.activeBundle}
                    className="bg-primary text-primary-foreground font-display tracking-wider disabled:opacity-40"
                  >
                    START QUIZ
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TEAMS TAB */}
        {tab === "teams" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-bold text-foreground">
                Registered Teams ({data.teams.length})
              </h2>
              <Button
                onClick={handleClearTeams}
                variant="outline"
                className="font-display text-xs border-destructive text-destructive"
              >
                CLEAR ALL
              </Button>
            </div>

            {data.teams.length === 0 ? (
              <div className="glass rounded-lg p-8 text-center">
                <p className="text-muted-foreground font-body text-lg">No teams registered yet.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {data.teams.map((t) => (
                  <div
                    key={t.id}
                    className={`glass rounded-lg p-4 flex items-center justify-between ${
                      t.eliminated ? "opacity-50" : ""
                    }`}
                  >
                    <div>
                      <h3 className="font-display font-semibold text-foreground">
                        {t.teamName}
                        {t.eliminated && (
                          <span className="ml-2 text-xs text-destructive font-body">[ELIMINATED]</span>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground font-body">
                        {t.collegeName} • {t.year}
                      </p>
                    </div>
                    {!t.eliminated && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEliminateTeam(t.id)}
                        className="font-display text-xs border-destructive text-destructive"
                      >
                        ELIMINATE
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RESULTS TAB */}
        {tab === "results" && <TeamResults data={data} />}
      </main>
    </div>
  );
};

export default AdminDashboard;
