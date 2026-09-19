import { NavLink } from 'react-router-dom';
import type { CSSProperties } from 'react';

const STRUCTURE_LINKS = [
  { to: '/trie', label: 'Trie', accent: 'var(--accent-trie)' },
  { to: '/patricia', label: 'Patricia', accent: 'var(--accent-patricia)' },
  { to: '/splay', label: 'Splay', accent: 'var(--accent-splay)' },
  { to: '/treap', label: 'Treap', accent: 'var(--accent-treap)' },
  { to: '/kdtree', label: 'KD-Tree', accent: 'var(--accent-kdtree)' },
];

export function Sidebar() {
  return (
    <nav className="sidebar">
      <div className="sidebar__title">
        Árvores Avançadas
        <span>Estruturas hierárquicas — CEFET-MG</span>
      </div>
      <NavLink to="/" end className={({ isActive }) => (isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link')}>
        Início
      </NavLink>

      <div className="sidebar__section-label">Estruturas</div>
      {STRUCTURE_LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          style={{ '--link-accent': link.accent } as CSSProperties}
          className={({ isActive }) => (isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link')}
        >
          <span className="sidebar__dot" />
          {link.label}
        </NavLink>
      ))}

      <NavLink to="/experimentos" className={({ isActive }) => (isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link')}>
        Experimentos
      </NavLink>
    </nav>
  );
}
