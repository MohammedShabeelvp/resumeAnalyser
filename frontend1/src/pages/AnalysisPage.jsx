import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { session } from "../lib/storage";
import useAsync from "../hooks/useAsync";
import SessionExpired from "../components/SessionExpired";
import CategoryCard from "../components/CategoryCard";
import SkillBadge from "../components/SkillBadge";
import AnalysisLoader from "../components/AnalysisLoader";
import { normalizeSkills } from "../lib/skills";
import { savePendingAnalysis } from "../lib/storage"
import { useAuth } from "../context/AuthContext"


async function fetchRecommendations(resumeText) {
  const res = await api.post("/recommend", { resume_text: resumeText });
  return res.data;
}

async function runMatch(resumeText, jobDescription, uploadId) {
  const res = await api.post("/match", {
    resume_text: resumeText,
    job_description: jobDescription,
    upload_id: uploadId,
  });
  return res.data;
}

export default function AnalysisPage() {
  const [resumeData, setResumeData] = useState(undefined);
  const [jobDescription, setJobDescription] = useState(() => session.get("lastJobDescription") || "");
  const navigate = useNavigate();
  const { user } = useAuth();

  const recommend = useAsync(fetchRecommendations);
  const match = useAsync(runMatch)
  useEffect(() => {
    const data = session.get("resumeData");
    setResumeData(data);
  }, []);

  useEffect(() => {
    if (resumeData) {
      recommend.execute(resumeData.text ?? resumeData.cleaned).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeData]);

  if (resumeData === undefined) return null;
  if (!resumeData) return <SessionExpired />;

  const { all: allSkills, categories } = normalizeSkills(resumeData.skills);

  const handleJdChange = (value) => {
    setJobDescription(value);
    session.set("lastJobDescription", value);
  };

  const handleMatch = async () => {
    if (!jobDescription.trim() || !resumeData) return
    try {
      const text = resumeData.text ?? resumeData.cleaned
      const data = await match.execute(text, jobDescription, resumeData.upload_id)
      session.set("matchData", data)

      // Save pending for guests
      if (!resumeData.upload_id) {
        savePendingAnalysis({
          resume_text:     text,
          job_description: jobDescription,
          filename:        resumeData.filename,
          skills:          resumeData.skills?.detected || [],
          match_data:      data
        })
      }

      navigate("/match")
    } catch {
      // surfaced via match.error
    }
  }
  return (
    <div className="page-container py-12" style={{ animation: "fadeIn 0.3s ease" }}>
      {/* 1. Header */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-label mb-1">{resumeData.filename}</p>
          <h1 className="text-3xl" style={{ fontFamily: "var(--font-display)" }}>
            Resume analysis
          </h1>
        </div>
        <div className="text-right">
          <p className="text-4xl" style={{ fontFamily: "var(--font-display)", color: "var(--color-teal)" }}>
            {allSkills.length}
          </p>
          <p className="section-label">skills found</p>
        </div>
      </div>

      {/* 2. All detected skills */}
      <section className="card mb-6 max-h-48 overflow-y-auto p-5">
        <p className="section-label mb-3">All detected skills</p>
        <div className="flex flex-wrap gap-2">
          {allSkills.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">No skills detected.</p>
          ) : (
            allSkills.map((skill) => <SkillBadge key={skill} skill={skill} variant="default" />)
          )}
        </div>
      </section>

      {/* 3. Skills by category */}
      {Object.keys(categories).length > 0 && (
        <section className="mb-6">
          <p className="section-label mb-3">Skills by category</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(categories).map(([title, list]) => (
              <CategoryCard key={title} title={title} skills={Array.isArray(list) ? list : []} />
            ))}
          </div>
        </section>
      )}

      {/* 4. Job recommendations */}
      <section className="card mb-6 p-5">
        <p className="section-label mb-3">Job recommendations</p>
        {recommend.isLoading && <p className="text-sm text-[var(--color-muted)]">Finding roles that fit…</p>}
        {recommend.isError && <p className="text-sm text-red-600">{recommend.error}</p>}
        {recommend.isSuccess && (
          <div className="max-h-60 space-y-2 overflow-y-auto">
            {(recommend.data?.recommendations || []).map((rec) => (
              <div key={rec.role} className="flex items-center justify-between border-b border-[var(--color-border)] py-2 last:border-none">
                <div>
                  <p className="text-sm font-medium">{rec.role}</p>
                  <p className="text-xs text-[var(--color-muted)]">{rec.reason}</p>
                </div>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-teal)" }} className="text-sm">
                  {rec.score}%
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5 & 6. Job description + match */}
      <section className="card mb-6 p-5">
        <p className="section-label mb-3">Compare to a job description</p>
        <textarea
          rows={6}
          value={jobDescription}
          onChange={(e) => handleJdChange(e.target.value)}
          placeholder="Paste the job description here…"
          className="w-full rounded-lg border p-3 text-sm outline-none transition-colors"
          style={{ borderColor: "var(--color-border)", fontFamily: "var(--font-sans)" }}
          onFocus={(e) => (e.target.style.borderColor = "var(--color-teal)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
        />
        {match.isError && <p className="mt-2 text-sm text-red-600">{match.error}</p>}
        <button
          onClick={handleMatch}
          disabled={!jobDescription.trim() || match.isLoading}
          className="btn-primary mt-4 w-full"
        >
          {match.isLoading ? <AnalysisLoader /> : "Analyse match"}
        </button>
        {!user && (
          <p className="mt-2 text-center text-[11px] text-[var(--color-muted)]">
            Sign in after matching to save this analysis to your history.
          </p>
        )}
      </section>

      {/* 7. Raw extracted text */}
      <details className="paper-panel p-5">
        <summary className="cursor-pointer text-sm" style={{ fontFamily: "var(--font-sans)" }}>
          Raw extracted text
        </summary>
        <pre className="mt-3 whitespace-pre-wrap text-sm" style={{ fontFamily: "var(--font-mono)" }}>
          {resumeData.text || resumeData.cleaned || "No text available."}
        </pre>
      </details>
    </div>
  );
}
