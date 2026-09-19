import type { OperationResult } from '../../core/steps';

/** Representação serializada de um nó da Trie, usada nos snapshots. */
export interface TrieSnapshotNode {
  id: string;
  char: string; // '' apenas para a raiz
  isEndOfWord: boolean;
  childrenIds: string[]; // ordenados alfabeticamente
}

/** Estado completo e serializado da Trie em um instante. */
export interface TrieSnapshot {
  nodes: Record<string, TrieSnapshotNode>;
  rootId: string;
}

export type TrieOperationResult<T = void> = OperationResult<TrieSnapshot, T>;
