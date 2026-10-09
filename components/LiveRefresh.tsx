'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/** Re-runs the server component when the given tables change. Renders nothing. */
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
    return () => {
      supabase.removeChannel(channel);
    };
  }, [key, router]);

  return null;
}
