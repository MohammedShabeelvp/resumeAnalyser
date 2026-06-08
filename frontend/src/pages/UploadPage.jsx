import { useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import Spinner from "../components/Spinner"

export default function UploadPage() {
  const [file, setFile]         = useState(null)
  const [status, setStatus]     = useState(null)
  const [message, setMessage]   = useState("")
  const [dragging, setDragging] = useState(false)
  const navigate                = useNavigate()

  const handleFile = (selectedFile) => {
    if (!selectedFile) return
    if (selectedFile.type !== "application/pdf") {
      setStatus("error")
      setMessage("Only PDF files are supported.")
      return
    }
    setFile(selectedFile)
    setStatus(null)
    setMessage("")
  }

  const handleFileChange = (e) => handleFile(e.target.files[0])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }, [])

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true)  }
  const handleDragLeave = ()  => setDragging(false)

  const handleUpload = async () => {
    if (!file) {
      setStatus("error")
      setMessage("Please select a PDF first.")
      return
    }

    const formData = new FormData()
    formData.append("file", file)

    try {
      setStatus("uploading")
      const res = await axios.post("http://localhost:5000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })

      sessionStorage.removeItem("lastJobDescription")
      sessionStorage.removeItem("matchData")
      sessionStorage.setItem("resumeData", JSON.stringify(res.data))
      navigate("/analysis")

    } catch (err) {
      setStatus("error")
      setMessage(err.response?.data?.error || "Upload failed. Is the backend running?")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        {/* Logo / title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Resume Analyzer</h1>
          <p className="text-sm text-gray-400 mt-1">
            Upload your resume to get your ATS score, skill analysis, and job recommendations
          </p>
        </div>

        {/* Upload card */}
        <div className="card">
          <label
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`block w-full border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
              dragging
                ? "border-blue-400 bg-blue-50"
                : file
                ? "border-green-300 bg-green-50"
                : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
            }`}
          >
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="text-3xl mb-3">
              {file ? "📁" : dragging ? "📂" : "📄"}
            </div>
            {file ? (
              <>
                <p className="text-sm font-medium text-gray-700">{file.name}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {(file.size / 1024).toFixed(0)} KB — click to change
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500">
                  Drag and drop your resume here
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  or click to browse — PDF only, max 5MB
                </p>
              </>
            )}
          </label>

          <button
            onClick={handleUpload}
            disabled={status === "uploading"}
            className="btn-primary mt-4"
          >
            {status === "uploading"
              ? <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                  Analysing resume...
                </span>
              : "Upload & Analyse →"
            }
          </button>

          {status === "error" && (
            <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">
              ✗ {message}
            </p>
          )}
        </div>

        {/* Features list */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          {[
            { icon: "🔍", label: "Skill extraction "         },
            { icon: "📋", label: "ATS scoring"    },
            { icon: "📊", label: "Gap analysis"        },
            { icon: "💼", label: "Role Suggestions" },
          ].map(({ icon, label }) => (
            <div key={label} className="card py-3 px-4 flex items-center gap-2">
              <span>{icon}</span>
              <span className="text-xs text-gray-500">{label}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate("/history")}
          className="mt-4 w-full text-sm text-gray-400 hover:text-gray-600 py-2 transition text-center"
        >
          View past analyses →
        </button>

      </div>
    </div>
  )
}