import { useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import api from "../lib/api"
import useAsync from "../hooks/useAsync"

async function doReset({ token, password }) {
  const res = await api.post("/reset-password", { token, password })
  return res.data
}

export default function ResetPasswordPage() {
  const { token }                     = useParams()
  const [password, setPassword]       = useState("")
  const [confirm, setConfirm]         = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [validationError, setValidationError] = useState("")
  const [done, setDone]               = useState(false)
  const navigate                      = useNavigate()
  const { execute, isLoading, error } = useAsync(doReset)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 6) {
      setValidationError("Password must be at least 6 characters.")
      return
    }
    if (password !== confirm) {
      setValidationError("Passwords do not match.")
      return
    }
    setValidationError("")
    try {
      await execute({ token, password })
      setDone(true)
      setTimeout(() => navigate("/login"), 2500)
    } catch {
      // error surfaced via useAsync
    }
  }

  return (
    <div className="page-container flex justify-center py-16">
      <div className="w-full" style={{ maxWidth: "24rem" }}>
        <h1 className="mb-2 text-3xl" style={{ fontFamily: "var(--font-display)" }}>
          Reset password
        </h1>
        <p className="mb-6 text-sm text-[var(--color-muted)]">
          Choose a new password for your account.
        </p>

        {done ? (
          <div className="card p-6 text-center">
            <svg width="44" height="44" viewBox="0 0 48 48" fill="none"
              className="mx-auto mb-4" style={{ color: "var(--color-teal)" }}>
              <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5" />
              <path d="M15 24.5l6.5 6.5 11.5-13" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="mb-1 text-base font-medium">Password reset</p>
            <p className="text-sm text-[var(--color-muted)]">
              Redirecting you to sign in...
            </p>
          </div>
        ) : (
          <div className="card p-6">
            <div className="space-y-4">

              <div>
                <label className="mb-1 block text-xs text-[var(--color-muted)]">
                  New password
                </label>
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
                    placeholder="Min. 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
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

              <div>
                <label className="mb-1 block text-xs text-[var(--color-muted)]">
                  Confirm password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: "var(--color-border)" }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--color-teal)")}
                  onBlur={(e)  => (e.target.style.borderColor = "var(--color-border)")}
                  placeholder="Repeat password"
                />
              </div>

              {(validationError || error) && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="shrink-0">
                    <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M7.5 7.5 12.5 12.5M12.5 7.5 7.5 12.5" stroke="currentColor"
                      strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <span>{validationError || error}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="btn-primary w-full"
              >
                {isLoading ? "Resetting..." : "Reset password"}
              </button>

            </div>
          </div>
        )}

        <p className="mt-5 text-center text-sm text-[var(--color-muted)]">
          <Link to="/login" className="text-[var(--color-teal)] hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}