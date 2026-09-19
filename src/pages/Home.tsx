import { Link } from 'react-router-dom';
import type { CSSProperties } from 'react';
import { Card } from '../components/common/Card';

interface StructureCard {
  slug: string;
  name: string;
  description: string;
  highlight: string;
  accent: string;
}

const STRUCTURES: StructureCard[] = [
  {
    slug: 'trie',
    name: 'Trie',
    description: 'Árvore de prefixos para armazenar e buscar strings de forma eficiente.',
    highlight: 'Compartilhamento de prefixos entre palavras',
    accent: 'var(--accent-trie)',
  },
  {
    slug: 'patricia',
    name: 'Patricia',
    description: 'Radix tree compacta que armazena prefixos como arestas em vez de caracteres isolados.',
    highlight: 'Compactação e divisão de arestas',
    accent: 'var(--accent-patricia)',
  },
  {
    slug: 'splay',
    name: 'Splay',
    description: 'BST auto-ajustável que traz elementos acessados recentemente para perto da raiz.',
    highlight: 'Rotações Zig, Zig-Zig e Zig-Zag',
    accent: 'var(--accent-splay)',
  },
  {
    slug: 'treap',
    name: 'Treap',
    description: 'Combina propriedade de BST (chave) com propriedade de heap (prioridade).',
    highlight: 'Balanceamento probabilístico via prioridades',
    accent: 'var(--accent-treap)',
  },
  {
    slug: 'kdtree',
    name: 'KD-Tree',
    description: 'Estrutura espacial para pontos 2D, alternando o eixo de particionamento por nível.',
    highlight: 'Particionamento espacial sincronizado com o plano cartesiano',
    accent: 'var(--accent-kdtree)',
  },
];

export function Home() {
  return (
    <div className="home">
      <div className="home__hero">
        <h1>Árvores Avançadas</h1>
        <p className="home__subtitle">
          Cinco estruturas de dados hierárquicas, cada uma com sua própria página de operações, rastreamento passo a
          passo sobre a implementação real e experimentos de desempenho comparáveis entre si.
        </p>
      </div>

      <div className="home__legend">
        {STRUCTURES.map((s) => (
          <span key={s.slug} className="home__legend-item">
            <span className="home__legend-swatch" style={{ background: s.accent }} />
            {s.name}
          </span>
        ))}
      </div>

      <div className="home__grid">
        {STRUCTURES.map((s) => (
          <Link key={s.slug} to={`/${s.slug}`} style={{ '--card-accent': s.accent } as CSSProperties}>
            <Card className="home__card">
              <h2>{s.name}</h2>
              <p>{s.description}</p>
              <p className="home__card-highlight">{s.highlight}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
