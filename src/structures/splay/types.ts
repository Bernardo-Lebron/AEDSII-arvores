import type { OperationResult } from '../../core/steps';

export interface SplaySnapshotNode {
  id: string;
  key: number;
  leftId: string | null;
  rightId: string | null;
}

export interface SplaySnapshot {
  nodes: Record<string, SplaySnapshotNode>;
  rootId: string | null;
}

export type SplayOperationResult<T = void> = OperationResult<SplaySnapshot, T>;
