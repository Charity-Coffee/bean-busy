import Image from 'next/image';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ActivityList from '@/components/ActivityList';
import ApprovalCelebration from '@/components/ApprovalCelebration';
import LiveRefresh from '@/components/LiveRefresh';
import RequestStampButton from '@/components/RequestStampButton';
import RewardBanner from '@/components/RewardBanner';
import SignOutButton from '@/components/SignOutButton';
import StampCard from '@/components/StampCard';

const THRESHOLD = 10;

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [profile, requests, approved, rewards] = await Promise.all([
    supabase.from('profiles').select('name, is_staff').eq('id', user.id).maybeSingle(),
    supabase.from('stamp_requests').select('id, status, created_at, decided_at, quantity').eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(10),
    supabase.from('stamp_requests').select('quantity')
      .eq('user_id', user.id).eq('status', 'approved'),
    supabase.from('rewards').select('id', { count: 'exact', head: true })
      .eq('user_id', user.id).is('redeemed_at', null),
  ]);

  const name = profile.data?.name || 'there';
  const isStaff = Boolean(profile.data?.is_staff);
  const stamps = (approved.data ?? []).reduce((sum, r) => sum + r.quantity, 0) % THRESHOLD;
  const rewardsAvailable = rewards.count ?? 0;
  const items = (requests.data ?? []).map((r) => ({
    id: r.id,
    createdAt: r.created_at,
    quantity: r.quantity,
    status: r.status as 'pending' | 'approved' | 'rejected',
  }));
  const newest = (requests.data ?? []).find((r) => r.status === 'approved');
  const latestApproved = newest ? { id: newest.id, quantity: newest.quantity, decidedAt: newest.decided_at } : null;
  const hasPending = items.some((i) => i.status === 'pending');

  return (
    <main className="page">
      <LiveRefresh tables={['stamp_requests', 'rewards']} />
      <ApprovalCelebration latestApproved={latestApproved} />
      <header className="stack" style={{ gap: 6 }}>
        <div className="brand">
          <Image src="/logo-mark.png" alt="" width={320} height={284} />
          Charity Coffee
        </div>
        <h1>Hi {name}</h1>
      </header>
      {rewardsAvailable > 0 && <RewardBanner count={rewardsAvailable} />}
      <StampCard stamps={stamps} threshold={THRESHOLD} rewardsAvailable={rewardsAvailable} />
      <RequestStampButton hasPending={hasPending} />
      <ActivityList items={items} />
      <footer className="page-footer">
        {isStaff ? <a className="link" href="/admin">Staff console</a> : <span />}
        <SignOutButton className="link link--quiet" />
      </footer>
    </main>
  );
}
