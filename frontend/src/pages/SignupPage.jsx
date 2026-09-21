import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { getPendingAnalysis, clearPendingAnalysis } from "../lib/storage";
import useAsync from "../hooks/useAsync";

async function registerRequest(name, email, password) {
  const res = await api.post("/register", { name, email, password });
  return res.data;
}

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const { execute, isLoading, error } = useAsync(() => registerRequest(name, email, password));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setValidationError("Password must be at least 6 characters.");
      return;
    }
    setValidationError("");
    try {
      const data = await execute();
      login(data.token, data.user);

      const pending = getPendingAnalysis();
      if (pending) {
        try {
          await api.post("/save-pending", pending);
        } catch {
          // non-fatal
        }
        clearPendingAnalysis();
      }

      navigate("/");
    } catch {
      // error surfaced via useAsync
    }
  };

  return (
    <div className="page-container flex justify-center py-16">
      <div className="w-full" style={{ maxWidth: "24rem" }}>
        <h1 className="mb-6 text-3xl" style={{ fontFamily: "var(--font-display)" }}>
          Create account
        </h1>

        <div className="card p-6">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs text-(--color-muted)">Name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                style={{ borderColor: "var(--color-border)" }}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-(--color-muted)">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                style={{ borderColor: "var(--color-border)" }}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-(--color-muted)">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 pr-10 text-sm outline-none"
                  style={{ borderColor: "var(--color-border)" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-(--color-muted)"
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                      <path d="M3 10s3-6 7-6 7 6 7 6-3 6-7 6-7-6-7-6Z" stroke="currentColor" strokeWidth="1.4" />
                      <circle cx="10" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.4" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                      <path d="M3 10s3-6 7-6 7 6 7 6-3 6-7 6-7-6-7-6Z" stroke="currentColor" strokeWidth="1.4" />
                      <path d="M4 4l12 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {(validationError || error) && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="shrink-0">
                  <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M7.5 7.5 12.5 12.5M12.5 7.5 7.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span>{validationError || error}</span>
              </div>
            )}

            <button type="button" onClick={handleSubmit} disabled={isLoading} className="btn-primary w-full">
              {isLoading ? "Creating account…" : "Create account"}
            </button>
          </div>
        </div>

        <p className="mt-5 text-center text-sm text-(--color-muted)">
          Already have an account?{" "}
          <Link to="/login" className="text-(--color-teal) hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
