/**
 * Layout tipo Reingold–Tilford simplificado para árvores binárias.
 * Recebe uma função genérica de acesso a filho esquerdo/direito para funcionar
 * com qualquer snapshot binário (Splay, Treap).
 */

export interface LayoutPosition {
  id: string;
  x: number;
  y: number;
  depth: number;
}

export interface BinaryLayoutInput {
  rootId: string | null;
  getLeft: (id: string) => string | null;
  getRight: (id: string) => string | null;
}

const NODE_SPACING_X = 64;
const LEVEL_SPACING_Y = 78;

export function computeBinaryTreeLayout(input: BinaryLayoutInput): Map<string, LayoutPosition> {
  const positions = new Map<string, LayoutPosition>();
  if (!input.rootId) return positions;

  let nextX = 0;

  // Percurso in-order: atribui x sequencial (garante que a árvore fica "desenhada"
  // sem sobreposição, exatamente como um percurso em ordem de uma BST).
  const visit = (id: string | null, depth: number): void => {
    if (!id) return;
    visit(input.getLeft(id), depth + 1);
    const x = nextX * NODE_SPACING_X;
    nextX += 1;
    positions.set(id, { id, x, y: depth * LEVEL_SPACING_Y, depth });
    visit(input.getRight(id), depth + 1);
  };

  visit(input.rootId, 0);
  return positions;
}

export function layoutBounds(positions: Map<string, LayoutPosition>): { width: number; height: number } {
  let maxX = 0;
  let maxY = 0;
  for (const p of positions.values()) {
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { width: maxX + NODE_SPACING_X, height: maxY + LEVEL_SPACING_Y };
}
