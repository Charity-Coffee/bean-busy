'use client';

import { useState, useTransition } from 'react';
import { requestStamp } from '@/app/actions';
import { Alert, Spinner } from './Icons';

const DEFAULT_ERROR = 'Please wait a few minutes before requesting another stamp.';
const MAX_QTY = 5;

export default function RequestStampButton({ hasPending }: { hasPending: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

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
      const res = await requestStamp(qty);
      if (res.error) setError(res.error || DEFAULT_ERROR);
      else setQty(1);
    });
  };

  return (
    <div className="stack">
      {error && (
        <div role="alert" className="alert">
          <Alert /><span>{error}</span>
        </div>
      )}
      <div className="stepper" role="group" aria-label="How many coffees did you buy?">
        <span className="stepper__label" id="qty-label">How many coffees?</span>
        <div className="stepper__controls">
          <button type="button" className="stepper__btn" aria-label="One fewer coffee"
            disabled={pending || qty <= 1} onClick={() => setQty((q) => q - 1)}>−</button>
          <output className="stepper__value" aria-labelledby="qty-label">{qty}</output>
          <button type="button" className="stepper__btn" aria-label="One more coffee"
            disabled={pending || qty >= MAX_QTY} onClick={() => setQty((q) => q + 1)}>+</button>
        </div>
      </div>
      <button type="button" className="btn btn--primary btn--lg btn--block" disabled={pending} onClick={onClick}>
        {pending && <Spinner />}
        {pending ? 'Sending…' : qty > 1 ? `I bought ${qty} coffees` : 'I bought a coffee'}
      </button>
    </div>
  );
}
