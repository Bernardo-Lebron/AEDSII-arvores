export interface ChartSeries {
  label: string;
  color: string;
  points: { x: number; y: number }[]; // x = tamanho da entrada, y = tempo (ms)
}

interface SimpleLineChartProps {
  series: ChartSeries[];
  xLabel: string;
  yLabel: string;
}

const WIDTH = 640;
const HEIGHT = 320;
const MARGIN = { top: 20, right: 20, bottom: 56, left: 60 };

/**
 * Gráfico de linha minimalista, escrito em SVG puro (nenhuma biblioteca de
 * gráficos foi adicionada ao projeto — não era necessária para este caso de uso).
 */
export function SimpleLineChart({ series, xLabel, yLabel }: SimpleLineChartProps) {
  const allPoints = series.flatMap((s) => s.points);
  if (allPoints.length === 0) {
    return <p className="chart-empty">Execute um experimento para ver o gráfico.</p>;
  }

  const maxX = Math.max(...allPoints.map((p) => p.x));
  const maxY = Math.max(...allPoints.map((p) => p.y), 0.001);
  const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
  const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

  const scaleX = (x: number) => MARGIN.left + (x / maxX) * innerWidth;
  const scaleY = (y: number) => MARGIN.top + innerHeight - (y / maxY) * innerHeight;

  // Os tamanhos de entrada são valores discretos escolhidos pelo usuário
  // (100, 1.000, 5.000...), não uma escala contínua — por isso a marcação do
  // eixo X usa exatamente os valores que aparecem nos dados, em vez de
  // frações arbitrárias do máximo.
  const xTicks = [...new Set(allPoints.map((p) => p.x))].sort((a, b) => a - b);

  return (
    <div className="simple-chart">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="simple-chart__svg">
        {/* eixos */}
        <line x1={MARGIN.left} y1={MARGIN.top} x2={MARGIN.left} y2={MARGIN.top + innerHeight} stroke="#a9bccf" />
        <line x1={MARGIN.left} y1={MARGIN.top + innerHeight} x2={MARGIN.left + innerWidth} y2={MARGIN.top + innerHeight} stroke="#a9bccf" />

        <text x={MARGIN.left + innerWidth / 2} y={HEIGHT - 6} textAnchor="middle" fontSize={13.5} fill="#56667e">
          {xLabel}
        </text>
        <text x={14} y={MARGIN.top + innerHeight / 2} textAnchor="middle" fontSize={13.5} fill="#56667e" transform={`rotate(-90 14 ${MARGIN.top + innerHeight / 2})`}>
          {yLabel}
        </text>

        {/* linhas de grade e rótulos do eixo Y */}
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <text key={f} x={MARGIN.left - 8} y={MARGIN.top + innerHeight - f * innerHeight} textAnchor="end" fontSize={11.5} fill="#7c8ba1" dy="0.3em">
            {(maxY * f).toFixed(1)}
          </text>
        ))}

        {/* marcações e rótulos do eixo X — os tamanhos de entrada usados no experimento */}
        {xTicks.map((x) => (
          <g key={x}>
            <line x1={scaleX(x)} y1={MARGIN.top + innerHeight} x2={scaleX(x)} y2={MARGIN.top + innerHeight + 5} stroke="#a9bccf" />
            <text
              x={scaleX(x)}
              y={MARGIN.top + innerHeight + 18}
              textAnchor="middle"
              fontSize={11.5}
              fill="#7c8ba1"
              transform={xTicks.length > 4 ? `rotate(-35 ${scaleX(x)} ${MARGIN.top + innerHeight + 18})` : undefined}
            >
              {x.toLocaleString('pt-BR')}
            </text>
          </g>
        ))}

        {series.map((s) => {
          const sorted = [...s.points].sort((a, b) => a.x - b.x);
          const path = sorted.map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.x)} ${scaleY(p.y)}`).join(' ');
          return (
            <g key={s.label}>
              <path d={path} fill="none" stroke={s.color} strokeWidth={2} />
              {sorted.map((p) => (
                <circle key={`${s.label}-${p.x}`} cx={scaleX(p.x)} cy={scaleY(p.y)} r={3} fill={s.color} />
              ))}
            </g>
          );
        })}
      </svg>
      <div className="simple-chart__legend">
        {series.map((s) => (
          <span key={s.label} className="simple-chart__legend-item">
            <span className="simple-chart__legend-swatch" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
