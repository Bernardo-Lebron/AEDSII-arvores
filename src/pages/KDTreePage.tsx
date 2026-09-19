import { useMemo, useRef, useState } from 'react';
import { KDTree } from '../structures/kdtree/KDTree';
import type { KDSnapshot } from '../structures/kdtree/types';
import { useStepPlayer } from '../hooks/useStepPlayer';
import { StepPlayer } from '../components/stepper/StepPlayer';
import { TreeCanvas, type CanvasEdge, type CanvasNode } from '../visualization/components/TreeCanvas';
import { CartesianPlane } from '../visualization/components/CartesianPlane';
import { computeBinaryTreeLayout } from '../visualization/layout/binaryTreeLayout';
import { stepTypeToVisualState } from '../visualization/types/visualState';
import { Card, FeedbackMessage } from '../components/common/Card';
import { ComplexityBadges } from '../components/common/ComplexityBadges';

const DEMO_POINTS: [number, number][] = [
  [30, 40],
  [5, 25],
  [10, 12],
  [70, 70],
  [50, 30],
  [35, 45],
];

function snapshotToCanvas(snapshot: KDSnapshot, highlights: string[], activeState: ReturnType<typeof stepTypeToVisualState>) {
  const layout = computeBinaryTreeLayout({
    rootId: snapshot.rootId,
    getLeft: (id) => snapshot.nodes[id].leftId,
    getRight: (id) => snapshot.nodes[id].rightId,
  });

  const nodes: CanvasNode[] = Object.values(snapshot.nodes).map((n) => {
    const pos = layout.get(n.id)!;
    return {
      id: n.id,
      x: pos.x,
      y: pos.y,
      label: `(${n.point.x},${n.point.y})`,
      sublabel: n.axis === 0 ? 'eixo X' : 'eixo Y',
      state: highlights.includes(n.id) ? activeState : 'default',
    };
  });

  const edges: CanvasEdge[] = Object.values(snapshot.nodes).flatMap((n) => {
    const list: CanvasEdge[] = [];
    if (n.leftId) list.push({ id: `${n.id}-${n.leftId}`, fromId: n.id, toId: n.leftId });
    if (n.rightId) list.push({ id: `${n.id}-${n.rightId}`, fromId: n.id, toId: n.rightId });
    return list;
  });

  return { nodes, edges };
}

export function KDTreePage() {
  const treeRef = useRef(new KDTree());
  const [baseSnapshot, setBaseSnapshot] = useState<KDSnapshot>(treeRef.current.getSnapshot());
  const [xInput, setXInput] = useState('');
  const [yInput, setYInput] = useState('');
  const [regionInput, setRegionInput] = useState({ xMin: '0', xMax: '50', yMin: '0', yMax: '50' });
  const [regionResults, setRegionResults] = useState<{ x: number; y: number }[] | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; tone: 'error' | 'info' | 'success' } | null>(null);
  const player = useStepPlayer<KDSnapshot>();

  function parsedPoint(): { x: number; y: number } | null {
    const x = Number(xInput.trim());
    const y = Number(yInput.trim());
    if (xInput.trim() === '' || yInput.trim() === '' || Number.isNaN(x) || Number.isNaN(y)) return null;
    return { x, y };
  }

  function runInsert() {
    const point = parsedPoint();
    if (!point) return setFeedback({ message: 'Digite valores numéricos válidos para X e Y.', tone: 'error' });
    const result = treeRef.current.insert(point);
    player.setSteps(result.steps);
    setBaseSnapshot(treeRef.current.getSnapshot());
    setFeedback(null);
    setXInput('');
    setYInput('');
  }

  function runSearch() {
    const point = parsedPoint();
    if (!point) return setFeedback({ message: 'Digite valores numéricos válidos para X e Y.', tone: 'error' });
    const result = treeRef.current.search(point);
    player.setSteps(result.steps);
    setFeedback({ message: result.value ? `Ponto (${point.x}, ${point.y}) encontrado.` : `Ponto (${point.x}, ${point.y}) não encontrado.`, tone: result.value ? 'success' : 'info' });
  }

  function runRemove() {
    const point = parsedPoint();
    if (!point) return setFeedback({ message: 'Digite valores numéricos válidos para X e Y.', tone: 'error' });
    const result = treeRef.current.remove(point);
    player.setSteps(result.steps);
    setBaseSnapshot(treeRef.current.getSnapshot());
    setFeedback({
      message: result.value ? `Ponto (${point.x}, ${point.y}) removido.` : `Ponto (${point.x}, ${point.y}) não encontrado — nada a remover.`,
      tone: result.value ? 'success' : 'info',
    });
  }

  function runNearest() {
    const point = parsedPoint();
    if (!point) return setFeedback({ message: 'Digite valores numéricos válidos para X e Y de referência.', tone: 'error' });
    const result = treeRef.current.nearestNeighbor(point);
    player.setSteps(result.steps);
    if (result.value.point) {
      setFeedback({ message: `Vizinho mais próximo: (${result.value.point.x}, ${result.value.point.y}), distância ${result.value.distance!.toFixed(2)}.`, tone: 'success' });
    } else {
      setFeedback({ message: 'Árvore vazia — nenhum vizinho encontrado.', tone: 'info' });
    }
  }

  function runRegion() {
    const rect = {
      xMin: Number(regionInput.xMin),
      xMax: Number(regionInput.xMax),
      yMin: Number(regionInput.yMin),
      yMax: Number(regionInput.yMax),
    };
    if (Object.values(rect).some((v) => Number.isNaN(v))) {
      return setFeedback({ message: 'Preencha os quatro limites da região com números válidos.', tone: 'error' });
    }
    const result = treeRef.current.rangeSearch(rect);
    player.setSteps(result.steps);
    setRegionResults(result.value);
  }

  function loadDemo() {
    treeRef.current.clear();
    const allSteps = DEMO_POINTS.flatMap(([x, y]) => treeRef.current.insert({ x, y }).steps);
    player.setSteps(allSteps);
    setBaseSnapshot(treeRef.current.getSnapshot());
    setFeedback({ message: 'Exemplo de pontos carregado.', tone: 'info' });
  }

  function clearAll() {
    treeRef.current.clear();
    player.setSteps([]);
    setBaseSnapshot(treeRef.current.getSnapshot());
    setRegionResults(null);
    setFeedback(null);
  }

  const displaySnapshot = player.currentStep?.snapshot ?? baseSnapshot;
  const highlightIds = player.currentStep?.highlights ?? [];
  const activeState = player.currentStep ? stepTypeToVisualState(player.currentStep.type) : 'default';
  const { nodes, edges } = useMemo(() => snapshotToCanvas(displaySnapshot, highlightIds, activeState), [displaySnapshot, highlightIds, activeState]);

  return (
    <div className="structure-page structure-page--kdtree">
      <header>
        <h1>KD-Tree</h1>
        <p>Estrutura espacial para pontos 2D: cada nível alterna o eixo de particionamento (X, Y, X, Y...).</p>
        <ComplexityBadges
          items={[
            { label: 'Busca/Inserção', value: 'O(log n) médio, O(n) pior caso' },
            { label: 'Remoção', value: 'O(√n) médio (árvore balanceada)' },
            { label: 'Vizinho mais próximo', value: 'O(log n) médio' },
          ]}
        />
      </header>

      <div className="structure-page__body structure-page__body--kd">
        <Card className="structure-page__canvas">
          <TreeCanvas nodes={nodes} edges={edges} emptyMessage="Nenhum ponto inserido — insira um ponto para começar." />
        </Card>

        <Card className="structure-page__canvas">
          <CartesianPlane snapshot={displaySnapshot} highlightIds={highlightIds} activeState={activeState} />
        </Card>

        <Card className="structure-page__controls">
          <h3>Operação</h3>
          <div className="input-row">
            <label>
              X
              <input
                value={xInput}
                onChange={(e) => setXInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runInsert()}
                placeholder="ex: 30"
              />
            </label>
            <label>
              Y
              <input
                value={yInput}
                onChange={(e) => setYInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runInsert()}
                placeholder="ex: 40"
              />
            </label>
          </div>
          <div className="button-row">
            <button onClick={runInsert}>Inserir ponto</button>
            <button onClick={runSearch}>Buscar ponto</button>
            <button onClick={runRemove} className="button--danger">
              Remover
            </button>
            <button onClick={runNearest}>Vizinho mais próximo</button>
          </div>

          <h3>Busca por região</h3>
          <div className="input-row">
            <label>
              X mín
              <input
                value={regionInput.xMin}
                onChange={(e) => setRegionInput((r) => ({ ...r, xMin: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && runRegion()}
              />
            </label>
            <label>
              X máx
              <input
                value={regionInput.xMax}
                onChange={(e) => setRegionInput((r) => ({ ...r, xMax: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && runRegion()}
              />
            </label>
          </div>
          <div className="input-row">
            <label>
              Y mín
              <input
                value={regionInput.yMin}
                onChange={(e) => setRegionInput((r) => ({ ...r, yMin: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && runRegion()}
              />
            </label>
            <label>
              Y máx
              <input
                value={regionInput.yMax}
                onChange={(e) => setRegionInput((r) => ({ ...r, yMax: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && runRegion()}
              />
            </label>
          </div>
          <div className="button-row">
            <button onClick={runRegion}>Buscar região</button>
          </div>
          {regionResults && (
            <p className="structure-page__result">
              {regionResults.length > 0
                ? `${regionResults.length} ponto(s): ${regionResults.map((p) => `(${p.x},${p.y})`).join(', ')}`
                : 'Nenhum ponto na região.'}
            </p>
          )}

          <div className="button-row">
            <button onClick={loadDemo}>Carregar exemplo</button>
            <button onClick={clearAll} className="button--secondary">
              Limpar
            </button>
          </div>

          {feedback && <FeedbackMessage message={feedback.message} tone={feedback.tone} />}
        </Card>
      </div>

      <Card className="structure-page__stepper">
        <StepPlayer
          steps={player.steps}
          currentIndex={player.currentIndex}
          currentStep={player.currentStep}
          isPlaying={player.isPlaying}
          speed={player.speed}
          onStart={player.goToStart}
          onPrevious={player.goPrevious}
          onNext={player.goNext}
          onPlay={player.play}
          onPause={player.pause}
          onRestart={player.restart}
          onSpeedChange={player.setSpeed}
        />
      </Card>
    </div>
  );
}
