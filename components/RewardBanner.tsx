import { Cup } from './Icons';

export default function RewardBanner({ count = 1 }: { count?: number }) {
  return (
    <section className="reward-banner" aria-label="Free coffee">
      <div className="reward-banner__icon"><Cup /></div>
      <div>
        <h2>You have a free coffee{count > 1 ? ` (×${count})` : ''}</h2>
        <p>Show this screen at the counter.</p>
      </div>
    </section>
  );
}
