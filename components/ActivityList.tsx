import { formatWhen } from '@/lib/format';
import { Check, Clock, Cross } from './Icons';

export type ActivityItem = { id: string; createdAt: string; status: 'pending' | 'approved' | 'rejected' };

const BADGES = {
  pending: { Icon: Clock, label: 'Pending' },
  approved: { Icon: Check, label: 'Approved' },
  rejected: { Icon: Cross, label: 'Rejected' },
} as const;

export default function ActivityList({ items }: { items: ActivityItem[] }) {
  return (
    <section aria-label="Recent activity" className="activity">
      <h2>Recent activity</h2>
      {items.length === 0 ? (
        <p className="empty">No purchases yet. Buy a coffee, then tap the button above.</p>
      ) : (
        <ul className="activity">
          {items.map(({ id, createdAt, status }) => {
            const { Icon, label } = BADGES[status];
            return (
              <li key={id} className="activity-row">
                <span>{formatWhen(createdAt)}</span>
                <span className={`badge badge--${status}`}><Icon />{label}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
