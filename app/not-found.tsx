import Image from 'next/image';

export default function NotFound() {
  return (
    <main className="page page--center">
      <Image src="/logo-mark.png" alt="" width={110} height={98} />
      <div className="stack">
        <h1>Something spilled.</h1>
        <p className="muted">We couldn&apos;t find that page. Head back to your card.</p>
      </div>
      <a className="btn btn--primary btn--block" href="/">Back to my card</a>
    </main>
  );
}
