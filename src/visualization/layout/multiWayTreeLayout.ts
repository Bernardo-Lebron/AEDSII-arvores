import type { LayoutPosition } from './binaryTreeLayout';

export interface MultiWayLayoutInput {
  rootId: string | null;
  getChildrenIds: (id: string) => string[];
}

const NODE_SPACING_X = 56;
const LEVEL_SPACING_Y = 84;

/**
 * Layout simples para árvores com número variável de filhos por nó (Trie, Patricia).
 * Cada folha ocupa uma "coluna" própria; nós internos ficam centralizados sobre seus filhos.
 */
export function computeMultiWayTreeLayout(input: MultiWayLayoutInput): Map<string, LayoutPosition> {
  const positions = new Map<string, LayoutPosition>();
  if (!input.rootId) return positions;

  let nextLeafX = 0;

  const visit = (id: string, depth: number): number => {
    const children = input.getChildrenIds(id);
    let x: number;
    if (children.length === 0) {
      x = nextLeafX * NODE_SPACING_X;
      nextLeafX += 1;
    } else {
      const childXs = children.map((childId) => visit(childId, depth + 1));
      x = (childXs[0] + childXs[childXs.length - 1]) / 2;
    }
    positions.set(id, { id, x, y: depth * LEVEL_SPACING_Y, depth });
    return x;
  };

  visit(input.rootId, 0);
  return positions;
}
