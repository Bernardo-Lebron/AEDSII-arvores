import { useMemo, useRef, useState } from 'react';
import { Treap } from '../structures/treap/Treap';
import type { TreapSnapshot } from '../structures/treap/types';
import { useStepPlayer } from '../hooks/useStepPlayer';
import { StepPlayer } from '../components/stepper/StepPlayer';
import { TreeCanvas, type CanvasEdge, type CanvasNode } from '../visualization/components/TreeCanvas';
import { computeBinaryTreeLayout } from '../visualization/layout/binaryTreeLayout';
import { stepTypeToVisualState } from '../visualization/types/visualState';
import { Card, FeedbackMessage } from '../components/common/Card';
import { ComplexityBadges } from '../components/common/ComplexityBadges';

const DEMO_ENTRIES: [number, number][] = [
  [50, 10],
  [30, 90],
  [70, 95],
  [20, 50],
  [40, 60],
  [60, 30],
];

function snapshotToCanvas(snapshot: TreapSnapshot, highlights: string[], activeState: ReturnType<typeof stepTypeToVisualState>) {
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
      label: String(n.key),
      sublabel: `p:${n.priority}`,
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

export function TreapPage() {
  const treeRef = useRef(new Treap());
  const [baseSnapshot, setBaseSnapshot] = useState<TreapSnapshot>(treeRef.current.getSnapshot());
  const [keyInput, setKeyInput] = useState('');
  const [priorityInput, setPriorityInput] = useState('');
  const [autoPriority, setAutoPriority] = useState(true);
  const [feedback, setFeedback] = useState<{ message: string; tone: 'error' | 'info' | 'success' } | null>(null);
  const player = useStepPlayer<TreapSnapshot>();

  function parsedKey(): number | null {
    const value = Number(keyInput.trim());
    return keyInput.trim() !== '' && !Number.isNaN(value) ? value : null;
  }

  function runInsert() {
    const key = parsedKey();
    if (key === null) return setFeedback({ message: 'Digite uma chave numérica válida.', tone: 'error' });
    let priority: number | undefined;
    if (!autoPriority) {
      const p = Number(priorityInput.trim());
      if (priorityInput.trim() === '' || Number.isNaN(p)) {
        return setFeedback({ message: 'Digite uma prioridade válida ou marque "automática".', tone: 'error' });
      }
      priority = p;
    }
    const result = treeRef.current.insert(key, priority);
    player.setSteps(result.steps);
    setBaseSnapshot(treeRef.current.getSnapshot());
    setFeedback(null);
    setKeyInput('');
    setPriorityInput('');
  }

  function runSearch() {
    const key = parsedKey();
    if (key === null) return setFeedback({ message: 'Digite uma chave numérica válida.', tone: 'error' });
    const result = treeRef.current.search(key);
    player.setSteps(result.steps);
    setFeedback({ message: result.value ? `${key} encontrado.` : `${key} não encontrado.`, tone: result.value ? 'success' : 'info' });
  }

  function runRemove() {
    const key = parsedKey();
    if (key === null) return setFeedback({ message: 'Digite uma chave numérica válida.', tone: 'error' });
    const result = treeRef.current.remove(key);
    player.setSteps(result.steps);
    setBaseSnapshot(treeRef.current.getSnapshot());
    setFeedback({ message: result.value ? `${key} removido.` : `${key} não existia.`, tone: result.value ? 'success' : 'error' });
  }

  function loadDemo() {
    treeRef.current.clear();
    const allSteps = DEMO_ENTRIES.flatMap(([k, p]) => treeRef.current.insert(k, p).steps);
    player.setSteps(allSteps);
    setBaseSnapshot(treeRef.current.getSnapshot());
    setFeedback({ message: 'Exemplo carregado com prioridades controladas para provocar rotações.', tone: 'info' });
  }

  function clearAll() {
    treeRef.current.clear();
    player.setSteps([]);
    setBaseSnapshot(treeRef.current.getSnapshot());
    setFeedback(null);
  }

  const displaySnapshot = player.currentStep?.snapshot ?? baseSnapshot;
  const highlightIds = player.currentStep?.highlights ?? [];
  const activeState = player.currentStep ? stepTypeToVisualState(player.currentStep.type) : 'default';
  const { nodes, edges } = useMemo(() => snapshotToCanvas(displaySnapshot, highlightIds, activeState), [displaySnapshot, highlightIds, activeState]);

  return (
    <div className="structure-page structure-page--treap">
      <header>
        <h1>Treap</h1>
        <p>Combina a propriedade de BST (chave) com a propriedade de heap máximo (prioridade). Violações de heap disparam rotações.</p>
        <ComplexityBadges
          items={[
            { label: 'Busca/Inserção/Remoção', value: 'O(log n) esperado' },
            { label: 'Pior caso', value: 'O(n)' },
            { label: 'Espaço', value: 'O(n)' },
          ]}
        />
      </header>

      <div className="structure-page__body">
        <Card className="structure-page__canvas">
          <TreeCanvas nodes={nodes} edges={edges} />
        </Card>

        <Card className="structure-page__controls">
          <h3>Operação</h3>
          <label>
            Chave (número)
            <input
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runInsert()}
              placeholder="ex: 30"
            />
          </label>
          <label className="checkbox-label">
            <input type="checkbox" checked={autoPriority} onChange={(e) => setAutoPriority(e.target.checked)} />
            Gerar prioridade automaticamente
          </label>
          {!autoPriority && (
            <label>
              Prioridade
              <input
                value={priorityInput}
                onChange={(e) => setPriorityInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runInsert()}
                placeholder="ex: 87"
              />
            </label>
          )}
          <div className="button-row">
            <button onClick={runInsert}>Inserir</button>
            <button onClick={runSearch}>Buscar</button>
            <button onClick={runRemove} className="button--danger">Remover</button>
          </div>

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
