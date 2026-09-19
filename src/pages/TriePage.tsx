import { useMemo, useRef, useState } from 'react';
import { Trie } from '../structures/trie/Trie';
import type { TrieSnapshot } from '../structures/trie/types';
import { useStepPlayer } from '../hooks/useStepPlayer';
import { StepPlayer } from '../components/stepper/StepPlayer';
import { TreeCanvas, type CanvasEdge, type CanvasNode } from '../visualization/components/TreeCanvas';
import { computeMultiWayTreeLayout } from '../visualization/layout/multiWayTreeLayout';
import { stepTypeToVisualState } from '../visualization/types/visualState';
import { Card, FeedbackMessage } from '../components/common/Card';
import { ComplexityBadges } from '../components/common/ComplexityBadges';

const DEMO_WORDS = ['cat', 'car', 'card', 'care', 'dog'];

function snapshotToCanvas(snapshot: TrieSnapshot, highlights: string[], activeState: ReturnType<typeof stepTypeToVisualState>) {
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
      label: n.char === '' ? '•' : n.char,
      sublabel: n.isEndOfWord ? 'fim' : undefined,
      state: isHighlighted ? activeState : n.isEndOfWord ? 'found' : 'default',
    };
  });

  const edges: CanvasEdge[] = Object.values(snapshot.nodes).flatMap((n) =>
    n.childrenIds.map((childId) => ({ id: `${n.id}-${childId}`, fromId: n.id, toId: childId, label: snapshot.nodes[childId].char })),
  );

  return { nodes, edges };
}

export function TriePage() {
  const trieRef = useRef(new Trie());
  const [baseSnapshot, setBaseSnapshot] = useState<TrieSnapshot>(trieRef.current.getSnapshot());
  const [wordInput, setWordInput] = useState('');
  const [prefixInput, setPrefixInput] = useState('');
  const [prefixResults, setPrefixResults] = useState<string[] | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; tone: 'error' | 'info' | 'success' } | null>(null);
  const player = useStepPlayer<TrieSnapshot>();

  function runInsert() {
    const word = wordInput.trim();
    if (!word) {
      setFeedback({ message: 'Digite uma palavra antes de inserir.', tone: 'error' });
      return;
    }
    const result = trieRef.current.insert(word);
    player.setSteps(result.steps);
    setBaseSnapshot(trieRef.current.getSnapshot());
    setFeedback(null);
    setWordInput('');
  }

  function runSearch() {
    const word = wordInput.trim();
    if (!word) {
      setFeedback({ message: 'Digite uma palavra antes de buscar.', tone: 'error' });
      return;
    }
    const result = trieRef.current.search(word);
    player.setSteps(result.steps);
    setFeedback({ message: result.value ? `"${word}" encontrada.` : `"${word}" não encontrada.`, tone: result.value ? 'success' : 'info' });
  }

  function runRemove() {
    const word = wordInput.trim();
    if (!word) {
      setFeedback({ message: 'Digite uma palavra antes de remover.', tone: 'error' });
      return;
    }
    const result = trieRef.current.remove(word);
    player.setSteps(result.steps);
    setBaseSnapshot(trieRef.current.getSnapshot());
    setFeedback({ message: result.value ? `"${word}" removida.` : `"${word}" não existia.`, tone: result.value ? 'success' : 'error' });
  }

  function runPrefix() {
    const prefix = prefixInput.trim();
    if (!prefix) {
      setFeedback({ message: 'Digite um prefixo para buscar.', tone: 'error' });
      return;
    }
    const result = trieRef.current.startsWith(prefix);
    player.setSteps(result.steps);
    setPrefixResults(trieRef.current.wordsWithPrefix(prefix));
  }

  function loadDemo() {
    trieRef.current.clear();
    const allSteps = DEMO_WORDS.flatMap((w) => trieRef.current.insert(w).steps);
    player.setSteps(allSteps);
    setBaseSnapshot(trieRef.current.getSnapshot());
    setFeedback({ message: `Exemplo carregado: ${DEMO_WORDS.join(', ')}.`, tone: 'info' });
  }

  function clearAll() {
    trieRef.current.clear();
    player.setSteps([]);
    setBaseSnapshot(trieRef.current.getSnapshot());
    setPrefixResults(null);
    setFeedback(null);
  }

  const displaySnapshot = player.currentStep?.snapshot ?? baseSnapshot;
  const highlightIds = player.currentStep?.highlights ?? [];
  const activeState = player.currentStep ? stepTypeToVisualState(player.currentStep.type) : 'default';
  const { nodes, edges } = useMemo(() => snapshotToCanvas(displaySnapshot, highlightIds, activeState), [displaySnapshot, highlightIds, activeState]);

  return (
    <div className="structure-page structure-page--trie">
      <header>
        <h1>Trie</h1>
        <p>Árvore de prefixos: cada caminho da raiz até um nó marcado representa uma palavra armazenada.</p>
        <ComplexityBadges
          items={[
            { label: 'Busca/Inserção', value: 'O(m)' },
            { label: 'Remoção', value: 'O(m)' },
            { label: 'Espaço', value: 'O(alfabeto × nós)' },
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
            Palavra
            <input
              value={wordInput}
              onChange={(e) => setWordInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runInsert()}
              placeholder="ex: casa"
            />
          </label>
          <div className="button-row">
            <button onClick={runInsert}>Inserir</button>
            <button onClick={runSearch}>Buscar</button>
            <button onClick={runRemove} className="button--danger">Remover</button>
          </div>

          <label>
            Prefixo
            <input
              value={prefixInput}
              onChange={(e) => setPrefixInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runPrefix()}
              placeholder="ex: ca"
            />
          </label>
          <div className="button-row">
            <button onClick={runPrefix}>Buscar prefixo</button>
          </div>
          {prefixResults && (
            <p className="structure-page__result">
              {prefixResults.length > 0 ? `Palavras: ${prefixResults.join(', ')}` : 'Nenhuma palavra com esse prefixo.'}
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
