import type { OperationResult } from '../../core/steps';

export interface PatriciaSnapshotNode {
  id: string;
  /** rótulo compactado da aresta que liga o pai a este nó ('' apenas na raiz) */
  edgeLabel: string;
  isEndOfWord: boolean;
  childrenIds: string[]; // ordenados pelo primeiro caractere do edgeLabel
}

export interface PatriciaSnapshot {
  nodes: Record<string, PatriciaSnapshotNode>;
  rootId: string;
}

export type PatriciaOperationResult<T = void> = OperationResult<PatriciaSnapshot, T>;
