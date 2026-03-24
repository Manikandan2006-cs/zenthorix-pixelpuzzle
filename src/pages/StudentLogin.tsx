import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerTeam, findTeamByCredentials, saveTeamSession } from "@/lib/quizStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const StudentLogin = () => {
  const [teamName, setTeamName] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleJoin = async () => {
    if (!teamName.trim() || !collegeName.trim() || !year.trim()) return;
    setLoading(true);
    setErrorMsg("");
    try {
      // Check if team already exists (for round 2 re-login)
      const existing = await findTeamByCredentials(teamName.trim(), collegeName.trim(), year.trim());
      if (existing) {
        // If selected for round 2 or still in round 1, allow login
        saveTeamSession(existing.id);
        navigate("/student/quiz");
        return;
      }
      // New registration
      const team = await registerTeam({ teamName: teamName.trim(), collegeName: collegeName.trim(), year: year.trim() });
      saveTeamSession(team.id);
      navigate("/student/quiz");
    } catch (err) {
      console.error("Registration failed:", err);
      setErrorMsg("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen soft-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-foreground">
            Zenthorix
          </h1>
          <p className="text-sm font-body text-muted-foreground uppercase tracking-widest">
            Quiz Arena
          </p>
        </div>

        <div className="card-surface subtle-shadow-lg p-6 space-y-5">
          <h2 className="text-lg font-display font-semibold text-center text-foreground">
            Team Registration
          </h2>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-body font-medium text-muted-foreground">
                Team Name
              </label>
              <Input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter your team name"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-body font-medium text-muted-foreground">
                College Name
              </label>
              <Input
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                placeholder="Enter your college name"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-body font-medium text-muted-foreground">
                Year
              </label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1st Year">1st Year</SelectItem>
                  <SelectItem value="2nd Year">2nd Year</SelectItem>
                  <SelectItem value="3rd Year">3rd Year</SelectItem>
                  <SelectItem value="4th Year">4th Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {errorMsg && (
            <p className="text-sm text-destructive font-body">{errorMsg}</p>
          )}

          <Button
            onClick={handleJoin}
            disabled={!teamName.trim() || !collegeName.trim() || !year.trim() || loading}
            className="w-full font-display font-semibold text-base tracking-wide"
          >
            {loading ? "Joining..." : "Enter Arena"}
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground font-body">
          ⚠ Do not leave or minimize once the quiz starts
        </p>
      </div>
    </div>
  );
};

export default StudentLogin;
