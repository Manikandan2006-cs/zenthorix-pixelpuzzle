import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";

const FloatingShape = ({ className, delay, duration, x, y }: { className: string; delay: number; duration: number; x: number; y: number }) => (
  <motion.div
    className={`absolute rounded-full pointer-events-none ${className}`}
    initial={{ x, y, opacity: 0 }}
    animate={{
      x: [x, x + 30, x - 20, x],
      y: [y, y - 40, y + 20, y],
      opacity: [0, 0.6, 0.4, 0.6],
      rotate: [0, 90, 180, 360],
    }}
    transition={{ delay, duration, repeat: Infinity, ease: "easeInOut" }}
  />
);

const Index = () => {
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => localStorage.getItem("zenthorix_theme") === "dark");
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("zenthorix_theme", dark ? "dark" : "light");
  }, [dark]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
  };

  return (
    <div className="min-h-screen soft-bg flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated floating shapes */}
      <FloatingShape className="w-3 h-3 bg-primary/10 border border-primary/10" delay={0} duration={12} x={-200} y={-150} />
      <FloatingShape className="w-5 h-5 bg-accent/20" delay={1.5} duration={15} x={250} y={-120} />
      <FloatingShape className="w-2 h-2 bg-primary/15" delay={0.8} duration={10} x={-280} y={100} />
      <FloatingShape className="w-4 h-4 border border-border" delay={2} duration={14} x={300} y={80} />
      <FloatingShape className="w-6 h-6 bg-muted/40" delay={0.5} duration={18} x={-100} y={200} />
      <FloatingShape className="w-2.5 h-2.5 bg-primary/10" delay={3} duration={11} x={180} y={180} />
      <FloatingShape className="w-3.5 h-3.5 border border-primary/10" delay={1} duration={16} x={-320} y={-50} />
      <FloatingShape className="w-2 h-2 bg-accent/15" delay={2.5} duration={13} x={350} y={-30} />

      {/* Slow rotating ring */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full border border-dashed border-border/30 pointer-events-none"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute w-[350px] h-[350px] rounded-full border border-dashed border-border/20 pointer-events-none"
        animate={{ rotate: -360 }}
        transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
      />

      {/* Theme toggle */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8, duration: 0.4 }}
        className="absolute top-5 right-5 flex items-center gap-2.5 z-10"
      >
        <span className="text-xs text-muted-foreground font-body select-none">
          {dark ? "☾" : "☀"}
        </span>
        <Switch checked={dark} onCheckedChange={setDark} />
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md relative z-10"
      >
        {/* Logo with pulse ring */}
        <motion.div variants={itemVariants} className="flex justify-center mb-6">
          <div className="relative">
            <motion.div
              className="absolute inset-0 rounded-2xl bg-primary/5"
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="relative w-20 h-20 rounded-2xl bg-primary/10 border border-primary/10 flex items-center justify-center">
              <motion.span
                className="text-4xl select-none"
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              >
                ⚡
              </motion.span>
            </div>
          </div>
        </motion.div>

        {/* Title with letter stagger */}
        <motion.div variants={itemVariants} className="text-center mb-2">
          <h1 className="text-5xl md:text-6xl font-display font-bold tracking-tight text-foreground">
            {"Zenthorix".split("").map((letter, i) => (
              <motion.span
                key={i}
                className="inline-block"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.05, duration: 0.3, ease: "easeOut" }}
                whileHover={{ y: -4, color: "hsl(var(--primary))", transition: { duration: 0.15 } }}
              >
                {letter}
              </motion.span>
            ))}
          </h1>
        </motion.div>

        <motion.p
          variants={itemVariants}
          className="text-center text-sm font-body text-muted-foreground tracking-[0.3em] uppercase mb-8"
        >
          Quiz Symposium
        </motion.p>

        {/* Animated divider */}
        <motion.div variants={itemVariants} className="flex justify-center mb-10">
          <motion.div
            className="h-px bg-border origin-center"
            initial={{ width: 0 }}
            animate={{ width: 64 }}
            transition={{ delay: 0.7, duration: 0.6, ease: "easeOut" }}
          />
        </motion.div>

        {/* Cards */}
        <motion.div variants={itemVariants} className="space-y-3 mb-10">
          <motion.button
            onClick={() => navigate("/student")}
            onHoverStart={() => setHovered("student")}
            onHoverEnd={() => setHovered(null)}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            className="group w-full card-surface border border-border rounded-xl p-5 flex items-center justify-between transition-colors duration-200 hover:border-primary/30 hover:bg-primary/[0.03] text-left"
          >
            <div className="flex items-center gap-4">
              <motion.div
                className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center text-lg shrink-0"
                animate={hovered === "student" ? { rotate: [0, -5, 5, 0] } : {}}
                transition={{ duration: 0.4 }}
              >
                🎓
              </motion.div>
              <div>
                <span className="font-display font-semibold text-foreground text-base block">Student Entry</span>
                <p className="text-xs text-muted-foreground font-body mt-0.5">Join the quiz session</p>
              </div>
            </div>
            <motion.span
              className="text-muted-foreground group-hover:text-primary transition-colors text-lg"
              animate={hovered === "student" ? { x: [0, 4, 0] } : { x: 0 }}
              transition={{ duration: 0.6, repeat: hovered === "student" ? Infinity : 0 }}
            >
              →
            </motion.span>
          </motion.button>

          <motion.button
            onClick={() => navigate("/admin")}
            onHoverStart={() => setHovered("admin")}
            onHoverEnd={() => setHovered(null)}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            className="group w-full card-surface border border-border rounded-xl p-5 flex items-center justify-between transition-colors duration-200 hover:border-primary/30 hover:bg-primary/[0.03] text-left"
          >
            <div className="flex items-center gap-4">
              <motion.div
                className="w-11 h-11 rounded-lg bg-accent/60 flex items-center justify-center text-lg shrink-0"
                animate={hovered === "admin" ? { rotate: [0, -5, 5, 0] } : {}}
                transition={{ duration: 0.4 }}
              >
                🛠
              </motion.div>
              <div>
                <span className="font-display font-semibold text-foreground text-base block">Admin Portal</span>
                <p className="text-xs text-muted-foreground font-body mt-0.5">Manage quizzes & teams</p>
              </div>
            </div>
            <motion.span
              className="text-muted-foreground group-hover:text-primary transition-colors text-lg"
              animate={hovered === "admin" ? { x: [0, 4, 0] } : { x: 0 }}
              transition={{ duration: 0.6, repeat: hovered === "admin" ? Infinity : 0 }}
            >
              →
            </motion.span>
          </motion.button>
        </motion.div>

        {/* Footer with typing effect */}
        <motion.p
          variants={itemVariants}
          className="text-center text-[11px] text-muted-foreground/50 font-body tracking-wide"
        >
          Powered by Zenthorix Quiz Engine
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Index;
