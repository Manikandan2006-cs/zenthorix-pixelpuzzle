import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { registerTeam, findTeamByCredentials, findTeamForRound2, saveTeamSession } from "@/lib/quizStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const StudentLogin = () => {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("zenthorix_theme") === "dark";
    }
    return false;
  });
  const [mode, setMode] = useState<"round1" | "round2">("round1");
  const [teamName, setTeamName] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [year, setYear] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("zenthorix_theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const handleJoinRound1 = async () => {
    if (!teamName.trim() || !collegeName.trim() || !year.trim() || !phoneNumber.trim() || !email.trim()) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const existing = await findTeamByCredentials(teamName.trim(), collegeName.trim(), year.trim());
      if (existing) {
        saveTeamSession(existing.id);
        navigate("/student/quiz");
        return;
      }
      const fullPhone = phoneNumber.trim().startsWith("+") ? phoneNumber.trim() : `+91${phoneNumber.trim()}`;
      const team = await registerTeam({
        teamName: teamName.trim(),
        collegeName: collegeName.trim(),
        year: year.trim(),
        phoneNumber: fullPhone,
        email: email.trim(),
      });
      saveTeamSession(team.id);
      navigate("/student/quiz");
    } catch (err) {
      console.error("Registration failed:", err);
      setErrorMsg("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRound2 = async () => {
    if (!teamName.trim() || !phoneNumber.trim()) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const team = await findTeamForRound2(teamName.trim(), phoneNumber.trim());
      if (!team) {
        setErrorMsg("Team not found or not selected for Round 2.");
        return;
      }
      saveTeamSession(team.id);
      navigate("/student/quiz");
    } catch (err) {
      console.error("Login failed:", err);
      setErrorMsg("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen soft-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Theme Toggle */}
        <div className="flex justify-end items-center gap-2">
          <span className="text-xs font-body text-muted-foreground">{darkMode ? "Dark" : "Light"}</span>
          <Switch checked={darkMode} onCheckedChange={setDarkMode} />
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-foreground">
            Zenthorix
          </h1>
          <p className="text-sm font-body text-muted-foreground uppercase tracking-widest">
            Quiz Arena
          </p>
        </div>

        {/* Round Tabs */}
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => { setMode("round1"); setErrorMsg(""); }}
            className={`flex-1 py-2 rounded-md text-sm font-display font-medium transition-all ${
              mode === "round1"
                ? "bg-card text-foreground subtle-shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Round 1 — Register
          </button>
          <button
            onClick={() => { setMode("round2"); setErrorMsg(""); }}
            className={`flex-1 py-2 rounded-md text-sm font-display font-medium transition-all ${
              mode === "round2"
                ? "bg-card text-foreground subtle-shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Round 2 — Login
          </button>
        </div>

        <div className="card-surface subtle-shadow-lg p-6 space-y-5">
          <h2 className="text-lg font-display font-semibold text-center text-foreground">
            {mode === "round1" ? "Team Registration" : "Round 2 Login"}
          </h2>

          {mode === "round1" ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-body font-medium text-muted-foreground">Team Name</label>
                <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Enter your team name" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-body font-medium text-muted-foreground">Email</label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="team@example.com" type="email" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-body font-medium text-muted-foreground">Phone Number</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground font-body">+91</span>
                  <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))} placeholder="9361XXXXXX" type="tel" className="rounded-l-none" maxLength={10} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-body font-medium text-muted-foreground">College Name</label>
                <Input value={collegeName} onChange={(e) => setCollegeName(e.target.value)} placeholder="Enter your college name" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-body font-medium text-muted-foreground">Year</label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger><SelectValue placeholder="Select your year" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1st Year">1st Year</SelectItem>
                    <SelectItem value="2nd Year">2nd Year</SelectItem>
                    <SelectItem value="3rd Year">3rd Year</SelectItem>
                    <SelectItem value="4th Year">4th Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground font-body text-center">
                Only teams selected for Round 2 can log in here.
              </p>
              <div className="space-y-1.5">
                <label className="text-sm font-body font-medium text-muted-foreground">Team Name</label>
                <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Enter your team name" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-body font-medium text-muted-foreground">Phone Number</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground font-body">+91</span>
                  <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))} placeholder="9361XXXXXX" type="tel" className="rounded-l-none" maxLength={10} />
                </div>
              </div>
            </div>
          )}

          {errorMsg && (
            <p className="text-sm text-destructive font-body">{errorMsg}</p>
          )}

          <Button
            onClick={mode === "round1" ? handleJoinRound1 : handleJoinRound2}
            disabled={
              mode === "round1"
                ? !teamName.trim() || !collegeName.trim() || !year.trim() || !phoneNumber.trim() || !email.trim() || loading
                : !teamName.trim() || !phoneNumber.trim() || loading
            }
            className="w-full font-display font-semibold text-base tracking-wide"
          >
            {loading ? "Joining..." : mode === "round1" ? "Enter Arena" : "Join Round 2"}
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
