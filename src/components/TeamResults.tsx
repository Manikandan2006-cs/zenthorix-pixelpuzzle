import { AdminData } from "@/types/quiz";

interface Props {
  data: AdminData;
}

const TeamResults = ({ data }: Props) => {
  const activeBundle = data.bundles.find((b) => b.id === data.quizState.activeBundle);
  const totalQuestions = activeBundle?.questions.length || 0;
  const sortedTeams = [...data.teams].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-display font-semibold text-foreground">
        Results {activeBundle ? `— ${activeBundle.name}` : ""}
      </h2>

      {!activeBundle && (
        <div className="card-surface subtle-shadow p-8 text-center">
          <p className="text-muted-foreground font-body">Select a question bundle to view results.</p>
        </div>
      )}

      {sortedTeams.length === 0 && activeBundle && (
        <div className="card-surface subtle-shadow p-8 text-center">
          <p className="text-muted-foreground font-body">No teams have participated yet.</p>
        </div>
      )}

      {sortedTeams.length > 0 && (
        <div className="space-y-4">
          {sortedTeams.length >= 1 && (
            <div className="flex gap-3 justify-center items-end mb-4 flex-wrap">
              {sortedTeams.slice(0, 3).map((t, i) => {
                const heights = ["h-28", "h-22", "h-18"];
                const rings = ["ring-primary/30", "ring-secondary/30", "ring-accent/30"];
                const medals = ["🥇", "🥈", "🥉"];
                return (
                  <div key={t.id} className="text-center">
                    <span className="text-2xl">{medals[i]}</span>
                    <div className={`card-surface subtle-shadow-lg p-4 ${heights[i]} flex flex-col justify-end items-center ring-2 ${rings[i]} min-w-[110px] rounded-lg`}>
                      <p className="font-display font-semibold text-sm text-foreground">{t.teamName}</p>
                      <p className="font-display text-xl font-bold text-primary">
                        {t.score}/{totalQuestions}
                      </p>
                      {t.selectedForRound2 && (
                        <span className="text-[10px] font-body text-secondary mt-1">R2</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="card-surface subtle-shadow overflow-hidden rounded-lg">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-display text-xs text-muted-foreground uppercase tracking-wider">#</th>
                  <th className="text-left p-3 font-display text-xs text-muted-foreground uppercase tracking-wider">Team</th>
                  <th className="text-left p-3 font-display text-xs text-muted-foreground uppercase tracking-wider">College</th>
                  <th className="text-left p-3 font-display text-xs text-muted-foreground uppercase tracking-wider">Year</th>
                  <th className="text-left p-3 font-display text-xs text-muted-foreground uppercase tracking-wider">Round</th>
                  <th className="text-left p-3 font-display text-xs text-muted-foreground uppercase tracking-wider">Score</th>
                  <th className="text-left p-3 font-display text-xs text-muted-foreground uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedTeams.map((t, i) => (
                  <tr key={t.id} className="border-b border-border/50 last:border-0">
                    <td className="p-3 font-display text-sm text-muted-foreground">{i + 1}</td>
                    <td className="p-3 font-body font-semibold text-foreground">{t.teamName}</td>
                    <td className="p-3 font-body text-sm text-muted-foreground">{t.collegeName}</td>
                    <td className="p-3 font-body text-sm text-muted-foreground">{t.year}</td>
                    <td className="p-3">
                      <span className={`text-xs font-display px-2 py-0.5 rounded ${
                        t.selectedForRound2 ? "bg-secondary/10 text-secondary" : "bg-muted text-muted-foreground"
                      }`}>
                        R{t.currentRound}
                      </span>
                    </td>
                    <td className="p-3 font-display font-bold text-primary">
                      {t.score}/{totalQuestions}
                    </td>
                    <td className="p-3">
                      {t.eliminated ? (
                        <span className="text-xs font-display text-destructive bg-destructive/10 px-2 py-0.5 rounded">
                          Eliminated
                        </span>
                      ) : (
                        <span className="text-xs font-display text-primary bg-primary/10 px-2 py-0.5 rounded">
                          Active
                        </span>
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
  );
};

export default TeamResults;
