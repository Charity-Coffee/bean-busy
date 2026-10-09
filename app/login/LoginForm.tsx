'use client';

import { useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Alert, Mail, Spinner } from '@/components/Icons';

export default function LoginForm({ initialError = false }: { initialError?: boolean }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'error' | 'sent'>(initialError ? 'error' : 'idle');
  const [email, setEmail] = useState('');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get('name') ?? '').trim();
    const address = String(form.get('email') ?? '').trim();
    setEmail(address);
    setStatus('sending');
    const { error } = await createClient().auth.signInWithOtp({
      email: address,
      options: { data: { name }, emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setStatus(error ? 'error' : 'sent');
  }

  if (status === 'sent') {
    return (
      <div role="status" className="panel">
        <Mail style={{ width: 40, height: 40 }} />
        <h2>Check your email</h2>
        <p className="muted">
          We sent a sign-in link to <strong>{email}</strong>. Open the link on this device.
        </p>
        <button type="button" className="btn btn--outline" style={{ minHeight: 48, fontSize: 16 }} onClick={() => setStatus('idle')}>
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      {status === 'error' && (
        <div role="alert" className="alert">
          <Alert /><span>We couldn&apos;t send that link. Check your email address and try again.</span>
        </div>
      )}
      <div className="field">
        <label htmlFor="name">Your name</label>
        <input id="name" name="name" type="text" autoComplete="given-name" placeholder="Sam" required />
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" placeholder="sam@example.com" required />
      </div>
      <button type="submit" className="btn btn--primary btn--block" disabled={status === 'sending'}>
        {status === 'sending' && <Spinner />}
        {status === 'sending' ? 'Sending…' : 'Email me a sign-in link'}
      </button>
      <p className="fineprint">We only use your email to sign you in and track your stamps.</p>
    </form>
  );
}
