import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";

const Index = () => {
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => localStorage.getItem("zenthorix_theme") === "dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("zenthorix_theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <div className="min-h-screen soft-bg flex items-center justify-center p-6 relative overflow-hidden">
      {/* Subtle decorative shapes */}
      <div className="absolute top-[-120px] left-[-80px] w-[300px] h-[300px] rounded-full bg-primary/[0.04] blur-2xl pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-60px] w-[250px] h-[250px] rounded-full bg-accent/[0.06] blur-2xl pointer-events-none" />

      {/* Theme toggle */}
      <div className="absolute top-5 right-5 flex items-center gap-2.5 z-10">
        <span className="text-xs text-muted-foreground font-body select-none">
          {dark ? "☾ Dark" : "☀ Light"}
        </span>
        <Switch checked={dark} onCheckedChange={setDark} />
      </div>

      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center space-y-8"
        >
          {/* Logo mark */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4, ease: "easeOut" }}
            className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 border border-primary/10 flex items-center justify-center"
          >
            <span className="text-4xl select-none">⚡</span>
          </motion.div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-5xl md:text-6xl font-display font-bold tracking-tight text-foreground">
              Zenthorix
            </h1>
            <p className="text-base font-body text-muted-foreground tracking-wide uppercase">
              Quiz Symposium
            </p>
          </div>
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
          className="h-px bg-border w-16 mx-auto my-8 origin-center"
        />

        {/* Action cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4, ease: "easeOut" }}
          className="space-y-3"
        >
          <button
            onClick={() => navigate("/student")}
            className="group w-full card-surface border border-border rounded-xl p-5 flex items-center justify-between transition-all duration-200 hover:border-primary/30 hover:bg-primary/[0.03] active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-lg shrink-0">
                🎓
              </div>
              <div className="text-left">
                <span className="font-display font-semibold text-foreground text-base">Student Entry</span>
                <p className="text-xs text-muted-foreground font-body mt-0.5">Join the quiz session</p>
              </div>
            </div>
            <span className="text-muted-foreground group-hover:text-primary transition-colors text-lg">→</span>
          </button>

          <button
            onClick={() => navigate("/admin")}
            className="group w-full card-surface border border-border rounded-xl p-5 flex items-center justify-between transition-all duration-200 hover:border-primary/30 hover:bg-primary/[0.03] active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-accent/60 flex items-center justify-center text-foreground text-lg shrink-0">
                🛠
              </div>
              <div className="text-left">
                <span className="font-display font-semibold text-foreground text-base">Admin Portal</span>
                <p className="text-xs text-muted-foreground font-body mt-0.5">Manage quizzes & teams</p>
              </div>
            </div>
            <span className="text-muted-foreground group-hover:text-primary transition-colors text-lg">→</span>
          </button>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="text-center text-xs text-muted-foreground/60 font-body mt-10"
        >
          Powered by Zenthorix Quiz Engine
        </motion.p>
      </div>
    </div>
  );
};

export default Index;
