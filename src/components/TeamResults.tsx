import { AdminData } from "@/types/quiz";
import { Button } from "@/components/ui/button";

interface Props {
  data: AdminData;
  onSelectForRound2?: (teamId: string) => void;
  onDeselectFromRound2?: (teamId: string) => void;
}

const TeamResults = ({ data, onSelectForRound2, onDeselectFromRound2 }: Props) => {
  const activeBundle = data.bundles.find((b) => b.id === data.quizState.activeBundle);
  const totalQuestions = activeBundle?.questions.length || 0;

  const round1Teams = [...data.teams].filter((t) => !t.selectedForRound2).sort((a, b) => b.score - a.score);
  const round2Teams = [...data.teams].filter((t) => t.selectedForRound2).sort((a, b) => b.score - a.score);

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

  const renderTable = (teams: typeof round1Teams, showR2Actions: boolean) => (
    <div className="card-surface subtle-shadow overflow-hidden rounded-lg">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left p-3 font-display text-xs text-muted-foreground uppercase tracking-wider">#</th>
            <th className="text-left p-3 font-display text-xs text-muted-foreground uppercase tracking-wider">Team</th>
            <th className="text-left p-3 font-display text-xs text-muted-foreground uppercase tracking-wider">College</th>
            <th className="text-left p-3 font-display text-xs text-muted-foreground uppercase tracking-wider">Phone</th>
            <th className="text-left p-3 font-display text-xs text-muted-foreground uppercase tracking-wider">Score</th>
            <th className="text-left p-3 font-display text-xs text-muted-foreground uppercase tracking-wider">Status</th>
            {showR2Actions && (
              <th className="text-left p-3 font-display text-xs text-muted-foreground uppercase tracking-wider">Action</th>
            )}
          </tr>
        </thead>
        <tbody>
          {teams.map((t, i) => (
            <tr key={t.id} className="border-b border-border/50 last:border-0">
              <td className="p-3 font-display text-sm text-muted-foreground">{i + 1}</td>
              <td className="p-3">
                <p className="font-body font-semibold text-foreground">{t.teamName}</p>
                <p className="text-xs text-muted-foreground">{t.year}</p>
              </td>
              <td className="p-3 font-body text-sm text-muted-foreground">{t.collegeName}</td>
              <td className="p-3 font-body text-sm text-muted-foreground">{t.phoneNumber || "—"}</td>
              <td className="p-3 font-display font-bold text-primary">{t.score}/{totalQuestions}</td>
              <td className="p-3">
                {t.eliminated ? (
                  <span className="text-xs font-display text-destructive bg-destructive/10 px-2 py-0.5 rounded">Eliminated</span>
                ) : (
                  <span className="text-xs font-display text-primary bg-primary/10 px-2 py-0.5 rounded">Active</span>
                )}
              </td>
              {showR2Actions && (
                <td className="p-3">
                  {!t.eliminated && onSelectForRound2 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectForRound2(t.id)}
                      className="font-display text-xs text-primary border-primary/30"
                    >
                      → Round 2
                    </Button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Round 1 Results */}
      <div className="space-y-4">
        <h2 className="text-xl font-display font-semibold text-foreground flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary" />
          Round 1 Results {activeBundle ? `— ${activeBundle.name}` : ""}
        </h2>

        {round1Teams.length === 0 ? (
          <div className="card-surface subtle-shadow p-8 text-center">
            <p className="text-muted-foreground font-body">No Round 1 teams yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {renderPodium(round1Teams)}
            {renderTable(round1Teams, true)}
          </div>
        )}
      </div>

      {/* Round 2 Results */}
      <div className="space-y-4">
        <h2 className="text-xl font-display font-semibold text-foreground flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
          Round 2 Results
        </h2>

        {round2Teams.length === 0 ? (
          <div className="card-surface subtle-shadow p-8 text-center">
            <p className="text-muted-foreground font-body">No teams in Round 2 yet. Select teams from Round 1 above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {renderPodium(round2Teams)}
            <div className="card-surface subtle-shadow overflow-hidden rounded-lg">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-display text-xs text-muted-foreground uppercase tracking-wider">#</th>
                    <th className="text-left p-3 font-display text-xs text-muted-foreground uppercase tracking-wider">Team</th>
                    <th className="text-left p-3 font-display text-xs text-muted-foreground uppercase tracking-wider">College</th>
                    <th className="text-left p-3 font-display text-xs text-muted-foreground uppercase tracking-wider">Phone</th>
                    <th className="text-left p-3 font-display text-xs text-muted-foreground uppercase tracking-wider">Score</th>
                    <th className="text-left p-3 font-display text-xs text-muted-foreground uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {round2Teams.map((t, i) => (
                    <tr key={t.id} className="border-b border-border/50 last:border-0">
                      <td className="p-3 font-display text-sm text-muted-foreground">{i + 1}</td>
                      <td className="p-3">
                        <p className="font-body font-semibold text-foreground">{t.teamName}</p>
                        <p className="text-xs text-muted-foreground">{t.year}</p>
                      </td>
                      <td className="p-3 font-body text-sm text-muted-foreground">{t.collegeName}</td>
                      <td className="p-3 font-body text-sm text-muted-foreground">{t.phoneNumber || "—"}</td>
                      <td className="p-3 font-display font-bold text-primary">{t.score}/{totalQuestions}</td>
                      <td className="p-3">
                        {onDeselectFromRound2 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDeselectFromRound2(t.id)}
                            className="font-display text-xs text-muted-foreground"
                          >
                            ← Remove
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamResults;
