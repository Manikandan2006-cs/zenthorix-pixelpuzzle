import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ADMIN_PASSWORD } from "@/types/quiz";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const AdminLogin = () => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem("zenthorix_admin", "true");
      navigate("/admin/dashboard");
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
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
            Admin Portal
          </p>
        </div>

        <div className="card-surface subtle-shadow-lg p-6 space-y-5">
          <h2 className="text-lg font-display font-semibold text-center text-foreground">
            Admin Access
          </h2>

          <div className="space-y-1.5">
            <label className="text-sm font-body font-medium text-muted-foreground">
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="Enter admin password"
              className={error ? "border-destructive" : ""}
            />
            {error && (
              <p className="text-sm text-destructive font-body">
                Invalid password. Try again.
              </p>
            )}
          </div>

          <Button
            onClick={handleLogin}
            disabled={!password}
            className="w-full font-display font-semibold text-base tracking-wide"
          >
            Access Portal
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
