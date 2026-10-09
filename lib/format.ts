const TZ = 'Australia/Brisbane';

const dayKey = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
const timeFmt = new Intl.DateTimeFormat('en-AU', { timeZone: TZ, hour: 'numeric', minute: '2-digit', hour12: true });
const dateFmt = new Intl.DateTimeFormat('en-AU', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short' });

/** "Today, 10:42 am", "Yesterday, 8:15 am", "Tue 6 Oct, 7:58 am" */
export function formatWhen(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const time = timeFmt.format(d).replace(/\s?([ap])m/i, (_, x: string) => ` ${x.toLowerCase()}m`);
  const day = dayKey.format(d);
  if (day === dayKey.format(now)) return `Today, ${time}`;
  if (day === dayKey.format(new Date(now.getTime() - 86_400_000))) return `Yesterday, ${time}`;
  return `${dateFmt.format(d).replace(',', '')}, ${time}`;
}

/** "Just now", "3 min ago", "2 h ago", "yesterday" */
export function timeAgo(iso: string, now = Date.now()): string {
  const mins = Math.floor((now - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  if (hours < 48) return 'yesterday';
  return `${Math.floor(hours / 24)} days ago`;
}
