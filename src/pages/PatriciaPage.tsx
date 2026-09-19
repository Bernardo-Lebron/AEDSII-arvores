import { useMemo, useRef, useState } from 'react';
import { Patricia } from '../structures/patricia/Patricia';
import type { PatriciaSnapshot } from '../structures/patricia/types';
import { useStepPlayer } from '../hooks/useStepPlayer';
import { StepPlayer } from '../components/stepper/StepPlayer';
import { TreeCanvas, type CanvasEdge, type CanvasNode } from '../visualization/components/TreeCanvas';
import { computeMultiWayTreeLayout } from '../visualization/layout/multiWayTreeLayout';
import { stepTypeToVisualState } from '../visualization/types/visualState';
import { Card, FeedbackMessage } from '../components/common/Card';
import { ComplexityBadges } from '../components/common/ComplexityBadges';

const DEMO_KEYS = ['romane', 'romanus', 'romulus', 'rubens', 'ruber', 'rubicon'];

function snapshotToCanvas(snapshot: PatriciaSnapshot, highlights: string[], activeState: ReturnType<typeof stepTypeToVisualState>) {
  const layout = computeMultiWayTreeLayout({
    rootId: snapshot.rootId,
    getChildrenIds: (id) => snapshot.nodes[id].childrenIds,
  });

  const nodes: CanvasNode[] = Object.values(snapshot.nodes).map((n) => {
    const pos = layout.get(n.id)!;
    const isHighlighted = highlights.includes(n.id);
    return {
      id: n.id,
      x: pos.x,
      y: pos.y,
      label: n.edgeLabel === '' ? '•' : n.edgeLabel,
      sublabel: n.isEndOfWord ? 'fim' : undefined,
      state: isHighlighted ? activeState : n.isEndOfWord ? 'found' : 'default',
    };
  });

  const edges: CanvasEdge[] = Object.values(snapshot.nodes).flatMap((n) =>
    n.childrenIds.map((childId) => ({ id: `${n.id}-${childId}`, fromId: n.id, toId: childId })),
  );

  return { nodes, edges };
}

export function PatriciaPage() {
  const treeRef = useRef(new Patricia());
  const [baseSnapshot, setBaseSnapshot] = useState<PatriciaSnapshot>(treeRef.current.getSnapshot());
  const [keyInput, setKeyInput] = useState('');
  const [feedback, setFeedback] = useState<{ message: string; tone: 'error' | 'info' | 'success' } | null>(null);
  const player = useStepPlayer<PatriciaSnapshot>();

  function runInsert() {
    const key = keyInput.trim();
    if (!key) return setFeedback({ message: 'Digite uma chave antes de inserir.', tone: 'error' });
    const result = treeRef.current.insert(key);
    player.setSteps(result.steps);
    setBaseSnapshot(treeRef.current.getSnapshot());
    setFeedback(null);
    setKeyInput('');
  }

  function runSearch() {
    const key = keyInput.trim();
    if (!key) return setFeedback({ message: 'Digite uma chave antes de buscar.', tone: 'error' });
    const result = treeRef.current.search(key);
    player.setSteps(result.steps);
    setFeedback({ message: result.value ? `"${key}" encontrada.` : `"${key}" não encontrada.`, tone: result.value ? 'success' : 'info' });
  }

  function runRemove() {
    const key = keyInput.trim();
    if (!key) return setFeedback({ message: 'Digite uma chave antes de remover.', tone: 'error' });
    const result = treeRef.current.remove(key);
    player.setSteps(result.steps);
    setBaseSnapshot(treeRef.current.getSnapshot());
    setFeedback({ message: result.value ? `"${key}" removida.` : `"${key}" não existia.`, tone: result.value ? 'success' : 'error' });
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
    <div className="structure-page structure-page--patricia">
      <header>
        <h1>Patricia (Radix Tree compacta)</h1>
        <p>Diferente da Trie, cada aresta armazena um trecho compactado da chave — não um único caractere.</p>
        <ComplexityBadges
          items={[
            { label: 'Busca/Inserção', value: 'O(m)' },
            { label: 'Remoção', value: 'O(m)' },
            { label: 'Espaço', value: 'O(nós), menor que a Trie' },
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
            Chave
            <input
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runInsert()}
              placeholder="ex: romane"
            />
          </label>
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
