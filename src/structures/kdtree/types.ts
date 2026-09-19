import type { OperationResult } from '../../core/steps';

export interface Point2D {
  x: number;
  y: number;
}

export interface KDSnapshotNode {
  id: string;
  point: Point2D;
  /** 0 = divide pelo eixo X, 1 = divide pelo eixo Y (alterna por nível) */
  axis: 0 | 1;
  leftId: string | null;
  rightId: string | null;
}

export interface KDSnapshot {
  nodes: Record<string, KDSnapshotNode>;
  rootId: string | null;
}

export interface NearestNeighborResult {
  point: Point2D | null;
  distance: number | null;
}

export interface RangeRect {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export type KDOperationResult<T = void> = OperationResult<KDSnapshot, T>;
