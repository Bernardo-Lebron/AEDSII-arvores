import { useEffect, useMemo, useRef, useState, type WheelEvent, type MouseEvent } from 'react';
import { VISUAL_STATE_COLORS, type NodeVisualState } from '../types/visualState';

export interface CanvasNode {
  id: string;
  x: number;
  y: number;
  label: string;
  sublabel?: string;
  state: NodeVisualState;
}

export interface CanvasEdge {
  id: string;
  fromId: string;
  toId: string;
  label?: string;
}

interface TreeCanvasProps {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  emptyMessage?: string;
}

const NODE_RADIUS = 24;
const PADDING = 60;

export function TreeCanvas({ nodes, edges, emptyMessage = 'Estrutura vazia — insira um elemento para começar.' }: TreeCanvasProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);

  const bounds = useMemo(() => {
    if (nodes.length === 0) return { minX: 0, minY: 0, width: 400, height: 200 };
    const xs = nodes.map((n) => n.x);
    const ys = nodes.map((n) => n.y);
    return {
      minX: Math.min(...xs) - PADDING,
      minY: Math.min(...ys) - PADDING,
      width: Math.max(...xs) - Math.min(...xs) + PADDING * 2,
      height: Math.max(...ys) - Math.min(...ys) + PADDING * 2,
    };
  }, [nodes]);

  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  function handleWheel(e: WheelEvent<SVGSVGElement>) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((z) => Math.min(2.5, Math.max(0.4, z + delta)));
  }

  function handleMouseDown(e: MouseEvent<SVGSVGElement>) {
    // Só o botão principal inicia o arraste — clique direito/do meio não "fecha a mão".
    if (e.button !== 0) return;
    dragState.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
    setIsDragging(true);
  }

  // O acompanhamento do arraste é feito na `window`, não no <svg>, propositalmente:
  // se o cursor sair da área do desenho ainda com o botão pressionado (é fácil
  // acontecer em árvores grandes, arrastando rápido), o pan não pode "travar"
  // no meio do caminho. A mão só "abre" de novo quando o botão é solto — em
  // qualquer lugar da tela — não quando o cursor cruza a borda do SVG.
  useEffect(() => {
    if (!isDragging) return;

    // Evita que um arraste rápido, que passe por fora do SVG, selecione texto
    // do resto da página enquanto o botão do mouse ainda está pressionado.
    document.body.classList.add('is-panning');

    function handleWindowMouseMove(e: globalThis.MouseEvent) {
      if (!dragState.current) return;
      const dx = e.clientX - dragState.current.startX;
      const dy = e.clientY - dragState.current.startY;
      setPan({ x: dragState.current.panX + dx, y: dragState.current.panY + dy });
    }

    function handleWindowMouseUp() {
      dragState.current = null;
      setIsDragging(false);
    }

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      document.body.classList.remove('is-panning');
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [isDragging]);

  function resetView() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  if (nodes.length === 0) {
    return (
      <div className="tree-canvas tree-canvas--empty">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="tree-canvas">
      <div className="tree-canvas__toolbar">
        <button type="button" onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))} title="Aproximar">
          +
        </button>
        <button type="button" onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))} title="Afastar">
          −
        </button>
        <button type="button" onClick={resetView} title="Centralizar">
          ⤢
        </button>
      </div>
      <svg
        viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`}
        className={isDragging ? 'tree-canvas__svg tree-canvas__svg--dragging' : 'tree-canvas__svg'}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
      >
        <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
          {edges.map((edge) => {
            const from = nodeById.get(edge.fromId);
            const to = nodeById.get(edge.toId);
            if (!from || !to) return null;
            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2;
            return (
              <g key={edge.id}>
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="#a9bccf"
                  strokeWidth={2}
                />
                {edge.label && (
                  <text x={midX} y={midY - 6} textAnchor="middle" fontSize={12.5} fill="#56667e">
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}

          {nodes.map((node) => {
            const colors = VISUAL_STATE_COLORS[node.state];
            return (
              <g key={node.id} transform={`translate(${node.x} ${node.y})`} className={`tree-node tree-node--${node.state}`}>
                <circle r={NODE_RADIUS} fill={colors.fill} stroke={colors.stroke} strokeWidth={2.5} />
                <text textAnchor="middle" dy="0.35em" fontSize={15} fontWeight={600} fill={colors.text}>
                  {node.label}
                </text>
                {node.sublabel && (
                  <text textAnchor="middle" dy={NODE_RADIUS + 14} fontSize={11.5} fill="#7c8ba1">
                    {node.sublabel}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
