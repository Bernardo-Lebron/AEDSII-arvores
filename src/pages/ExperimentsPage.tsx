import { useMemo, useRef, useState } from 'react';
import { runBenchmarkAsync, type BenchmarkProgress } from '../experiments/benchmark';
import type { BenchmarkResult, DataPattern, StructureName } from '../experiments/types';
import { Card, FeedbackMessage } from '../components/common/Card';
import { SimpleLineChart, type ChartSeries } from '../visualization/components/SimpleLineChart';

const ALL_STRUCTURES: StructureName[] = ['Trie', 'Patricia', 'Splay', 'Treap', 'KDTree'];
const STANDARD_SIZES = [100, 1000, 5000, 10000];
const LARGE_SIZE = 100000;

const STRUCTURE_COLORS: Record<StructureName, string> = {
  Trie: '#3d4e9c',
  Patricia: '#0f7c6c',
  Splay: '#8b3a62',
  Treap: '#96650f',
  KDTree: '#1d7a99',
};

export function ExperimentsPage() {
  const [selectedStructures, setSelectedStructures] = useState<StructureName[]>(['Trie', 'Splay']);
  const [selectedSizes, setSelectedSizes] = useState<number[]>([100, 1000]);
  const [includeLargeSize, setIncludeLargeSize] = useState(false);
  const [pattern, setPattern] = useState<DataPattern>('random');
  const [operationFilter, setOperationFilter] = useState<'insert' | 'search' | 'remove' | 'memory'>('insert');
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<BenchmarkProgress | null>(null);
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [skipped, setSkipped] = useState<{ structure: StructureName; size: number; reason: string }[]>([]);
  const [feedback, setFeedback] = useState<{ message: string; tone: 'error' | 'info' | 'success' } | null>(null);
  const cancelRef = useRef(false);

  function toggleStructure(structure: StructureName) {
    setSelectedStructures((prev) => (prev.includes(structure) ? prev.filter((s) => s !== structure) : [...prev, structure]));
  }

  function toggleSize(size: number) {
    setSelectedSizes((prev) => (prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]));
  }

  async function runExperiment() {
    if (selectedStructures.length === 0) {
      setFeedback({ message: 'Selecione pelo menos uma estrutura.', tone: 'error' });
      return;
    }
    const sizes = [...selectedSizes, ...(includeLargeSize ? [LARGE_SIZE] : [])];
    if (sizes.length === 0) {
      setFeedback({ message: 'Selecione pelo menos um tamanho de entrada.', tone: 'error' });
      return;
    }

    setIsRunning(true);
    setFeedback(null);
    setResults([]);
    setSkipped([]);
    cancelRef.current = false;

    const outcome = await runBenchmarkAsync(
      { structures: selectedStructures, sizes, pattern },
      (p, partialResults) => {
        setProgress(p);
        // resultados aparecem conforme cada combinação termina — o gráfico e
        // a tabela vão preenchendo em tempo real, em vez de uma espera às cegas.
        setResults([...partialResults]);
      },
      () => cancelRef.current,
    );

    setSkipped(outcome.skipped);
    setIsRunning(false);
    setProgress(null);

    if (outcome.cancelled) {
      setFeedback({ message: `Experimento cancelado. ${outcome.results.length} medição(ões) já realizada(s) foram mantidas.`, tone: 'info' });
      return;
    }
    setFeedback({
      message: `Experimento concluído: ${outcome.results.length} medições reais realizadas.${
        outcome.skipped.length > 0 ? ` ${outcome.skipped.length} combinação(ões) ignorada(s) por inviabilidade técnica.` : ''
      }`,
      tone: 'success',
    });
  }

  function cancelExperiment() {
    cancelRef.current = true;
  }

  function exportCsv() {
    const header = 'structure,operation,size,pattern,executionTimeMs,operationsCount,nodeCount\n';
    const rows = results
      .map((r) => `${r.structure},${r.operation},${r.size},${r.pattern},${r.executionTimeMs.toFixed(4)},${r.operationsCount},${r.nodeCount}`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'resultados-experimentos.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  const chartSeries: ChartSeries[] = useMemo(() => {
    // "Memória" usa a contagem de nós logo após a construção (insert) como
    // proxy de custo espacial — é aí que diferenças como o compartilhamento
    // de prefixos em Trie/Patricia ficam visíveis.
    const filtered = results.filter((r) => (operationFilter === 'memory' ? r.operation === 'insert' : r.operation === operationFilter));
    const byStructure = new Map<StructureName, ChartSeries>();
    for (const r of filtered) {
      if (!byStructure.has(r.structure)) {
        byStructure.set(r.structure, { label: r.structure, color: STRUCTURE_COLORS[r.structure], points: [] });
      }
      byStructure.get(r.structure)!.points.push({ x: r.size, y: operationFilter === 'memory' ? r.nodeCount : r.executionTimeMs });
    }
    return [...byStructure.values()];
  }, [results, operationFilter]);

  return (
    <div className="structure-page">
      <header>
        <h1>Experimentos</h1>
        <p>
          Benchmarks reais, medidos com <code>performance.now()</code> sobre as mesmas classes usadas nas páginas de
          visualização. Nenhum resultado é inventado — combinações tecnicamente inviáveis são reportadas como tal, não
          simuladas.
        </p>
      </header>

      <div className="structure-page__body">
        <Card className="structure-page__controls structure-page__controls--wide">
          <h3>Estruturas</h3>
          <div className="checkbox-grid">
            {ALL_STRUCTURES.map((s) => (
              <label key={s} className="checkbox-label">
                <input type="checkbox" checked={selectedStructures.includes(s)} onChange={() => toggleStructure(s)} />
                {s}
              </label>
            ))}
          </div>

          <h3>Tamanhos de entrada</h3>
          <div className="checkbox-grid">
            {STANDARD_SIZES.map((size) => (
              <label key={size} className="checkbox-label">
                <input type="checkbox" checked={selectedSizes.includes(size)} onChange={() => toggleSize(size)} />
                {size.toLocaleString('pt-BR')}
              </label>
            ))}
            <label className="checkbox-label">
              <input type="checkbox" checked={includeLargeSize} onChange={(e) => setIncludeLargeSize(e.target.checked)} />
              100.000 (pode levar alguns segundos)
            </label>
          </div>

          <h3>Padrão dos dados (Splay/Treap)</h3>
          <div className="button-row">
            {(['random', 'sorted', 'reverse'] as DataPattern[]).map((p) => (
              <button key={p} className={pattern === p ? 'button--active' : ''} onClick={() => setPattern(p)}>
                {p === 'random' ? 'Aleatório' : p === 'sorted' ? 'Ordenado' : 'Ordem reversa'}
              </button>
            ))}
          </div>

          <div className="button-row">
            <button onClick={runExperiment} disabled={isRunning}>
              {isRunning
                ? progress
                  ? `Executando… (${progress.done}/${progress.total})`
                  : 'Preparando…'
                : 'Executar experimento'}
            </button>
            {isRunning && (
              <button onClick={cancelExperiment} className="button--danger">
                Cancelar
              </button>
            )}
            <button onClick={exportCsv} disabled={results.length === 0} className="button--secondary">
              Exportar CSV
            </button>
          </div>

          {isRunning && progress && (
            <p className="structure-page__result">
              Rodando {progress.currentStructure} — tamanho {progress.currentSize.toLocaleString('pt-BR')} (
              {progress.done}/{progress.total} combinações concluídas). A página continua respondendo — dá pra
              cancelar a qualquer momento.
            </p>
          )}

          {feedback && <FeedbackMessage message={feedback.message} tone={feedback.tone} />}

          {skipped.length > 0 && (
            <div className="experiments-skipped">
              <h4>Combinações não executadas</h4>
              <ul>
                {skipped.map((s, i) => (
                  <li key={i}>
                    {s.structure} — tamanho {s.size.toLocaleString('pt-BR')}: {s.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>

      <Card className="structure-page__stepper">
        <h3>Gráfico de desempenho</h3>
        <div className="button-row">
          {(['insert', 'search', 'remove', 'memory'] as const).map((op) => (
            <button key={op} className={operationFilter === op ? 'button--active' : ''} onClick={() => setOperationFilter(op)}>
              {op === 'insert' ? 'Inserção' : op === 'search' ? 'Busca' : op === 'remove' ? 'Remoção' : 'Memória (nós)'}
            </button>
          ))}
        </div>
        <SimpleLineChart
          series={chartSeries}
          xLabel="Tamanho da entrada"
          yLabel={operationFilter === 'memory' ? 'Nós alocados' : 'Tempo (ms)'}
        />
      </Card>

      <Card className="structure-page__stepper">
        <h3>Resultados brutos</h3>
        {results.length === 0 ? (
          <p>Nenhum experimento executado ainda.</p>
        ) : (
          <div className="results-table-wrapper">
            <table className="results-table">
              <thead>
                <tr>
                  <th>Estrutura</th>
                  <th>Operação</th>
                  <th>Tamanho</th>
                  <th>Padrão</th>
                  <th>Tempo (ms)</th>
                  <th>Nº de operações</th>
                  <th>Nós alocados</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i}>
                    <td>{r.structure}</td>
                    <td>{r.operation}</td>
                    <td>{r.size.toLocaleString('pt-BR')}</td>
                    <td>{r.pattern}</td>
                    <td>{r.executionTimeMs.toFixed(3)}</td>
                    <td>{r.operationsCount}</td>
                    <td>{r.nodeCount.toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
