import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { session } from "../lib/storage";
import SessionExpired from "../components/SessionExpired";
import ScoreRing from "../components/ScoreRing";
import ScoreBar from "../components/ScoreBar";
import SkillBadge from "../components/SkillBadge";

function teal(score) {
  const opacity = 0.3 + (Math.max(0, Math.min(100, score)) / 100) * 0.7;
  return `rgba(26, 107, 82, ${opacity.toFixed(2)})`;
}

const SUGGESTION_ICON = {
  skill: (
    <path
      d="M9 3.5a1.5 1.5 0 0 1 3 0V5a1 1 0 0 0 1 1h1.5a1.5 1.5 0 0 1 0 3H14a1 1 0 0 0-1 1v1.5a1.5 1.5 0 0 1-3 0V10a1 1 0 0 0-1-1H7.5a1.5 1.5 0 0 1 0-3H9a1 1 0 0 0 1-1V3.5Z"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
  ),
  keyword: (
    <>
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10" cy="10" r="2.3" stroke="currentColor" strokeWidth="1.5" />
    </>
  ),
  action_verb: <path d="M11 3 5 12h4l-1 5 6-9h-4l1-5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />,
  structure: <path d="M4 5h12M4 9.5h12M4 14h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />,
  default: (
    <path
      d="M10 3.5a4.5 4.5 0 0 0-2.6 8.18c.4.28.6.62.6 1.02V14h4v-1.3c0-.4.2-.74.6-1.02A4.5 4.5 0 0 0 10 3.5ZM8.5 16.5h3"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
};

const PRIORITY_STYLE = {
  high: { background: "#FEF2F2", color: "#991B1B" },
  medium: { background: "#FFFBEB", color: "#92400E" },
  low: { background: "#EEF6F3", color: "#1A6B52" },
};

export default function MatchPage() {
  const [matchData, setMatchData] = useState(undefined);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setMatchData(session.get("matchData"));
  }, []);

  const delays = useMemo(() => [0, 120, 240, 360, 480, 600, 720, 840].map((ms) => ({ animationDelay: `${ms}ms` })), []);

  if (matchData === undefined) return null;
  if (!matchData) return <SessionExpired />;

  const {
    tfidf_score = 0,
    bert_score = 0,
    combined_score = 0,
    label = "",
    common_keywords = [],
    ats = {},
    gaps = {},
    suggestions = [],
    saved_to_history,
  } = matchData;

  const bannerTone =
    combined_score >= 75 ? "#EEF6F3" : combined_score >= 50 ? "#FFFBEB" : "#FEF2F2";
  const bannerText =
    combined_score >= 75 ? "var(--color-teal)" : combined_score >= 50 ? "#92400E" : "#991B1B";

  const breakdown = ats.breakdown || {};
  const insights = ats.insights || {};
  const missing = gaps.missing || {};

  return (
    <div className="page-container py-12">
      {/* 1. Summary banner */}
      <div
        className="mb-6 rounded-2xl p-6"
        style={{ background: bannerTone, animation: "slideUp 0.4s ease", ...delays[0] }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-5xl" style={{ fontFamily: "var(--font-display)", color: bannerText }}>
              {Math.round(combined_score)}
            </p>
            <p className="mt-1 text-sm" style={{ color: bannerText }}>
              {label || "Match summary"}
            </p>
          </div>
          <p className="text-sm" style={{ color: bannerText }}>
            {gaps.total_missing ?? 0} gaps identified
          </p>
        </div>
      </div>

      {/* 2. Score rings */}
      <div
        className="card mb-6 flex flex-wrap items-center justify-center gap-10 p-8"
        style={{ animation: "slideUp 0.4s ease both", ...delays[1] }}
      >
        <ScoreRing score={combined_score} color={teal(combined_score)} label="Match score" />
        <ScoreRing score={ats.ats_score ?? 0} color={teal(ats.ats_score ?? 0)} label="ATS score" />
      </div>

      {/* 3. Score breakdown */}
      <div className="card mb-6 space-y-4 p-6" style={{ animation: "slideUp 0.4s ease both", ...delays[2] }}>
        <p className="section-label">Score breakdown</p>
        <ScoreBar label="TF-IDF similarity" score={tfidf_score} color="#3B82F6" />
        <ScoreBar label="BERT similarity" score={bert_score} color="#8B5CF6" />
        <ScoreBar label="Combined score" score={combined_score} color="var(--color-teal-dim)" />
      </div>

      {/* 4. ATS breakdown */}
      <div className="card mb-6 space-y-4 p-6" style={{ animation: "slideUp 0.4s ease both", ...delays[3] }}>
        <p className="section-label">ATS breakdown</p>
        {[
          ["skills", "#1A6B52"],
          ["keywords", "#3B82F6"],
          ["experience", "#8B5CF6"],
          ["education", "#D97706"],
          ["structure", "#0EA5E9"],
          ["action_verbs", "#DB2777"],
          ["contact_info", "#65A30D"],
        ].map(([key, color]) => {
          const entry = breakdown[key];
          if (!entry) return null;
          return (
            <ScoreBar
              key={key}
              label={key.replace(/_/g, " ")}
              score={entry.score}
              weight={entry.weight}
              color={color}
            />
          );
        })}

        {breakdown.skills && (
          <div className="grid gap-3 pt-2 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs text-(--color-muted)">Matched skills</p>
              <div className="flex flex-wrap gap-1.5">
                {(breakdown.skills.matched_skills || []).map((s) => (
                  <SkillBadge key={s} skill={s} variant="success" />
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs text-(--color-muted)">Missing skills</p>
              <div className="flex flex-wrap gap-1.5">
                {(breakdown.skills.missing_skills || []).map((s) => (
                  <SkillBadge key={s} skill={s} variant="missing" />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Gap analysis */}
      <div className="card mb-6 p-6" style={{ animation: "slideUp 0.4s ease both", ...delays[4] }}>
        <p className="section-label mb-4">Gap analysis</p>
        {gaps.priority?.length > 0 && (
          <div className="mb-4 rounded-lg p-3" style={{ background: "#FFFBEB" }}>
            <p className="mb-2 text-xs font-medium" style={{ color: "#92400E" }}>
              Top priorities
            </p>
            <div className="flex flex-wrap gap-1.5">
              {gaps.priority.map((p) => (
                <SkillBadge key={p} skill={p} variant="missing" />
              ))}
            </div>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ["Skills", missing.skills],
            ["Action verbs", missing.action_verbs],
            ["Soft skills", missing.soft_skills],
            ["Domain terms", missing.domain_terms],
          ].map(([title, list]) => (
            <div key={title}>
              <p className="mb-2 text-xs text-(--color-muted)">{title}</p>
              <div className="flex flex-wrap gap-1.5">
                {(list || []).length === 0 ? (
                  <span className="text-xs text-(--color-muted)">None missing</span>
                ) : (
                  list.map((item) => <SkillBadge key={item} skill={item} variant="missing" />)
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Suggestions */}
      {suggestions.length > 0 && (
        <div className="card mb-6 p-6" style={{ animation: "slideUp 0.4s ease both", ...delays[5] }}>
          <p className="section-label mb-4">Resume suggestions</p>
          <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
            {suggestions.map((s, i) => (
              <div key={i} className="flex items-start gap-3 border-b border-(--color-border)] pb-3 last:border-none">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="mt-0.5 shrink-0" style={{ color: "var(--color-teal)" }}>
                  {SUGGESTION_ICON[s.type] || SUGGESTION_ICON.default}
                </svg>
                <p className="flex-1 text-sm">{s.message}</p>
                <span
                  className="rounded-full px-2 py-0.5 text-xs"
                  style={PRIORITY_STYLE[s.priority] || PRIORITY_STYLE.low}
                >
                  {s.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Common keywords */}
      {common_keywords.length > 0 && (
        <div className="card mb-6 p-6" style={{ animation: "slideUp 0.4s ease both", ...delays[6] }}>
          <p className="section-label mb-3">Common keywords</p>
          <div className="flex flex-wrap gap-2">
            {common_keywords.map((kw) => (
              <SkillBadge key={kw} skill={kw} variant="success" />
            ))}
          </div>
        </div>
      )}

      {/* 8 / 9. Guest nudge or saved confirmation */}
      {!user && (
        <div className="card flex flex-wrap items-center justify-between gap-4 p-5" style={{ background: "#EFF6FF" }}>
          <p className="text-sm text-[#1E40AF]">Save this analysis? Sign in to keep it in your history.</p>
          <div className="flex gap-2">
            <Link to="/login" className="btn-secondary">
              Sign in
            </Link>
            <Link to="/signup" className="btn-primary">
              Sign up
            </Link>
          </div>
        </div>
      )}
      {user && saved_to_history && (
        <div className="rounded-lg p-4 text-sm" style={{ background: "#EDFAF3", color: "#166534" }}>
          ✓ Saved to history
        </div>
      )}
    </div>
  );
}
