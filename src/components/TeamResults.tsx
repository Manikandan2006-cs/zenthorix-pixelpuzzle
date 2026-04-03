import { useState } from "react";
import { AdminData } from "@/types/quiz";
import { Button } from "@/components/ui/button";

interface Props {
  data: AdminData;
  onSelectForRound2?: (teamId: string) => void;
  onDeselectFromRound2?: (teamId: string) => void;
  onDeleteTeam?: (teamId: string) => void;
}

const TeamResults = ({ data, onSelectForRound2, onDeselectFromRound2, onDeleteTeam }: Props) => {
  const [roundTab, setRoundTab] = useState<"round1" | "round2">("round1");
  const activeBundle = data.bundles.find((b) => b.id === data.quizState.activeBundle);
  const totalQuestions = activeBundle?.questions.length || 0;

  const round1Teams = [...data.teams].filter((t) => !t.selectedForRound2).sort((a, b) => b.score - a.score);
  const round2Teams = [...data.teams].filter((t) => t.selectedForRound2).sort((a, b) => b.score - a.score);

  const currentTeams = roundTab === "round1" ? round1Teams : round2Teams;

  const renderPodium = (teams: typeof round1Teams) => {
    if (teams.length < 1) return null;
    const medals = ["🥇", "🥈", "🥉"];
    return (
      <div className="flex gap-3 justify-center items-end mb-4 flex-wrap">
        {teams.slice(0, 3).map((t, i) => {
          const heights = ["h-28", "h-22", "h-18"];
          const rings = ["ring-primary/30", "ring-secondary/30", "ring-accent/30"];
          return (
            <div key={t.id} className="text-center">
              <span className="text-2xl">{medals[i]}</span>
              <div className={`card-surface subtle-shadow-lg p-4 ${heights[i]} flex flex-col justify-end items-center ring-2 ${rings[i]} min-w-[110px] rounded-lg`}>
                <p className="font-display font-semibold text-sm text-foreground">{t.teamName}</p>
                <p className="font-display text-xl font-bold text-primary">{t.score}/{totalQuestions}</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Round toggle */}
      <div className="flex gap-1 bg-muted rounded-lg p-1">
        <button
          onClick={() => setRoundTab("round1")}
          className={`flex-1 py-2.5 rounded-md text-sm font-display font-medium transition-all ${
            roundTab === "round1"
              ? "bg-card text-foreground subtle-shadow"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          🏁 Round 1 Results ({round1Teams.length})
        </button>
        <button
          onClick={() => setRoundTab("round2")}
          className={`flex-1 py-2.5 rounded-md text-sm font-display font-medium transition-all ${
            roundTab === "round2"
              ? "bg-card text-foreground subtle-shadow"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          🚀 Round 2 Results ({round2Teams.length})
        </button>
      </div>

      {activeBundle && (
        <p className="text-sm text-muted-foreground font-body">Bundle: {activeBundle.name}</p>
      )}

      {currentTeams.length === 0 ? (
        <div className="card-surface subtle-shadow p-8 text-center">
          <p className="text-muted-foreground font-body">
            {roundTab === "round1" ? "No Round 1 teams yet." : "No teams in Round 2 yet. Select teams from Round 1."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {renderPodium(currentTeams)}
          <div className="card-surface subtle-shadow overflow-hidden rounded-lg">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-display text-xs text-muted-foreground uppercase tracking-wider">#</th>
                  <th className="text-left p-3 font-display text-xs text-muted-foreground uppercase tracking-wider">Team</th>
                  <th className="text-left p-3 font-display text-xs text-muted-foreground uppercase tracking-wider">College</th>
                  <th className="text-left p-3 font-display text-xs text-muted-foreground uppercase tracking-wider">Email</th>
                  <th className="text-left p-3 font-display text-xs text-muted-foreground uppercase tracking-wider">Score</th>
                  <th className="text-left p-3 font-display text-xs text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left p-3 font-display text-xs text-muted-foreground uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {currentTeams.map((t, i) => (
                  <tr key={t.id} className="border-b border-border/50 last:border-0">
                    <td className="p-3 font-display text-sm text-muted-foreground">{i + 1}</td>
                    <td className="p-3">
                      <p className="font-body font-semibold text-foreground">{t.teamName}</p>
                      <p className="text-xs text-muted-foreground">{t.year}</p>
                    </td>
                    <td className="p-3 font-body text-sm text-muted-foreground">{t.collegeName}</td>
                    <td className="p-3 font-body text-sm text-muted-foreground max-w-[150px] truncate">{t.email || "—"}</td>
                    <td className="p-3 font-display font-bold text-primary">{t.score}/{totalQuestions}</td>
                    <td className="p-3">
                      {t.eliminated ? (
                        <span className="text-xs font-display text-destructive bg-destructive/10 px-2 py-0.5 rounded">Eliminated</span>
                      ) : (
                        <span className="text-xs font-display text-primary bg-primary/10 px-2 py-0.5 rounded">Active</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        {roundTab === "round1" && !t.eliminated && onSelectForRound2 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onSelectForRound2(t.id)}
                            className="font-display text-xs text-primary border-primary/30"
                          >
                            → R2
                          </Button>
                        )}
                        {roundTab === "round2" && onDeselectFromRound2 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDeselectFromRound2(t.id)}
                            className="font-display text-xs text-muted-foreground"
                          >
                            ← Remove
                          </Button>
                        )}
                        {onDeleteTeam && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDeleteTeam(t.id)}
                            className="font-display text-xs text-destructive border-destructive/30"
                          >
                            ✕
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamResults;
