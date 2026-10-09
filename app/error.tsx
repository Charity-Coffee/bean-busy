'use client';

import Image from 'next/image';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="page page--center">
      <Image src="/logo-mark.png" alt="" width={110} height={98} />
      <div className="stack">
        <h1>Something spilled.</h1>
        <p className="muted">
          That didn&apos;t work, but your stamps are safe. Give it another go, or head back to your card.
        </p>
      </div>
      <div className="stack">
        <button type="button" className="btn btn--primary btn--block" onClick={reset}>Try again</button>
        <a className="btn btn--outline btn--block" href="/">Back to my card</a>
      </div>
    </main>
  );
}
