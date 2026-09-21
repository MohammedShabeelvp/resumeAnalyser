import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/api";
import { session } from "../lib/storage";
import useAsync from "../hooks/useAsync";
import AnalysisLoader from "../components/AnalysisLoader";

const FEATURES = [
  {
    title: "ATS scoring",
    icon: (
      <path d="M4 10h4M4 14h9M4 6h12M4 18h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    ),
  },
  {
    title: "Skill extraction",
    icon: (
      <path
        d="M9 3.5a1.5 1.5 0 0 1 3 0V5a1 1 0 0 0 1 1h1.5a1.5 1.5 0 0 1 0 3H14a1 1 0 0 0-1 1v1.5a1.5 1.5 0 0 1-3 0V10a1 1 0 0 0-1-1H7.5a1.5 1.5 0 0 1 0-3H9a1 1 0 0 0 1-1V3.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: "Gap analysis",
    icon: (
      <>
        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M13 7 7 13M7 7l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
  },
  {
    title: "Job recommendations",
    icon: (
      <path
        d="M4 8h12v8a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 4 16V8ZM7 8V6.5A1.5 1.5 0 0 1 8.5 5h3A1.5 1.5 0 0 1 13 6.5V8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    ),
  },
];

async function uploadResume(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [typeError, setTypeError] = useState("");
  const navigate = useNavigate();
  const { execute, isLoading, error } = useAsync(uploadResume);

  const acceptFile = (f) => {
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      setTypeError("Please choose a PDF file.");
      setFile(null);
      return;
    }
    setTypeError("");
    setFile(f);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    acceptFile(e.dataTransfer.files?.[0]);
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    try {
      const data = await execute(file);
      session.set("resumeData", data);
      navigate("/analysis");
    } catch {
      // error already surfaced via useAsync
    }
  };

  return (
    <div className="page-container flex justify-center py-16">
      <div className="w-full" style={{ maxWidth: "28rem" }}>
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl" style={{ fontFamily: "var(--font-display)" }}>
            Resume Analyzer
          </h1>
          <p className="text-sm text-(--color-muted)">
            Upload your resume to get an ATS score, skill breakdown, and tailored suggestions.
          </p>
        </div>

        <div className="card p-6">
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors"
            style={{
              borderColor: dragOver ? "var(--color-teal)" : "var(--color-border)",
              background: dragOver ? "rgba(26,107,82,0.05)" : "transparent",
            }}
          >
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => acceptFile(e.target.files?.[0])}
            />

            {file ? (
              <>
                <svg width="28" height="28" viewBox="0 0 20 20" fill="none" className="mb-3" style={{ color: "var(--color-teal)" }}>
                  <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M6.5 10.2 8.8 12.5 13.5 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-(--color-muted)">{(file.size / 1024).toFixed(0)} KB</p>
              </>
            ) : (
              <>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="mb-3 text-(--color-muted)">
                  <path
                    d="M7 17.5a4 4 0 0 1-.7-7.94A5 5 0 0 1 16 8a4.5 4.5 0 0 1-.5 9H7Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <path d="M12 9.5v7M9 12l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-sm font-medium">Drag a PDF here, or click to browse</p>
                <p className="text-xs text-(--color-muted)">PDF only</p>
              </>
            )}
          </label>

          {typeError && <p className="mt-3 text-xs text-red-600">{typeError}</p>}

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="mt-0.5 shrink-0">
                <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M7.5 7.5 12.5 12.5M12.5 7.5 7.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <button onClick={handleUpload} disabled={!file || isLoading} className="btn-primary mt-5 w-full">
            {isLoading ? <AnalysisLoader /> : "Analyze resume"}
          </button>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card flex items-center gap-2 p-3">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" style={{ color: "var(--color-teal)" }}>
                {f.icon}
              </svg>
              <span className="text-xs" style={{ fontFamily: "var(--font-sans)" }}>
                {f.title}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <Link to="/history" className="text-sm text-(--color-teal) hover:underline">
            View past analyses →
          </Link>
        </div>
      </div>
    </div>
  );
}
