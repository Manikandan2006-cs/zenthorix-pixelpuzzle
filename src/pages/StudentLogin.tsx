import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerTeam, saveTeamSession } from "@/lib/quizStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const StudentLogin = () => {
  const [teamName, setTeamName] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [year, setYear] = useState("");
  const navigate = useNavigate();

  const handleJoin = () => {
    if (!teamName.trim() || !collegeName.trim() || !year.trim()) return;
    const team = registerTeam({ teamName: teamName.trim(), collegeName: collegeName.trim(), year: year.trim() });
    saveTeamSession(team);
    navigate("/student/quiz");
  };

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-wider neon-text text-primary">
            ZENTHORIX
          </h1>
          <p className="text-lg font-body text-muted-foreground tracking-widest uppercase">
            Quiz Arena
          </p>
        </div>

        {/* Login Card */}
        <div className="glass rounded-lg p-6 space-y-5 neon-border">
          <h2 className="text-xl font-display font-semibold text-center text-foreground">
            Team Registration
          </h2>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-body font-semibold text-muted-foreground uppercase tracking-wider">
                Team Name
              </label>
              <Input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter your team name"
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-body font-semibold text-muted-foreground uppercase tracking-wider">
                College Name
              </label>
              <Input
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                placeholder="Enter your college name"
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-body font-semibold text-muted-foreground uppercase tracking-wider">
                Year
              </label>
              <Input
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g., 2nd Year"
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus:ring-primary"
              />
            </div>
          </div>

          <Button
            onClick={handleJoin}
            disabled={!teamName.trim() || !collegeName.trim() || !year.trim()}
            className="w-full bg-primary text-primary-foreground font-display font-bold text-lg tracking-wider hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            ENTER ARENA
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          ⚡ Do not leave or minimize once the quiz starts
        </p>
      </div>
    </div>
  );
};

export default StudentLogin;
