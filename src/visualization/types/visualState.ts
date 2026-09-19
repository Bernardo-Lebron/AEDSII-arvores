import type { StepEventType } from '../../core/steps';

export type NodeVisualState = 'default' | 'active' | 'new' | 'removed' | 'found' | 'not-found';

/** Traduz o tipo de evento de um step para um estado visual (cor/estilo) do nó destacado. */
export function stepTypeToVisualState(type: StepEventType): NodeVisualState {
  switch (type) {
    case 'create-node':
      return 'new';
    case 'remove-node':
      return 'removed';
    case 'found':
      return 'found';
    case 'not-found':
      return 'not-found';
    case 'compare':
    case 'descend':
    case 'split-edge':
    case 'merge-edge':
    case 'rotate-left':
    case 'rotate-right':
    case 'rotate-zig':
    case 'rotate-zig-zig':
    case 'rotate-zig-zag':
    case 'heap-violation':
    case 'change-root':
    case 'axis-partition':
    case 'mark-end':
    case 'unmark-end':
    case 'start':
      return 'active';
    default:
      return 'default';
  }
}

export const VISUAL_STATE_COLORS: Record<NodeVisualState, { fill: string; stroke: string; text: string }> = {
  default: { fill: '#ffffff', stroke: '#a9bccf', text: '#16233b' },
  active: { fill: '#fdf0d9', stroke: '#96650f', text: '#5c3d09' },
  new: { fill: '#e1f3ea', stroke: '#1f7a52', text: '#154a32' },
  removed: { fill: '#fbe7e3', stroke: '#b3402f', text: '#7a2b1f' },
  found: { fill: '#dcebf5', stroke: '#1d5c8c', text: '#123f61' },
  'not-found': { fill: '#fbe7e3', stroke: '#b3402f', text: '#7a2b1f' },
};
