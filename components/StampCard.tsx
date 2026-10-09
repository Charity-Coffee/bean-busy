'use client';

import { useEffect, useRef, useState } from 'react';
import { Cup } from './Icons';

type Props = { stamps: number; threshold: number; rewardsAvailable: number };

export default function StampCard({ stamps, threshold }: Props) {
  const prev = useRef(stamps);
  const [justLanded, setJustLanded] = useState(false);

  useEffect(() => {
    if (stamps > prev.current) {
      setJustLanded(true);
      const t = setTimeout(() => setJustLanded(false), 900);
      prev.current = stamps;
      return () => clearTimeout(t);
    }
    prev.current = stamps;
  }, [stamps]);

  const slots = Array.from({ length: threshold }, (_, i) => i + 1);
  const left = Math.max(threshold - stamps, 0);

  return (
    <section className="stamp-card" aria-label="Stamp card">
      <div className="stamp-card__head">
        <h2>Your stamp card</h2>
        <p className="stamp-card__count">{stamps} of {threshold}</p>
      </div>
      <ol className="stamps">
        {slots.map((n) => {
          const filled = n <= stamps;
          const isPrize = n === threshold && !filled;
          const isNew = filled && n === stamps && justLanded;
          return (
            <li
              key={n}
              className={['stamp', filled && 'is-filled', isNew && 'is-new', isPrize && 'is-prize']
                .filter(Boolean)
                .join(' ')}
            >
              {filled ? (
                <>
                  <Cup />
                  <span className="sr-only">Stamp {n}, collected</span>
                </>
              ) : isPrize ? (
                <span>Free<b>{n}</b></span>
              ) : (
                n
              )}
            </li>
          );
        })}
      </ol>
      <p className="muted" style={{ fontSize: 16 }}>
        {left === 1 ? '1 more stamp and your next coffee is free.' : `${left} more stamps and your next coffee is free.`}
      </p>
    </section>
  );
}
