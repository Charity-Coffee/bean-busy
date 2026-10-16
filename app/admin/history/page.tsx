import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { dayOf, formatDay, formatWhen } from '@/lib/format';
import { Check, Cross, Cup } from '@/components/Icons';

type Who = { name: string; email: string };
type Joined<T> = T | T[] | null;
const one = <T,>(v: Joined<T>): T | null => (Array.isArray(v) ? v[0] ?? null : v);

type Kind = 'approved' | 'rejected' | 'redeemed';
type Entry = {
  key: string; kind: Kind; at: string; since: string;
  name: string; email: string; quantity: number; by: string | null;
};

const TYPES = [
  { value: 'all', label: 'All' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'redeemed', label: 'Redeemed' },
] as const;
type TypeValue = (typeof TYPES)[number]['value'];

const PAGE = 50;
const LABEL: Record<Kind, string> = { approved: 'Approved', rejected: 'Rejected', redeemed: 'Free coffee redeemed' };

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; limit?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? '').trim().slice(0, 80);
  const type: TypeValue = TYPES.some((t) => t.value === sp.type) ? (sp.type as TypeValue) : 'all';
  const limit = Math.min(Math.max(parseInt(sp.limit ?? '', 10) || PAGE, PAGE), 500);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: me } = await supabase.from('profiles').select('is_staff').eq('id', user.id).maybeSingle();
  if (!me?.is_staff) redirect('/');

  // Strip characters that mean something in PostgREST filters or ilike patterns.
  const term = q.replace(/[%_,()\\"*]/g, ' ').trim();
  const pattern = `name.ilike.*${term}*,email.ilike.*${term}*`;

  const wantRequests = type === 'all' || type === 'approved' || type === 'rejected';
  const wantRewards = type === 'all' || type === 'redeemed';

  let reqQuery = supabase
    .from('stamp_requests')
    .select('id, status, quantity, created_at, decided_at, customer:profiles!stamp_requests_user_id_fkey!inner(name, email), decider:profiles!stamp_requests_decided_by_fkey(name)')
    .neq('status', 'pending')
    .order('decided_at', { ascending: false })
    .limit(limit);
  if (type === 'approved' || type === 'rejected') reqQuery = reqQuery.eq('status', type);
  if (term) reqQuery = reqQuery.or(pattern, { referencedTable: 'customer' });

  let rewQuery = supabase
    .from('rewards')
    .select('id, issued_at, redeemed_at, customer:profiles!rewards_user_id_fkey!inner(name, email), redeemer:profiles!rewards_redeemed_by_fkey(name)')
    .not('redeemed_at', 'is', null)
    .order('redeemed_at', { ascending: false })
    .limit(limit);
  if (term) rewQuery = rewQuery.or(pattern, { referencedTable: 'customer' });

  const [reqs, rews] = await Promise.all([
    wantRequests ? reqQuery : Promise.resolve({ data: [], error: null }),
    wantRewards ? rewQuery : Promise.resolve({ data: [], error: null }),
  ]);
  const failed = Boolean(reqs.error || rews.error);

  const entries: Entry[] = [
    ...(reqs.data ?? []).map((r): Entry => {
      const c = one(r.customer as Joined<Who>);
      return {
        key: `r-${r.id}`, kind: r.status as Kind, at: r.decided_at ?? r.created_at, since: r.created_at,
        name: c?.name ?? '', email: c?.email ?? '', quantity: r.quantity,
        by: one(r.decider as Joined<{ name: string }>)?.name ?? null,
      };
    }),
    ...(rews.data ?? []).map((r): Entry => {
      const c = one(r.customer as Joined<Who>);
      return {
        key: `w-${r.id}`, kind: 'redeemed', at: r.redeemed_at as string, since: r.issued_at,
        name: c?.name ?? '', email: c?.email ?? '', quantity: 1,
        by: one(r.redeemer as Joined<{ name: string }>)?.name ?? null,
      };
    }),
  ].sort((a, b) => b.at.localeCompare(a.at));

  const shown = entries.slice(0, limit);
  const hasMore = entries.length > limit;

  const href = (over: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { q: q || undefined, type: type === 'all' ? undefined : type, ...over };
    Object.entries(merged).forEach(([k, v]) => v && p.set(k, v));
    const s = p.toString();
    return s ? `/admin/history?${s}` : '/admin/history';
  };

  const groups: { day: string; label: string; items: Entry[] }[] = [];
  for (const e of shown) {
    const day = dayOf(e.at);
    const last = groups[groups.length - 1];
    if (last?.day === day) last.items.push(e);
    else groups.push({ day, label: formatDay(e.at), items: [e] });
  }

  return (
    <main className="page page--admin">
      <header className="row row--between">
        <h1 style={{ fontSize: 32 }}>History</h1>
        <a className="link" href="/admin">Staff console</a>
      </header>

      <form method="get" action="/admin/history" role="search" className="history-search">
        <div className="field">
          <label htmlFor="q">Search by name or email</label>
          <input id="q" name="q" type="search" defaultValue={q} placeholder="e.g. Sam or sam@example.com"
            autoComplete="off" enterKeyHint="search" />
        </div>
        {type !== 'all' && <input type="hidden" name="type" value={type} />}
        <button type="submit" className="btn btn--primary btn--block">Search</button>
      </form>

      <nav className="chips" aria-label="Filter by type">
        {TYPES.map((t) => (
          <a key={t.value} className="chip" href={href({ type: t.value === 'all' ? undefined : t.value, limit: undefined })}
            aria-current={t.value === type ? 'true' : undefined}>
            {t.label}
          </a>
        ))}
      </nav>

      {failed && <div role="alert" className="alert"><span>History couldn&apos;t be loaded. Check your connection and try again.</span></div>}

      {shown.length === 0 && !failed ? (
        <p className="empty">{term || type !== 'all' ? 'No matches.' : 'Nothing decided yet.'}</p>
      ) : (
        groups.map((g) => (
          <section key={g.day} className="admin-section" aria-label={g.label}>
            <h2>{g.label}</h2>
            <ul className="queue">
              {g.items.map((e) => {
                const Icon = e.kind === 'approved' ? Check : e.kind === 'rejected' ? Cross : Cup;
                return (
                  <li key={e.key} className="queue-row history-row">
                    <div className="row row--between">
                      <div>
                        <div className="queue-row__name">{e.name || e.email}</div>
                        {e.name && <div className="queue-row__time">{e.email}</div>}
                      </div>
                      <span className={`badge badge--${e.kind === 'redeemed' ? 'approved' : e.kind}`}>
                        <Icon />{LABEL[e.kind]}
                      </span>
                    </div>
                    <div className="queue-row__time">
                      {e.kind === 'redeemed' ? 'Redeemed' : e.kind === 'approved' ? `Approved ${e.quantity} ${e.quantity === 1 ? 'coffee' : 'coffees'}` : 'Rejected'}
                      {' · '}{formatWhen(e.at)}
                      {' · by '}{e.by ?? '—'}
                    </div>
                    <div className="queue-row__time">
                      {e.kind === 'redeemed' ? 'Earned' : 'Requested'} {formatWhen(e.since)}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}

      {hasMore && (
        <a className="btn btn--block history-more" href={href({ limit: String(limit + PAGE) })}>Show more</a>
      )}
    </main>
  );
}
