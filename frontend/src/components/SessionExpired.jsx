import { Link } from "react-router-dom";

export default function SessionExpired() {
  return (
    <div className="page-container flex min-h-[70vh] items-center justify-center">
      <div className="card mx-auto max-w-sm p-8 text-center" style={{ animation: "fadeIn 0.3s ease" }}>
        <svg width="56" height="56" viewBox="0 0 48 48" fill="none" className="mx-auto mb-5">
          <rect x="10" y="6" width="28" height="36" rx="2" stroke="var(--color-muted)" strokeWidth="1.5" />
          <path d="M16 16h16M16 23h16M16 30h10" stroke="var(--color-muted)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <h1 className="mb-2 text-2xl" style={{ fontFamily: "var(--font-display)" }}>
          Session expired
        </h1>
        <p className="mb-6 text-sm text-[var(--color-muted)]">
          We couldn't find your resume data for this session. Upload it again to pick up where you left off.
        </p>
        <Link to="/" className="btn-primary inline-block">
          Upload resume again →
        </Link>
      </div>
    </div>
  );
}
