import type { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function FeedbackMessage({ message, tone }: { message: string; tone: 'error' | 'info' | 'success' }) {
  return <div className={`feedback feedback--${tone}`}>{message}</div>;
}
