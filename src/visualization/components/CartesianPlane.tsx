import { useMemo } from 'react';
import type { KDSnapshot } from '../../structures/kdtree/types';
import { computeKDPartitions } from '../layout/kdPartitions';
import { VISUAL_STATE_COLORS, type NodeVisualState } from '../types/visualState';

interface CartesianPlaneProps {
  snapshot: KDSnapshot;
  highlightIds: string[];
  activeState: NodeVisualState;
}

const PLANE_SIZE = 100;
const MARGIN = 10;

export function CartesianPlane({ snapshot, highlightIds, activeState }: CartesianPlaneProps) {
  const bbox = { xMin: -MARGIN, xMax: PLANE_SIZE + MARGIN, yMin: -MARGIN, yMax: PLANE_SIZE + MARGIN };
  const segments = useMemo(() => computeKDPartitions(snapshot, bbox), [snapshot]);
  const nodes = Object.values(snapshot.nodes);

  if (nodes.length === 0) {
    return (
      <div className="cartesian-plane cartesian-plane--empty">
        <p>Nenhum ponto inserido ainda.</p>
      </div>
    );
  }

  // Convertemos y para o padrão cartesiano (origem embaixo) invertendo no SVG.
  const toSvgY = (y: number) => PLANE_SIZE - y;

  return (
    <div className="cartesian-plane">
      <svg viewBox={`${bbox.xMin} ${bbox.yMin} ${bbox.xMax - bbox.xMin} ${bbox.yMax - bbox.yMin}`} className="cartesian-plane__svg">
        {/* eixos */}
        <line x1={0} y1={toSvgY(bbox.yMin)} x2={0} y2={toSvgY(bbox.yMax)} stroke="#a9bccf" strokeWidth={1} />
        <line x1={bbox.xMin} y1={toSvgY(0)} x2={bbox.xMax} y2={toSvgY(0)} stroke="#a9bccf" strokeWidth={1} />

        {segments.map((seg) => {
          const isActive = highlightIds.includes(seg.nodeId);
          return (
            <line
              key={seg.nodeId}
              x1={seg.x1}
              y1={toSvgY(seg.y1)}
              x2={seg.x2}
              y2={toSvgY(seg.y2)}
              stroke={isActive ? VISUAL_STATE_COLORS[activeState].stroke : '#a9bccf'}
              strokeWidth={isActive ? 2.5 : 1.2}
              strokeDasharray={isActive ? undefined : '4 3'}
            />
          );
        })}

        {nodes.map((node) => {
          const isActive = highlightIds.includes(node.id);
          const colors = VISUAL_STATE_COLORS[isActive ? activeState : 'default'];
          return (
            <g key={node.id} transform={`translate(${node.point.x} ${toSvgY(node.point.y)})`}>
              <circle r={2.6} fill={colors.stroke} />
              <text x={2} y={-2} fontSize={5} fill="#16233b">
                ({node.point.x}, {node.point.y})
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
