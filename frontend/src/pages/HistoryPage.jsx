import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/api";
import { session } from "../lib/storage";
import useAsync from "../hooks/useAsync";
import Spinner from "../components/Spinner";
import ScoreBar from "../components/ScoreBar";

async function fetchHistory() {
  const res = await api.get("/history");
  return res.data.history || [];
}

function HistoryCard({ item, onRenamed, onDeleted }) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(item.name || "");
  const [expanded, setExpanded] = useState(false);
  const [jd, setJd] = useState(item.job_description || "");
  const navigate = useNavigate();

  const rename = useAsync((newName) => api.patch(`/history/${item.id}/rename`, { name: newName }));
  const del = useAsync(() => api.delete(`/history/${item.id}`));
  const rematch = useAsync((jobDescription) => api.post(`/history/${item.id}/rematch`, { job_description: jobDescription }));

  const handleRename = async () => {
    try {
      await rename.execute(name);
      onRenamed(item.id, name);
      setRenaming(false);
    } catch {
      // error surfaced via rename.error
    }
  };

  const handleDelete = async () => {
    try {
      await del.execute();
      onDeleted(item.id);
    } catch {
      // error surfaced via del.error
    }
  };

  const handleRematch = async () => {
    if (!jd.trim()) return;
    try {
      const data = await rematch.execute(jd);
      session.set("matchData", data);
      navigate("/match");
    } catch {
      // error surfaced via rematch.error
    }
  };

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {renaming ? (
            <div className="flex items-center gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border px-2 py-1 text-lg"
                style={{ borderColor: "var(--color-border)", fontFamily: "var(--font-display)" }}
                autoFocus
              />
              <button onClick={handleRename} disabled={rename.isLoading} className="btn-secondary px-3 py-1 text-xs">
                Save
              </button>
              <button
                onClick={() => {
                  setRenaming(false);
                  setName(item.name || "");
                }}
                className="text-xs text-(--color-muted)"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="truncate text-lg" style={{ fontFamily: "var(--font-display)" }}>
                {item.name}
              </h3>
              <button onClick={() => setRenaming(true)} className="text-(--color-muted) hover:text-(--color-teal)">
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M13.5 4.5 15.5 6.5 7 15 4 16l1-3 8.5-8.5Z"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          )}
          <p className="truncate text-xs text-(--color-muted)">{item.filename}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {item.job_role && (
              <span
                className="rounded-full px-2 py-0.5 text-xs"
                style={{ background: "#F3E8FF", color: "#6B21A8" }}
              >
                {item.job_role}
              </span>
            )}
            <span className="text-xs text-(--color-muted)">
              {item.analysis_time ? new Date(item.analysis_time).toLocaleString() : "—"}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-teal)" }} className="text-lg">
            {Math.round(item.combined_score ?? item.score ?? 0)}%
          </span>
          <button onClick={handleDelete} className="text-(--color-muted) hover:text-red-600">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M5 6.5h10M8.5 6.5V5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1.5M6.5 6.5 7 16h6l.5-9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <ScoreBar label="Match score" score={item.similarity_score ?? 0} color="var(--color-teal)" />
        <ScoreBar label="ATS score" score={item.ats_score ?? 0} color="#8B5CF6" />
      </div>

      <div className="mt-3 flex gap-4 text-xs text-(--color-muted)">
        <span>{item.skill_count ?? "—"} skills</span>
        <span>{item.missing_count ?? "—"} gaps</span>
        <span>Rating: {item.ats_label ?? "—"}</span>
      </div>

      {del.error && <p className="mt-2 text-xs text-red-600">{del.error}</p>}
      {rename.error && <p className="mt-2 text-xs text-red-600">{rename.error}</p>}

      <div className="mt-4">
        {!expanded ? (
          <button onClick={() => setExpanded(true)} className="btn-secondary text-xs">
            Match again
          </button>
        ) : (
          <div>
            <textarea
              rows={4}
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              className="w-full rounded-lg border p-2 text-sm"
              style={{ borderColor: "var(--color-border)" }}
            />
            {rematch.error && <p className="mt-1 text-xs text-red-600">{rematch.error}</p>}
            <div className="mt-2 flex gap-2">
              <button onClick={handleRematch} disabled={rematch.isLoading} className="btn-primary text-xs">
                {rematch.isLoading ? "Running…" : "Run match"}
              </button>
              <button onClick={() => setExpanded(false)} className="text-xs text-(--color-muted)">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const [items, setItems] = useState([]);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const history = useAsync(fetchHistory);
  const clearAll = useAsync(() => api.delete("/history"));

  useEffect(() => {
    history.execute().then(setItems).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClearAll = async () => {
    try {
      await clearAll.execute();
      setItems([]);
      setConfirmingClear(false);
    } catch {
      // error surfaced via clearAll.error
    }
  };

  return (
    <div className="page-container py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl" style={{ fontFamily: "var(--font-display)" }}>
          Case log
        </h1>
        {items.length > 0 &&
          (confirmingClear ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-(--color-muted)">Delete all history?</span>
              <button onClick={handleClearAll} className="text-red-600">
                Confirm
              </button>
              <button onClick={() => setConfirmingClear(false)} className="text-(--color-muted)">
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmingClear(true)} className="btn-secondary text-sm">
              Clear all
            </button>
          ))}
      </div>

      {history.isLoading && <Spinner label="Loading history" />}
      {history.isError && <p className="text-sm text-red-600">{history.error}</p>}

      {history.isSuccess && items.length === 0 && (
        <div className="card p-10 text-center">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mx-auto mb-4 text-(--color-muted)">
            <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="1.5" />
            <path d="M24 16v8l6 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="mb-4 text-sm text-(--color-muted)">No analyses yet. Upload a resume to get started.</p>
          <Link to="/" className="btn-primary inline-block">
            Upload resume
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {items.map((item) => (
          <HistoryCard
            key={item.id}
            item={item}
            onRenamed={(id, newName) => setItems((prev) => prev.map((it) => (it.id === id ? { ...it, name: newName } : it)))}
            onDeleted={(id) => setItems((prev) => prev.filter((it) => it.id !== id))}
          />
        ))}
      </div>
    </div>
  );
}
