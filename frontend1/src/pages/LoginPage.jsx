import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { getPendingAnalysis, clearPendingAnalysis } from "../lib/storage";
import useAsync from "../hooks/useAsync";

async function loginRequest(email, password) {
  const res = await api.post("/login", { email, password });
  return res.data;
}

export default function LoginPage() {
  const [email, setEmail]                 = useState("");
  const [password, setPassword]           = useState("");
  const [showPassword, setShowPassword]   = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [resendSent, setResendSent]       = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const { login }                         = useAuth();
  const navigate                          = useNavigate();
  const { execute, isLoading, error }     = useAsync(() => loginRequest(email, password));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUnverifiedEmail("");  // clear previous unverified state
    setResendSent(false);
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
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.requires_verification) {
        setUnverifiedEmail(err.response.data.email || email);
      }
      // 401 is handled automatically by useAsync error state
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await api.post("/resend-verification", { email: unverifiedEmail });
      setResendSent(true);
    } catch {
      // silently fail — user can try again
    }
    setResendLoading(false);
  };

  return (
    <div className="page-container flex justify-center py-16">
      <div className="w-full" style={{ maxWidth: "24rem" }}>
        <h1 className="mb-6 text-3xl" style={{ fontFamily: "var(--font-display)" }}>
          Welcome back
        </h1>

        <div className="card p-6">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            <div>
              <label className="mb-1 block text-xs text-(--color-muted)">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                style={{ borderColor: "var(--color-border)" }}
                onFocus={(e) => (e.target.style.borderColor = "var(--color-teal)")}
                onBlur={(e)  => (e.target.style.borderColor = "var(--color-border)")}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-(--color-muted)">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 pr-10 text-sm outline-none"
                  style={{ borderColor: "var(--color-border)" }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--color-teal)")}
                  onBlur={(e)  => (e.target.style.borderColor = "var(--color-border)")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-(--color-muted)"
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                      <path d="M3 10s3-6 7-6 7 6 7 6-3 6-7 6-7-6-7-6Z"
                        stroke="currentColor" strokeWidth="1.4" />
                      <circle cx="10" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.4" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                      <path d="M3 10s3-6 7-6 7 6 7 6-3 6-7 6-7-6-7-6Z"
                        stroke="currentColor" strokeWidth="1.4" />
                      <path d="M4 4l12 12" stroke="currentColor" strokeWidth="1.4"
                        strokeLinecap="round" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && !unverifiedEmail && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="shrink-0">
                  <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M7.5 7.5 12.5 12.5M12.5 7.5 7.5 12.5" stroke="currentColor"
                    strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {unverifiedEmail && (
              <div className="rounded-lg p-4 text-sm" style={{ background: "#FFFBEB" }}>
                <p className="font-medium" style={{ color: "#92400E" }}>
                  Email not verified
                </p>
                <p className="mt-1 text-xs" style={{ color: "#92400E" }}>
                  Check your inbox for the verification link.
                </p>
                {!resendSent ? (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendLoading}
                    className="mt-2 text-xs underline"
                    style={{ color: "#92400E" }}
                  >
                    {resendLoading ? "Sending..." : "Resend verification email"}
                  </button>
                ) : (
                  <p className="mt-2 text-xs" style={{ color: "#166534" }}>
                    ✓ Verification email sent
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? "Signing in…" : "Sign in"}
            </button>

            <div className="text-center">
              <Link
                to="/forgot-password"
                className="text-xs text-(--color-muted) hover:text-(--color-teal)"
              >
                Forgot your password?
              </Link>
            </div>

          </form>
        </div>

        <p className="mt-5 text-center text-sm text-(--color-muted)">
          New here?{" "}
          <Link to="/signup" className="text-(--color-teal) hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}