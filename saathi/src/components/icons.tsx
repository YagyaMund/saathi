type IconProps = { filled?: boolean };

export function Chevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

export function BackIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export function SettingsIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

export function HomeIcon({ filled }: IconProps) {
  if (filled) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3.2 3.5 10.2a1 1 0 0 0-.3.7V20a1.5 1.5 0 0 0 1.5 1.5H9v-6.2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V21.5h4.3A1.5 1.5 0 0 0 21 20v-9.1a1 1 0 0 0-.3-.7L12 3.2z" />
      </svg>
    );
  }
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 10.2 12 3.2l8.5 7V20a1.5 1.5 0 0 1-1.5 1.5H15v-6.2a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1V21.5H5A1.5 1.5 0 0 1 3.5 20z" />
    </svg>
  );
}

export function MsgIcon({ filled }: IconProps) {
  if (filled) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3.2c-5 0-9 3.6-9 8.2 0 2.4 1.2 4.5 3.1 6l-.9 3.4a.8.8 0 0 0 1.1.9l4-1.7c.5.1 1.1.2 1.7.2 5 0 9-3.6 9-8.2S17 3.2 12 3.2z" />
      </svg>
    );
  }
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.4c0 4.3-3.8 7.8-9 7.8-.7 0-1.4-.1-2-.2l-3.6 1.5.8-3.1C5.2 15.7 4 13.7 4 11.4 4 7.1 7.8 3.6 12.5 3.6S21 7.1 21 11.4z" />
    </svg>
  );
}

export function PostsIcon({ filled }: IconProps) {
  if (filled) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <rect x="3" y="3" width="8" height="8" rx="1.5" />
        <rect x="13" y="3" width="8" height="8" rx="1.5" />
        <rect x="3" y="13" width="8" height="8" rx="1.5" />
        <rect x="13" y="13" width="8" height="8" rx="1.5" />
      </svg>
    );
  }
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.2" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.2" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.2" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.2" />
    </svg>
  );
}

export function ItemsIcon({ filled }: IconProps) {
  if (filled) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4.5 3.5h15A1.5 1.5 0 0 1 21 5v14a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19V5a1.5 1.5 0 0 1 1.5-1.5zm1 2v4h5v-4h-5zm7 0v4h5v-4h-5zm-7 6v5h5v-5h-5zm7 0v5h5v-5h-5z" />
      </svg>
    );
  }
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
      <path d="M3.5 10h17M10 3.5v17" />
    </svg>
  );
}

export function AnalyticsIcon({ filled }: IconProps) {
  if (filled) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 19V9h3.2v10H5zm5.4 0V5h3.2v14h-3.2zm5.4 0v-7H19v7h-3.2z" />
      </svg>
    );
  }
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19V5M4 19h16" />
      <path d="M8 16V10M12 16V7M16 16v-5" />
    </svg>
  );
}

export function OrdersIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 7h12l-1.2 9.2a2 2 0 0 1-2 1.8H9.4a2 2 0 0 1-2-1.7L6 4H3" />
      <circle cx="10" cy="21" r="1" />
      <circle cx="17" cy="21" r="1" />
    </svg>
  );
}

export function MicIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v4" />
    </svg>
  );
}
