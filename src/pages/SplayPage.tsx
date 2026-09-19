import { useMemo, useRef, useState } from 'react';
import { SplayTree } from '../structures/splay/SplayTree';
import type { SplaySnapshot } from '../structures/splay/types';
import { useStepPlayer } from '../hooks/useStepPlayer';
import { StepPlayer } from '../components/stepper/StepPlayer';
import { TreeCanvas, type CanvasEdge, type CanvasNode } from '../visualization/components/TreeCanvas';
import { computeBinaryTreeLayout } from '../visualization/layout/binaryTreeLayout';
import { stepTypeToVisualState } from '../visualization/types/visualState';
import { Card, FeedbackMessage } from '../components/common/Card';
import { ComplexityBadges } from '../components/common/ComplexityBadges';

const DEMO_KEYS = [50, 30, 70, 20, 40, 60, 80];

function snapshotToCanvas(snapshot: SplaySnapshot, highlights: string[], activeState: ReturnType<typeof stepTypeToVisualState>) {
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

export function SplayPage() {
  const treeRef = useRef(new SplayTree());
  const [baseSnapshot, setBaseSnapshot] = useState<SplaySnapshot>(treeRef.current.getSnapshot());
  const [keyInput, setKeyInput] = useState('');
  const [feedback, setFeedback] = useState<{ message: string; tone: 'error' | 'info' | 'success' } | null>(null);
  const player = useStepPlayer<SplaySnapshot>();

  function parsedKey(): number | null {
    const value = Number(keyInput.trim());
    return keyInput.trim() !== '' && !Number.isNaN(value) ? value : null;
  }

  function runInsert() {
    const key = parsedKey();
    if (key === null) return setFeedback({ message: 'Digite um número válido antes de inserir.', tone: 'error' });
    const result = treeRef.current.insert(key);
    player.setSteps(result.steps);
    setBaseSnapshot(treeRef.current.getSnapshot());
    setFeedback(null);
    setKeyInput('');
  }

  function runSearch() {
    const key = parsedKey();
    if (key === null) return setFeedback({ message: 'Digite um número válido antes de buscar.', tone: 'error' });
    const result = treeRef.current.search(key);
    player.setSteps(result.steps);
    setBaseSnapshot(treeRef.current.getSnapshot());
    setFeedback({ message: result.value ? `${key} encontrado e trazido à raiz.` : `${key} não encontrado.`, tone: result.value ? 'success' : 'info' });
  }

  function runRemove() {
    const key = parsedKey();
    if (key === null) return setFeedback({ message: 'Digite um número válido antes de remover.', tone: 'error' });
    const result = treeRef.current.remove(key);
    player.setSteps(result.steps);
    setBaseSnapshot(treeRef.current.getSnapshot());
    setFeedback({ message: result.value ? `${key} removido.` : `${key} não existia.`, tone: result.value ? 'success' : 'error' });
  }

  function loadDemo() {
    treeRef.current.clear();
    const allSteps = DEMO_KEYS.flatMap((k) => treeRef.current.insert(k).steps);
    player.setSteps(allSteps);
    setBaseSnapshot(treeRef.current.getSnapshot());
    setFeedback({ message: `Exemplo carregado: ${DEMO_KEYS.join(', ')}.`, tone: 'info' });
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
    <div className="structure-page structure-page--splay">
      <header>
        <h1>Splay Tree</h1>
        <p>BST auto-ajustável: cada acesso reorganiza a árvore via rotações Zig, Zig-Zig ou Zig-Zag, trazendo o nó acessado à raiz.</p>
        <ComplexityBadges
          items={[
            { label: 'Busca/Inserção/Remoção', value: 'O(log n) amortizado' },
            { label: 'Pior caso (1 acesso)', value: 'O(n)' },
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
          <div className="button-row">
            <button onClick={runInsert}>Inserir</button>
            <button onClick={runSearch}>Buscar (Splay)</button>
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
