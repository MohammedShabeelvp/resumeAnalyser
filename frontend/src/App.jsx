import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom"
import { useEffect, useState }                        from "react"
import { AuthProvider } from "./context/AuthProvider"
import ProtectedRoute     from "./components/ProtectedRoute"
import Navbar             from "./components/Navbar"
import UploadPage         from "./pages/UploadPage"
import AnalysisPage        from "./pages/AnalysisPage"
import MatchPage          from "./pages/MatchPage"
import HistoryPage        from "./pages/HistoryPage"
import LoginPage          from "./pages/LoginPage"
import SignupPage         from "./pages/SignupPage"

function FadeWrapper({ children }) {
  const location = useLocation();

  return (
    <div
      key={location.pathname}
      style={{
        animation: "fadeIn 0.2s ease",
      }}
    >
      {children}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <FadeWrapper>
          <Routes>
            {/* Public routes */}
            <Route path="/login"   element={<LoginPage />}   />
            <Route path="/signup"  element={<SignupPage />}  />
            <Route path="/"        element={<UploadPage />}  />
            <Route path="/analysis" element={<AnalysisPage />} />
            <Route path="/match"   element={<MatchPage />}   />

            {/* History requires login */}
            <Route path="/history" element={
              <ProtectedRoute><HistoryPage /></ProtectedRoute>
            }/>
          </Routes>
        </FadeWrapper>
      </BrowserRouter>
    </AuthProvider>
  )
}