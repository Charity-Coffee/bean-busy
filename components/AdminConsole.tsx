'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { approveRequest, markRedeemed, rejectRequest } from '@/app/actions';
import { timeAgo } from '@/lib/format';
import { Alert, Check, ChevronLeft } from './Icons';

type Pending = { id: string; createdAt: string; quantity?: number; name: string; email: string };
type Reward = { id: string; issuedAt: string; name: string; email: string };
type Props = { pending: Pending[]; rewards: Reward[] };

const DISARM_MS = 4000;

export default function AdminConsole({ pending, rewards }: Props) {
  const initialIds = useRef(new Set(pending.map((p) => p.id)));
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [armed, setArmed] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [, startTransition] = useTransition();

  // Keep "x min ago" fresh.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  // Disarm a reject after a few seconds.
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(null), DISARM_MS);
    return () => clearTimeout(t);
  }, [armed]);

  const sorted = [...pending].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const sharedNames = (list: { name: string }[], n: string) => list.filter((x) => x.name === n).length > 1;

  function run(action: () => Promise<{ error?: string }>, id: string) {
    setError(false);
    startTransition(async () => {
      const res = await action();
      if (res.error) setError(true);
      else setSeen((s) => new Set(s).add(id));
    });
  }

  const approve = (id: string) => {
    setArmed(null);
    run(() => approveRequest(id), id);
  };
  const reject = (id: string) => {
    setArmed(null);
    run(() => rejectRequest(id), id);
  };

  return (
    <>
      <header className="row row--between">
        <h1 style={{ fontSize: 32 }}>Staff console</h1>
        <a className="link" href="/"><ChevronLeft style={{ width: 18, height: 18 }} />My card</a>
      </header>
      {error && (
        <div role="alert" className="alert">
          <Alert /><span>That didn&apos;t go through. Check your connection and try again.</span>
        </div>
      )}
      <div className="admin-grid">
        <section className="admin-section" aria-labelledby="h-wait">
          <h2 id="h-wait">Waiting for approval ({sorted.length})</h2>
          {sorted.length === 0 ? (
            <p className="empty">All caught up.</p>
          ) : (
            <ul className="queue">
              {sorted.map((p) => {
                const isNew = !initialIds.current.has(p.id);
                const isArmed = armed === p.id;
                return (
                  <li key={p.id} className={'queue-row' + (isNew ? ' is-new' : '')}>
                    <div className="row row--between">
                      <div>
                        <div className="queue-row__name">{p.name || p.email}</div>
                        <div className="queue-row__time">
                          {(p.quantity ?? 1) > 1 && <strong>{p.quantity} coffees · </strong>}
                          {timeAgo(p.createdAt, now)}
                          {sharedNames(sorted, p.name) && ` · ${p.email}`}
                        </div>
                      </div>
                      {isNew && <span className="tag-new">New</span>}
                    </div>
                    <div className="row-actions">
                      {isArmed ? (
                        <button type="button" className="btn btn--confirm" aria-label={`Confirm reject ${p.name}`} onClick={() => reject(p.id)}>
                          Confirm
                        </button>
                      ) : (
                        <button type="button" className="btn btn--reject" aria-label={`Reject ${p.name}`} onClick={() => setArmed(p.id)}>
                          Reject
                        </button>
                      )}
                      <button type="button" className="btn btn--approve" aria-label={`Approve ${p.name}${(p.quantity ?? 1) > 1 ? `, ${p.quantity} coffees` : ''}`} onClick={() => approve(p.id)}>
                        <Check style={{ strokeWidth: 3.5 }} />Approve
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="admin-section" aria-labelledby="h-free">
          <h2 id="h-free">Free coffees to redeem ({rewards.length})</h2>
          {rewards.length === 0 ? (
            <p className="empty">None waiting.</p>
          ) : (
            <ul className="queue">
              {rewards.map((r) => (
                <li key={r.id} className="queue-row">
                  <div>
                    <div className="queue-row__name">{r.name || r.email}</div>
                    <div className="queue-row__time">
                      earned {timeAgo(r.issuedAt, now)}
                      {sharedNames(rewards, r.name) && ` · ${r.email}`}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn--redeem btn--block"
                    aria-label={`Mark ${r.name}'s coffee redeemed`}
                    onClick={() => run(() => markRedeemed(r.id), r.id)}
                  >
                    Mark redeemed
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
