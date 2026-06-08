import { useState, useEffect } from "react"
import axios from "axios"
import { AuthContext } from "./AuthContext"

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadUser = async () => {
      const token = localStorage.getItem("token")

      if (!token) {
        if (mounted) setLoading(false)
        return
      }

      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`

      try {
        const res = await axios.get("http://localhost:5000/me")
        if (mounted) setUser(res.data)
      } catch {
        localStorage.removeItem("token")
        delete axios.defaults.headers.common["Authorization"]
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadUser()
    return () => { mounted = false }
  }, [])

  const login = (token, userData) => {
    localStorage.setItem("token", token)
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem("token")
    delete axios.defaults.headers.common["Authorization"]
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}