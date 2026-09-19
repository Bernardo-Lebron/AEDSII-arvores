import type { Point2D } from './types';

let counter = 0;
function nextId(): string {
  counter += 1;
  return `kd-node-${counter}`;
}

export class KDNode {
  readonly id: string;
  point: Point2D;
  axis: 0 | 1;
  left: KDNode | null = null;
  right: KDNode | null = null;

  constructor(point: Point2D, axis: 0 | 1) {
    this.id = nextId();
    this.point = point;
    this.axis = axis;
  }

  axisValue(): number {
    return this.axis === 0 ? this.point.x : this.point.y;
  }
}

export function pointAxisValue(point: Point2D, axis: 0 | 1): number {
  return axis === 0 ? point.x : point.y;
}

export function distance(a: Point2D, b: Point2D): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}
