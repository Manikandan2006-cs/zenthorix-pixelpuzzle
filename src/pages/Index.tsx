import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center p-4">
      <div className="text-center space-y-10 max-w-lg">
        {/* Logo */}
        <div className="space-y-3">
          <h1 className="text-5xl md:text-7xl font-display font-black tracking-wider neon-text text-primary">
            ZENTHORIX
          </h1>
          <div className="h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
          <p className="text-xl md:text-2xl font-body text-muted-foreground tracking-[0.3em] uppercase">
            Quiz Symposium
          </p>
        </div>

        {/* Entry buttons */}
        <div className="space-y-4">
          <Button
            onClick={() => navigate("/student")}
            className="w-full py-6 text-lg bg-primary text-primary-foreground font-display font-bold tracking-widest hover:opacity-90 transition-opacity"
          >
            STUDENT ENTRY
          </Button>
          <Button
            onClick={() => navigate("/admin")}
            variant="outline"
            className="w-full py-6 text-lg border-secondary text-secondary font-display font-bold tracking-widest hover:bg-secondary/10 transition-colors"
          >
            ADMIN PORTAL
          </Button>
        </div>

        <p className="text-xs text-muted-foreground font-body">
          ⚡ Powered by Zenthorix Quiz Engine
        </p>
      </div>
    </div>
  );
};

export default Index;
