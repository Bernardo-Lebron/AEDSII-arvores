import type { KDSnapshot } from '../../structures/kdtree/types';

export interface PartitionSegment {
  nodeId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface BBox {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

/**
 * Percorre a KD-Tree e calcula, para cada nó, o segmento de reta que ele
 * introduz no plano cartesiano — recortado pela região herdada dos ancestrais.
 */
export function computeKDPartitions(snapshot: KDSnapshot, bbox: BBox): PartitionSegment[] {
  const segments: PartitionSegment[] = [];
  if (!snapshot.rootId) return segments;

  const visit = (nodeId: string, region: BBox): void => {
    const node = snapshot.nodes[nodeId];
    if (node.axis === 0) {
      segments.push({ nodeId, x1: node.point.x, y1: region.yMin, x2: node.point.x, y2: region.yMax });
      if (node.leftId) visit(node.leftId, { ...region, xMax: node.point.x });
      if (node.rightId) visit(node.rightId, { ...region, xMin: node.point.x });
    } else {
      segments.push({ nodeId, x1: region.xMin, y1: node.point.y, x2: region.xMax, y2: node.point.y });
      if (node.leftId) visit(node.leftId, { ...region, yMax: node.point.y });
      if (node.rightId) visit(node.rightId, { ...region, yMin: node.point.y });
    }
  };

  visit(snapshot.rootId, bbox);
  return segments;
}
