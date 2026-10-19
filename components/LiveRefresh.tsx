'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const POLL_MS = 30_000;

/**
 * Re-runs the server component when the given tables change. Renders nothing.
 * Realtime can silently drop on a backgrounded phone, so also refresh when the
 * page regains focus and poll while it is visible.
 */
export default function LiveRefresh({ tables }: { tables: string[] }) {
  const router = useRouter();
  const key = tables.join(',');

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`live-${key}`);
    key.split(',').forEach((table) => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => router.refresh());
    });
    channel.subscribe();

    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') router.refresh();
    };
    const poll = setInterval(refreshIfVisible, POLL_MS);
    document.addEventListener('visibilitychange', refreshIfVisible);
    window.addEventListener('focus', refreshIfVisible);
    window.addEventListener('online', refreshIfVisible);

    return () => {
      clearInterval(poll);
      document.removeEventListener('visibilitychange', refreshIfVisible);
      window.removeEventListener('focus', refreshIfVisible);
      window.removeEventListener('online', refreshIfVisible);
      supabase.removeChannel(channel);
    };
  }, [key, router]);

  return null;
}
