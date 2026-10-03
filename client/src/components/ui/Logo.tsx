import { clsx } from 'clsx';
import { useId } from 'react';
import { Link } from 'react-router';

export function LogoMark({ className }: { className?: string }) {
  // Unique per instance: a gradient defined inside a hidden copy of the logo would not render for the others.
  const id = `pf-logo-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <svg viewBox="0 0 32 32" className={clsx('size-8', className)} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#22d3ee" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="#0f1730" stroke="rgb(255 255 255 / 0.08)" />
      <path d="M8 23 L14 15 L19 19 L25 9" fill="none" stroke={`url(#${id})`} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="8" cy="23" r="2.5" fill="#22d3ee" />
      <circle cx="25" cy="9" r="2.5" fill="#8b5cf6" />
    </svg>
  );
}

export function Logo({ to = '/', className }: { to?: string; className?: string }) {
  return (
    <Link to={to} className={clsx('flex items-center gap-2.5 font-semibold tracking-tight text-white', className)}>
      <LogoMark />
      <span className="text-[17px]">
        Path<span className="text-gradient">Forge</span>
      </span>
    </Link>
  );
}
