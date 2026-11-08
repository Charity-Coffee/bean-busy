'use client';

import { useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Alert, Mail, Spinner } from '@/components/Icons';

const ERROR_MESSAGES: Record<string, string> = {
  link_mismatch:
    "That sign-in link didn't work — probably because it was opened in a different app or browser than the one you " +
    'requested it from (e.g. an email app’s built-in browser). Enter the 6-digit code from the email instead, or ' +
    'request a new link and open it in the same browser.',
  missing_code: "That link looks incomplete. Request a new one below.",
};
const SEND_ERROR = "We couldn't send that link. Check your email address and try again.";
const CODE_ERROR = "That code didn't work. Check it and try again, or request a new one.";

export default function LoginForm({ initialError }: { initialError?: string }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'error' | 'sent' | 'verifying' | 'codeError'>(
    initialError ? 'error' : 'idle',
  );
  const [email, setEmail] = useState('');
  const [callbackError] = useState(initialError);

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

  async function onVerifyCode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const token = String(form.get('code') ?? '').trim();
    setStatus('verifying');
    const { error } = await createClient().auth.verifyOtp({ email, token, type: 'email' });
    if (error) {
      setStatus('codeError');
      return;
    }
    window.location.assign('/');
  }

  if (status === 'sent' || status === 'verifying' || status === 'codeError') {
    return (
      <div role="status" className="panel">
        <Mail style={{ width: 40, height: 40 }} />
        <h2>Check your email</h2>
        <p className="muted">
          We sent a sign-in link and a 6-digit code to <strong>{email}</strong>. Click the link, or enter the code
          below — the code works even if the link doesn&apos;t open on this device.
        </p>
        {status === 'codeError' && (
          <div role="alert" className="alert">
            <Alert /><span>{CODE_ERROR}</span>
          </div>
        )}
        <form className="form" onSubmit={onVerifyCode}>
          <div className="field">
            <label htmlFor="code">6-digit code</label>
            <input
              id="code"
              name="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              placeholder="123456"
              maxLength={6}
              required
            />
          </div>
          <button type="submit" className="btn btn--primary btn--block" disabled={status === 'verifying'}>
            {status === 'verifying' && <Spinner />}
            {status === 'verifying' ? 'Checking…' : 'Enter code'}
          </button>
        </form>
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
          <Alert /><span>{(callbackError && ERROR_MESSAGES[callbackError]) || SEND_ERROR}</span>
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
