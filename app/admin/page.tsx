import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminConsole from '@/components/AdminConsole';
import LiveRefresh from '@/components/LiveRefresh';

type Joined = { name: string; email: string } | { name: string; email: string }[] | null;
const who = (p: Joined) => (Array.isArray(p) ? p[0] : p) ?? { name: '', email: '' };

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: me } = await supabase.from('profiles').select('is_staff').eq('id', user.id).maybeSingle();
  if (!me?.is_staff) redirect('/');

  const [pending, rewards] = await Promise.all([
    supabase.from('stamp_requests').select('id, created_at, quantity, profiles(name, email)')
      .eq('status', 'pending').order('created_at'),
    supabase.from('rewards').select('id, issued_at, profiles(name, email)')
      .is('redeemed_at', null).order('issued_at'),
  ]);

  return (
    <main className="page page--admin">
      <LiveRefresh tables={['stamp_requests', 'rewards']} />
      <AdminConsole
        pending={(pending.data ?? []).map((r) => ({ id: r.id, createdAt: r.created_at, quantity: r.quantity, ...who(r.profiles as Joined) }))}
        rewards={(rewards.data ?? []).map((r) => ({ id: r.id, issuedAt: r.issued_at, ...who(r.profiles as Joined) }))}
      />
    </main>
  );
}
