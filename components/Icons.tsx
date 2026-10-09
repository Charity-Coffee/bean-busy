import type { CSSProperties, ReactNode } from 'react';

type IconProps = { className?: string; style?: CSSProperties };

function make(children: ReactNode, extraClass = '') {
  return function Icon({ className, style }: IconProps) {
    return (
      <svg
        className={['icon', extraClass, className].filter(Boolean).join(' ')}
        style={style}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        {children}
      </svg>
    );
  };
}

export const Cup = make(
  <>
    <path d="M5 9h11v5a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5V9z" />
    <path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16" />
    <path d="M8 3v3M12 3v3" />
  </>,
);
export const Check = make(<path d="M5 12.5l4.5 4.5L19 7" />);
export const Cross = make(<path d="M6 6l12 12M18 6L6 18" />);
export const Clock = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </>,
);
export const Mail = make(
  <>
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="M3.5 7l8.5 6 8.5-6" />
  </>,
);
export const Alert = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v6M12 16.5v.5" />
  </>,
);
export const Spinner = make(<path d="M12 3a9 9 0 1 0 9 9" />, 'spinner');
export const ChevronLeft = make(<path d="M15 5l-7 7 7 7" />);
