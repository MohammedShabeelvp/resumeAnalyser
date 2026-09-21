export default function SectionCard({ title, icon, children, className = "", style }) {
  return (
    <section className={`card p-6 ${className}`} style={style}>
      {title && (
        <div className="mb-4 flex items-center gap-2">
          {icon}
          <h2 className="text-lg" style={{ fontFamily: "var(--font-display)" }}>
            {title}
          </h2>
        </div>
      )}
      {children}
    </section>
  );
}
