import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import axios from "axios"
import { useAuth } from "../context/AuthContext"

export default function LoginPage() {
  const [form, setForm]       = useState({ email: "", password: "" })
  const [error, setError]     = useState("")
  const [loading, setLoading] = useState(false)
  const { login }             = useAuth()
  const navigate              = useNavigate()

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await axios.post("http://localhost:5000/login", form)
      login(res.data.token, res.data.user)

      // Check for pending guest analysis
      const pending = sessionStorage.getItem("pendingAnalysis")
      if (pending) {
        try {
          const pendingData = JSON.parse(pending)
          await axios.post("http://localhost:5000/save-pending", pendingData)
          sessionStorage.removeItem("pendingAnalysis")
        } catch (err) {
          console.error("Failed to save pending analysis:", err)
        }
      }

      navigate("/")
    } catch (err) {
      setError(err.response?.data?.error || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Welcome back</h1>
          <p className="text-sm text-gray-400 mt-1">Sign in to your account</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-300"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-300"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">
                ✗ {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                    Signing in...
                  </span>
                : "Sign in →"
              }
            </button>

          </form>
        </div>

        <p className="text-center text-sm text-gray-400 mt-4">
          Don't have an account?{" "}
          <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
            Sign up
          </Link>
        </p>

      </div>
    </div>
  )
}