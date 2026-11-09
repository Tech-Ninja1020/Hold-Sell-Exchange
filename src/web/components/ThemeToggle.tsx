import { useState } from 'react';

const isDark = () => document.documentElement.classList.contains('dark');

export function ThemeToggle() {
  const [dark, setDark] = useState(isDark);

  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch {
      // storage can be blocked; the toggle still works for this visit
    }
    setDark(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      className="rounded-full border border-ink-line px-3 py-1 text-xs text-on-ink-muted transition-colors hover:text-on-ink"
    >
      {dark ? 'Light mode' : 'Dark mode'}
    </button>
  );
}
