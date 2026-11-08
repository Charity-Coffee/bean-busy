'use client';

import { useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Alert, Mail, Spinner } from '@/components/Icons';

const CALLBACK_ERROR_MESSAGES: Record<string, string> = {
  link_mismatch:
    "That sign-in link didn't work — probably because it was opened in a different app or browser than the one you " +
    'requested it from (e.g. an email app’s built-in browser). Enter the 6-digit code from the email instead, or ' +
    'request a new link and open it in the same browser.',
  missing_code: "That link looks incomplete. Request a new one below.",
};
const EXPIRED_LINK = "That sign-in link didn't work. It may have expired, so request a new one below.";
const CODE_ERROR = "That code didn't work. Check it and try again, or request a new one.";

function messageForCallbackError(reason: string) {
  return CALLBACK_ERROR_MESSAGES[reason] ?? EXPIRED_LINK;
}

function messageForSendError(error: { status?: number; code?: string }) {
  if (error.status === 429 || error.code === 'over_email_send_rate_limit') {
    return 'Too many attempts. Please wait a minute and try again.';
  }
  if (error.code === 'email_address_invalid' || error.code === 'validation_failed') {
    return "That email address doesn't look right. Check it and try again.";
  }
  return "We couldn't send your sign-in link right now. Please try again in a few minutes.";
}

export default function LoginForm({ initialError }: { initialError?: string }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'error' | 'sent' | 'verifying' | 'codeError'>(
    initialError ? 'error' : 'idle',
  );
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(initialError ? messageForCallbackError(initialError) : '');

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
      setMessage(messageForSendError(error));
    }
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
