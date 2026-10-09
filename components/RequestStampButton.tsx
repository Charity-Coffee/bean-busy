'use client';

import { useState, useTransition } from 'react';
import { requestStamp } from '@/app/actions';
import { Alert, Spinner } from './Icons';

const DEFAULT_ERROR = 'Please wait a few minutes before requesting another stamp.';

export default function RequestStampButton({ hasPending }: { hasPending: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (hasPending) {
    return (
      <button type="button" className="btn btn--lg btn--block btn--waiting" disabled aria-live="polite">
        <span className="dots" aria-hidden="true"><span /><span /><span /></span>
        Waiting for staff to approve
      </button>
    );
  }

  const onClick = () => {
    setError(null);
    startTransition(async () => {
      const res = await requestStamp();
      if (res.error) setError(res.error || DEFAULT_ERROR);
    });
  };

  return (
    <div className="stack">
      {error && (
        <div role="alert" className="alert">
          <Alert /><span>{error}</span>
        </div>
      )}
      <button type="button" className="btn btn--primary btn--lg btn--block" disabled={pending} onClick={onClick}>
        {pending && <Spinner />}
        {pending ? 'Sending…' : 'I bought a coffee'}
      </button>
    </div>
  );
}
