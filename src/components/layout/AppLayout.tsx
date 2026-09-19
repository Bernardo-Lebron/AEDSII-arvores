import type { ReactNode } from 'react';
import { Sidebar } from '../navigation/Sidebar';

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-layout__content">{children}</main>
    </div>
  );
}
