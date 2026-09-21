import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function initials(name = "", email = "") {
  const source = name?.trim() || email?.trim() || "?";
  const parts = source.split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navigateTo = (path) => {
    setOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-20 bg-[var(--color-bg)]/90 backdrop-blur border-b border-[var(--color-border)]">
      <div className="page-container flex items-center justify-between py-4">
        <Link to="/" className="text-xl" style={{ fontFamily: "var(--font-display)" }}>
          Resume Analyzer
        </Link>

        <nav className="flex items-center gap-4">
          <Link to="/" className="text-sm text-[var(--color-ink)] hover:text-[var(--color-teal)] transition-colors">
            Upload
          </Link>

          {!user && (
            <Link to="/login" className="btn-secondary">
              Sign in
            </Link>
          )}

          {user && (
            <div className="relative" ref={ref}>
              <button
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-2"
                aria-expanded={open}
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium text-white"
                  style={{ background: "var(--color-teal)", fontFamily: "var(--font-sans)" }}
                >
                  {initials(user.name, user.email)}
                </span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="none"
                  style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s ease" }}
                >
                  <path d="M5 7.5 10 12.5 15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {open && (
                <div className="absolute right-0 mt-3 w-56 card p-3" style={{ animation: "fadeIn 0.15s ease" }}>
                  <p style={{ fontFamily: "var(--font-display)" }} className="text-base">
                    {user.name}
                  </p>
                  <p className="text-xs text-[var(--color-muted)] truncate">{user.email}</p>

                  <div className="my-3 h-px bg-[var(--color-border)]" />

                  <button
                    onClick={() => navigateTo("/history")}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-[var(--color-paper)] transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="7.25" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M10 6v4l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    History
                  </button>

                  <div className="my-3 h-px bg-[var(--color-border)]" />

                  <button
                    onClick={handleLogout}
                    className="group flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-red-50 transition-colors"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 20 20"
                      fill="none"
                      className="text-current group-hover:text-red-600"
                    >
                      <path
                        d="M7.5 3.5H4.5A1.5 1.5 0 0 0 3 5v10a1.5 1.5 0 0 0 1.5 1.5h3M12.5 13.5 17 10l-4.5-3.5M17 10H7.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="group-hover:text-red-600">Logout</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
