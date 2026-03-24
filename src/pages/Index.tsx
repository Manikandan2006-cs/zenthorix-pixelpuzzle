import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen soft-bg flex items-center justify-center p-4">
      <div className="text-center space-y-10 max-w-lg">
        <div className="space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <span className="text-3xl">⚡</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-foreground">
            Zenthorix
          </h1>
          <div className="h-px bg-border w-24 mx-auto" />
          <p className="text-lg font-body text-muted-foreground">
            Quiz Symposium
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => navigate("/student")}
            className="w-full py-6 text-base font-display font-semibold tracking-wide"
          >
            Student Entry
          </Button>
          <Button
            onClick={() => navigate("/admin")}
            variant="outline"
            className="w-full py-6 text-base font-display font-semibold tracking-wide"
          >
            Admin Portal
          </Button>
        </div>

        <p className="text-xs text-muted-foreground font-body">
          Powered by Zenthorix Quiz Engine
        </p>
      </div>
    </div>
  );
};

export default Index;
