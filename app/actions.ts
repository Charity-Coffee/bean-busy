'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

type ActionResult = { error?: string };

const COOLDOWN_MINUTES = 5;
const GENERIC_ERROR = "That didn't go through. Check your connection and try again.";

export async function requestStamp(quantity = 1): Promise<ActionResult> {
  const qty = Math.min(Math.max(Math.floor(quantity) || 1, 1), 5);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: last } = await supabase
    .from('stamp_requests')
    .select('created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (last && Date.now() - new Date(last.created_at).getTime() < COOLDOWN_MINUTES * 60_000) {
    return { error: 'Please wait a few minutes before requesting another stamp.' };
  }

  const { error } = await supabase.from('stamp_requests').insert({ user_id: user.id, quantity: qty });
  if (error) {
    // 23505 = unique violation: a request is already waiting.
    return { error: error.code === '23505' ? 'Your last request is still waiting for staff.' : GENERIC_ERROR };
  }
  revalidatePath('/');
  return {};
}

async function decide(id: string, status: 'approved' | 'rejected', quantity?: number): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('stamp_requests')
    .update({
      status,
      decided_at: new Date().toISOString(),
      ...(quantity !== undefined && { quantity: Math.min(Math.max(Math.floor(quantity) || 1, 1), 5) }),
    })
    .eq('id', id)
    .eq('status', 'pending');
  if (error) return { error: GENERIC_ERROR };
  revalidatePath('/admin');
  return {};
}

export async function approveRequest(id: string, quantity?: number): Promise<ActionResult> {
  return decide(id, 'approved', quantity);
}

export async function rejectRequest(id: string): Promise<ActionResult> {
  return decide(id, 'rejected');
}

export async function markRedeemed(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('rewards')
    .update({ redeemed_at: new Date().toISOString() })
    .eq('id', id)
    .is('redeemed_at', null);
  if (error) return { error: GENERIC_ERROR };
  revalidatePath('/admin');
  return {};
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
