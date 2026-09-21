import { useState } from "react"
import { Link } from "react-router-dom"
import api from "../lib/api"
import useAsync from "../hooks/useAsync"

async function requestReset(email) {
  const res = await api.post("/forgot-password", { email })
  return res.data
}

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState("")
  const [sent, setSent]       = useState(false)
  const { execute, isLoading, error } = useAsync(requestReset)

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await execute(email)
      setSent(true)
    } catch {
      // error surfaced via useAsync
    }
  }

  return (
    <div className="page-container flex justify-center py-16">
      <div className="w-full" style={{ maxWidth: "24rem" }}>
        <h1 className="mb-2 text-3xl" style={{ fontFamily: "var(--font-display)" }}>
          Forgot password
        </h1>
        <p className="mb-6 text-sm text-[var(--color-muted)]">
          Enter your email and we'll send you a reset link.
        </p>

        {sent ? (
          <div className="card p-6 text-center">
            <svg width="44" height="44" viewBox="0 0 48 48" fill="none"
              className="mx-auto mb-4" style={{ color: "var(--color-teal)" }}>
              <rect x="6" y="12" width="36" height="26" rx="3"
                stroke="currentColor" strokeWidth="1.5" />
              <path d="M6 15l18 13L42 15" stroke="currentColor" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="mb-1 text-base font-medium">Check your inbox</p>
            <p className="text-sm text-[var(--color-muted)]">
              If an account exists for {email}, a reset link has been sent.
              It expires in 30 minutes.
            </p>
            <Link to="/login" className="mt-6 inline-block text-sm text-[var(--color-teal)] hover:underline">
              Back to sign in
            </Link>
          </div>
        ) : (
          <div className="card p-6">
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-[var(--color-muted)]">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: "var(--color-border)" }}
                  onFocus={(e)  => (e.target.style.borderColor = "var(--color-teal)")}
                  onBlur={(e)   => (e.target.style.borderColor = "var(--color-border)")}
                  placeholder="you@example.com"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="shrink-0">
                    <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M7.5 7.5 12.5 12.5M12.5 7.5 7.5 12.5" stroke="currentColor"
                      strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading || !email.trim()}
                className="btn-primary w-full"
              >
                {isLoading ? "Sending..." : "Send reset link"}
              </button>
            </div>
          </div>
        )}

        <p className="mt-5 text-center text-sm text-[var(--color-muted)]">
          Remember your password?{" "}
          <Link to="/login" className="text-[var(--color-teal)] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}