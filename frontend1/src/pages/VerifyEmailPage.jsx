import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import api from "../lib/api"

export default function VerifyEmailPage() {
  const { token } = useParams()
  const [status, setStatus] = useState("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    api.get(`/verify-email/${token}`)
      .then(res => {
        setStatus("success")
        setMessage(res.data.message)
      })
      .catch(err => {
        setStatus("error")
        setMessage(err.response?.data?.error || "Verification failed.")
      })
  }, [token])

  return (
    <div className="page-container flex min-h-[70vh] items-center justify-center">
      <div className="card mx-auto max-w-sm p-8 text-center" style={{ animation: "fadeIn 0.3s ease" }}>

        {status === "loading" && (
          <>
            <div className="mx-auto mb-5 h-12 w-12 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-teal)]"
              style={{ animation: "spin 0.8s linear infinite" }} />
            <p className="text-sm text-[var(--color-muted)]">Verifying your email...</p>
          </>
        )}

        {status === "success" && (
          <>
            <svg width="52" height="52" viewBox="0 0 48 48" fill="none" className="mx-auto mb-5"
              style={{ color: "var(--color-teal)" }}>
              <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5" />
              <path d="M15 24.5l6.5 6.5 11.5-13" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h1 className="mb-2 text-2xl" style={{ fontFamily: "var(--font-display)" }}>
              Email verified
            </h1>
            <p className="mb-6 text-sm text-[var(--color-muted)]">{message}</p>
            <Link to="/login" className="btn-primary inline-block">
              Sign in →
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <svg width="52" height="52" viewBox="0 0 48 48" fill="none" className="mx-auto mb-5"
              style={{ color: "#991B1B" }}>
              <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5" />
              <path d="M17 17l14 14M31 17L17 31" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" />
            </svg>
            <h1 className="mb-2 text-2xl" style={{ fontFamily: "var(--font-display)" }}>
              Verification failed
            </h1>
            <p className="mb-6 text-sm text-[var(--color-muted)]">{message}</p>
            <Link to="/login" className="btn-secondary inline-block">
              Back to sign in
            </Link>
          </>
        )}

      </div>
    </div>
  )
}