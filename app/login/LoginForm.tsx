'use client';

import { useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Alert, Mail, Spinner } from '@/components/Icons';

const EXPIRED_LINK = "That sign-in link didn't work. It may have expired, so request a new one below.";

function messageFor(error: { status?: number; code?: string }) {
  if (error.status === 429 || error.code === 'over_email_send_rate_limit') {
    return 'Too many attempts. Please wait a minute and try again.';
  }
  if (error.code === 'email_address_invalid' || error.code === 'validation_failed') {
    return "That email address doesn't look right. Check it and try again.";
  }
  return "We couldn't send your sign-in link right now. Please try again in a few minutes.";
}

export default function LoginForm({ initialError = false }: { initialError?: boolean }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'error' | 'sent'>(initialError ? 'error' : 'idle');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(initialError ? EXPIRED_LINK : '');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get('name') ?? '').trim();
    const address = String(form.get('email') ?? '').trim();
    setEmail(address);
    setStatus('sending');
    setMessage('');
    const { error } = await createClient().auth.signInWithOtp({
      email: address,
      options: { data: { name }, emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      console.error('Sign-in link failed', error);
      setMessage(messageFor(error));
    }
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
          <Alert /><span>{message}</span>
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
