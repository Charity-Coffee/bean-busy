export default function AdminLoading() {
  return (
    <main className="page page--admin" role="status" aria-label="Loading">
      <div className="sk" style={{ width: 220, height: 36 }} />
      {[0, 1, 2].map((i) => <div key={i} className="sk" style={{ height: 120, borderRadius: 20 }} />)}
    </main>
  );
}
