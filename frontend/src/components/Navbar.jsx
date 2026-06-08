import { useState, useRef, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function Navbar() {
  const navigate         = useNavigate()
  const location         = useLocation()
  const { user, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Close dropdown on route change
  //useEffect(() => {
  //  setDropdownOpen(false)
  //}, [location.pathname])

  // Replace the useEffect with this helper:
  const navigateTo = (path) => {
    setDropdownOpen(false)
    navigate(path)
  }

  const handleLogout = () => {
    logout()
    navigateTo("/")
    setDropdownOpen(false)
  }

  // Get initials for avatar
  const getInitials = (name) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <nav className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">

      {/* Logo */}
      <span
        onClick={() => navigateTo("/")}
        className="text-sm font-semibold text-gray-900 cursor-pointer"
      >
        Resume Analyzer
      </span>

      <div className="flex items-center gap-2">

        {/* Upload link — always visible */}
        <button
          onClick={() => navigateTo("/")}
          className={`text-sm px-3 py-1.5 rounded-lg transition ${
            location.pathname === "/"
              ? "bg-blue-50 text-blue-600 font-medium"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
        >
          Upload
        </button>

        {user ? (
          /* Logged in — profile avatar with dropdown */
          <div className="relative ml-2" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(prev => !prev)}
              className="flex items-center gap-2 pl-3 border-l border-gray-100"
            >
              {/* Avatar circle with initials */}
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium">
                {getInitials(user.name)}
              </div>
              {/* Chevron */}
              <svg
                className={`w-3 h-3 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown panel */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-100 rounded-2xl shadow-lg py-2 z-50">

                {/* User info */}
                <div className="px-4 py-2 border-b border-gray-50 mb-1">
                  <p className="text-sm font-medium text-gray-800 truncate">{user.name}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>

                {/* History */}
                <button
                  onClick={() => navigateTo("/history")}
                  className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2 transition"
                >
                  <span>🕘</span> History
                </button>

                {/* Divider */}
                <div className="border-t border-gray-50 my-1" />

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2 transition"
                >
                  <span>🚪</span> Logout
                </button>

              </div>
            )}
          </div>

        ) : (
          /* Guest — single auth button */
          <button
            onClick={() => navigate("/login")}
            className="ml-2 text-sm text-white bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-lg transition"
          >
            Sign in
          </button>
        )}

      </div>
    </nav>
  )
}