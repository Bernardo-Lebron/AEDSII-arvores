import type { OperationResult } from '../../core/steps';

export interface TreapSnapshotNode {
  id: string;
  key: number;
  priority: number;
  leftId: string | null;
  rightId: string | null;
}

export interface TreapSnapshot {
  nodes: Record<string, TreapSnapshotNode>;
  rootId: string | null;
}

export type TreapOperationResult<T = void> = OperationResult<TreapSnapshot, T>;
