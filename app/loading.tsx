export default function Loading() {
  return (
    <main className="page" role="status" aria-label="Loading">
      <div className="stack">
        <div className="sk" style={{ width: 120, height: 16 }} />
        <div className="sk" style={{ width: 180, height: 36 }} />
      </div>
      <div className="stamp-card">
        <ol className="stamps">
          {Array.from({ length: 10 }, (_, i) => <li key={i} className="sk sk--circle" />)}
        </ol>
      </div>
      <div className="sk" style={{ height: 64, borderRadius: 18 }} />
      {[0, 1, 2].map((i) => <div key={i} className="sk" style={{ height: 56, borderRadius: 14 }} />)}
    </main>
  );
}
