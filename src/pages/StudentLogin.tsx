import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { registerTeam, findTeamByCredentials, findTeamForRound2, saveTeamSession } from "@/lib/quizStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";

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
    document.documentElement.classList.toggle("dark", darkMode);
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
      const fullPhone = phoneNumber.trim().startsWith("+") ? phoneNumber.trim() : `+91${phoneNumber.trim()}`;
      const team = await findTeamForRound2(teamName.trim(), fullPhone);
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

  const formVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3, staggerChildren: 0.05 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
  };

  const fieldVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen soft-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full border border-dashed border-primary/10 pointer-events-none"
        animate={{ rotate: 360 }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute top-10 left-10 w-3 h-3 rounded-full bg-primary/15 pointer-events-none"
        animate={{ y: [0, -20, 0], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-20 right-20 w-4 h-4 rounded-full bg-secondary/15 pointer-events-none"
        animate={{ y: [0, 20, 0], opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 5, repeat: Infinity, delay: 1 }}
      />
      <motion.div
        className="absolute top-1/3 right-10 w-2 h-2 rounded-full bg-accent/20 pointer-events-none"
        animate={{ x: [0, 15, 0], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-6 relative z-10"
      >
        {/* Theme Toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-end items-center gap-2"
        >
          <motion.span
            className="text-sm select-none"
            animate={{ rotate: darkMode ? [0, -15, 0] : [0, 15, 0] }}
            transition={{ duration: 0.4 }}
            key={darkMode ? "moon" : "sun"}
          >
            {darkMode ? "🌙" : "☀️"}
          </motion.span>
          <Switch checked={darkMode} onCheckedChange={setDarkMode} />
        </motion.div>

        {/* Header */}
        <motion.div
          className="text-center space-y-2"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <div className="flex justify-center mb-3">
            <motion.div
              className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center"
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="text-2xl">⚡</span>
            </motion.div>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-foreground">
            Zenthorix
          </h1>
          <p className="text-sm font-body text-muted-foreground uppercase tracking-widest">
            Quiz Arena
          </p>
        </motion.div>

        {/* Round Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-1 bg-muted rounded-xl p-1.5"
        >
          <button
            onClick={() => { setMode("round1"); setErrorMsg(""); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-display font-medium transition-all relative ${
              mode === "round1"
                ? "bg-card text-foreground subtle-shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              🏁 <span>Round 1</span>
            </span>
            {mode === "round1" && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-card rounded-lg subtle-shadow -z-10"
              />
            )}
          </button>
          <button
            onClick={() => { setMode("round2"); setErrorMsg(""); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-display font-medium transition-all relative ${
              mode === "round2"
                ? "bg-card text-foreground subtle-shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              🚀 <span>Round 2</span>
            </span>
            {mode === "round2" && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-card rounded-lg subtle-shadow -z-10"
              />
            )}
          </button>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-surface subtle-shadow-lg p-6 space-y-5 rounded-xl"
        >
          <h2 className="text-lg font-display font-semibold text-center text-foreground">
            {mode === "round1" ? "🎮 Team Registration" : "🚀 Round 2 Login"}
          </h2>

          <AnimatePresence mode="wait">
            {mode === "round1" ? (
              <motion.div
                key="round1"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-4"
              >
                <motion.div variants={fieldVariants} className="space-y-1.5">
                  <label className="text-sm font-body font-medium text-muted-foreground flex items-center gap-1.5">
                    👥 Team Name
                  </label>
                  <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Enter your team name" className="h-11" />
                </motion.div>
                <motion.div variants={fieldVariants} className="space-y-1.5">
                  <label className="text-sm font-body font-medium text-muted-foreground flex items-center gap-1.5">
                    📧 Email
                  </label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="team@example.com" type="email" className="h-11" />
                </motion.div>
                <motion.div variants={fieldVariants} className="space-y-1.5">
                  <label className="text-sm font-body font-medium text-muted-foreground flex items-center gap-1.5">
                    📱 Phone Number
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-input bg-muted text-sm text-muted-foreground font-body font-medium">+91</span>
                    <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))} placeholder="9361XXXXXX" type="tel" className="rounded-l-none h-11" maxLength={10} />
                  </div>
                </motion.div>
                <motion.div variants={fieldVariants} className="space-y-1.5">
                  <label className="text-sm font-body font-medium text-muted-foreground flex items-center gap-1.5">
                    🏫 College Name
                  </label>
                  <Input value={collegeName} onChange={(e) => setCollegeName(e.target.value)} placeholder="Enter your college name" className="h-11" />
                </motion.div>
                <motion.div variants={fieldVariants} className="space-y-1.5">
                  <label className="text-sm font-body font-medium text-muted-foreground flex items-center gap-1.5">
                    📅 Year
                  </label>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="Select your year" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1st Year">1st Year</SelectItem>
                      <SelectItem value="2nd Year">2nd Year</SelectItem>
                      <SelectItem value="3rd Year">3rd Year</SelectItem>
                      <SelectItem value="4th Year">4th Year</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="round2"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-4"
              >
                <motion.div
                  variants={fieldVariants}
                  className="bg-primary/5 border border-primary/15 rounded-lg p-3 text-center"
                >
                  <p className="text-sm text-primary font-body font-medium">
                    ✨ Only teams selected for Round 2 can log in here
                  </p>
                </motion.div>
                <motion.div variants={fieldVariants} className="space-y-1.5">
                  <label className="text-sm font-body font-medium text-muted-foreground flex items-center gap-1.5">
                    👥 Team Name
                  </label>
                  <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Enter your team name" className="h-11" />
                </motion.div>
                <motion.div variants={fieldVariants} className="space-y-1.5">
                  <label className="text-sm font-body font-medium text-muted-foreground flex items-center gap-1.5">
                    📱 Phone Number
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-input bg-muted text-sm text-muted-foreground font-body font-medium">+91</span>
                    <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))} placeholder="9361XXXXXX" type="tel" className="rounded-l-none h-11" maxLength={10} />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {errorMsg && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-sm text-destructive font-body bg-destructive/10 px-3 py-2 rounded-lg"
              >
                ⚠️ {errorMsg}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              onClick={mode === "round1" ? handleJoinRound1 : handleJoinRound2}
              disabled={
                mode === "round1"
                  ? !teamName.trim() || !collegeName.trim() || !year.trim() || !phoneNumber.trim() || !email.trim() || loading
                  : !teamName.trim() || !phoneNumber.trim() || loading
              }
              className="w-full font-display font-semibold text-base tracking-wide h-12"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="inline-block"
                  >
                    ⏳
                  </motion.span>
                  Joining...
                </span>
              ) : mode === "round1" ? (
                "⚡ Enter Arena"
              ) : (
                "🚀 Join Round 2"
              )}
            </Button>
          </motion.div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-muted-foreground font-body flex items-center justify-center gap-1.5"
        >
          ⚠️ Do not leave or minimize once the quiz starts
        </motion.p>
      </motion.div>
    </div>
  );
};

export default StudentLogin;
