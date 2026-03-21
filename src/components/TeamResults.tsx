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
      <h2 className="text-xl font-display font-bold text-foreground">
        Results {activeBundle ? `— ${activeBundle.name}` : ""}
      </h2>

      {!activeBundle && (
        <div className="glass rounded-lg p-8 text-center">
          <p className="text-muted-foreground font-body text-lg">Select a question bundle to view results.</p>
        </div>
      )}

      {sortedTeams.length === 0 && activeBundle && (
        <div className="glass rounded-lg p-8 text-center">
          <p className="text-muted-foreground font-body text-lg">No teams have participated yet.</p>
        </div>
      )}

      {sortedTeams.length > 0 && (
        <div className="space-y-3">
          {/* Podium for top 3 */}
          {sortedTeams.length >= 1 && (
            <div className="flex gap-3 justify-center items-end mb-6 flex-wrap">
              {sortedTeams.slice(0, 3).map((t, i) => {
                const heights = ["h-32", "h-24", "h-20"];
                const colors = [
                  "neon-border text-primary",
                  "neon-border-purple text-secondary",
                  "text-accent",
                ];
                const medals = ["🥇", "🥈", "🥉"];
                return (
                  <div key={t.id} className="text-center">
                    <span className="text-2xl">{medals[i]}</span>
                    <div className={`glass rounded-lg p-4 ${heights[i]} flex flex-col justify-end items-center ${colors[i]} min-w-[120px]`}>
                      <p className="font-display font-bold text-sm">{t.teamName}</p>
                      <p className="font-display text-2xl font-black">
                        {t.score}/{totalQuestions}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full leaderboard */}
          <div className="glass rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-display text-xs text-muted-foreground uppercase tracking-wider">#</th>
                  <th className="text-left p-3 font-display text-xs text-muted-foreground uppercase tracking-wider">Team</th>
                  <th className="text-left p-3 font-display text-xs text-muted-foreground uppercase tracking-wider">College</th>
                  <th className="text-left p-3 font-display text-xs text-muted-foreground uppercase tracking-wider">Year</th>
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
                    <td className="p-3 font-display font-bold text-primary">
                      {t.score}/{totalQuestions}
                    </td>
                    <td className="p-3">
                      {t.eliminated ? (
                        <span className="text-xs font-display text-destructive bg-destructive/10 px-2 py-1 rounded">
                          ELIMINATED
                        </span>
                      ) : (
                        <span className="text-xs font-display text-primary bg-primary/10 px-2 py-1 rounded">
                          ACTIVE
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
