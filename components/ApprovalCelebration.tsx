'use client';

import { useEffect, useState, type CSSProperties } from 'react';

type Props = { latestApproved: { id: string; quantity: number; decidedAt: string | null } | null };
type Bean = { id: number; style: CSSProperties };

const STORAGE_KEY = 'bb:lastSeenApproved';
const RECENT_MS = 24 * 60 * 60 * 1000;
const SHOW_MS = 3600;
const BEAN_COUNT = 32;

// Survives re-renders and storage being unavailable, so one approval never plays twice per page load.
const played = new Set<string>();

function makeBeans(): Bean[] {
  return Array.from({ length: BEAN_COUNT }, (_, id) => ({
    id,
    style: {
      '--x': `${Math.round(Math.random() * 100)}%`,
      '--delay': `${(Math.random() * 0.9).toFixed(2)}s`,
      '--dur': `${(1.8 + Math.random() * 1.4).toFixed(2)}s`,
      '--spin': `${Math.round(240 + Math.random() * 480) * (Math.random() < 0.5 ? -1 : 1)}deg`,
      '--size': `${Math.round(16 + Math.random() * 14)}px`,
    } as CSSProperties,
  }));
}

/** Falling coffee beans + banner when staff approve a stamp request. */
export default function ApprovalCelebration({ latestApproved }: Props) {
  const [show, setShow] = useState<{ quantity: number; beans: Bean[] } | null>(null);
  const id = latestApproved?.id;

  useEffect(() => {
    if (!latestApproved || played.has(latestApproved.id)) return;
    played.add(latestApproved.id);

    let stored: string | null = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch { /* storage unavailable */ }
    if (stored === latestApproved.id) return;
    try { localStorage.setItem(STORAGE_KEY, latestApproved.id); } catch { /* storage unavailable */ }

    // First visit on this device: only celebrate if the approval is fresh.
    const recent = latestApproved.decidedAt
      ? Date.now() - new Date(latestApproved.decidedAt).getTime() < RECENT_MS
      : false;
    if (stored === null && !recent) return;

    setShow({ quantity: latestApproved.quantity, beans: makeBeans() });
    const t = setTimeout(() => setShow(null), SHOW_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!show) return null;
  const { quantity, beans } = show;

  return (
    <>
      <div className="beans" aria-hidden="true">
        {beans.map((b) => (
          <svg key={b.id} className="bean" style={b.style} viewBox="0 0 24 24">
            <ellipse cx="12" cy="12" rx="7" ry="10" transform="rotate(25 12 12)" />
            <path d="M8.5 4.5c4 3 2 6.5 4 8s2 4-1 7" />
          </svg>
        ))}
      </div>
      <div className="approved-toast" role="status">
        Approved! +{quantity} {quantity === 1 ? 'stamp' : 'stamps'}
      </div>
    </>
  );
}
