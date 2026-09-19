import { Trie } from '../structures/trie/Trie';
import { Patricia } from '../structures/patricia/Patricia';
import { SplayTree } from '../structures/splay/SplayTree';
import { Treap } from '../structures/treap/Treap';
import { KDTree } from '../structures/kdtree/KDTree';
import { generateNumbers, generatePoints, generateWords } from './generators';
import { measure } from './measurements';
import type { BenchmarkResult, BenchmarkRunConfig, StructureName } from './types';

const SAMPLE_CAP = 500;

function sample<T>(items: T[], count: number): T[] {
  if (items.length <= count) return items;
  const copy = [...items];
  for (let i = copy.length - 1; i > 0 && copy.length - i <= count; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(-count);
}

/**
 * Cada operação chamada aqui (insert/search/remove) é a MESMA implementação
 * usada nas páginas de visualização — nada de estrutura "de mentira" para o
 * benchmark. A única diferença é o parâmetro `recordSteps = false`: ele
 * desliga a geração da trilha de OperationStep (usada só para a animação
 * passo a passo), então o custo medido aqui é o custo algorítmico real da
 * estrutura, sem o overhead de serializar a árvore inteira a cada passo
 * interno — overhead que, se ligado, transformaria uma inserção O(log n) em
 * O(n) e travaria o navegador em entradas grandes.
 */
function isSizeFeasible(_structure: StructureName, size: number): boolean {
  // Teto de segurança apenas contra tamanhos absurdos digitados fora da UI
  // (que já limita a 100.000) — não é mais uma necessidade algorítmica.
  const CEILING = 200000;
  return size <= CEILING;
}

function benchmarkTrieOrPatricia(structureName: 'Trie' | 'Patricia', size: number): BenchmarkResult[] {
  const words = generateWords(size);
  const structure = structureName === 'Trie' ? new Trie() : new Patricia();
  const results: BenchmarkResult[] = [];

  const insertRun = measure(() => {
    for (const w of words) structure.insert(w, false);
  });
  results.push({ structure: structureName, operation: 'insert', size, pattern: 'random', executionTimeMs: insertRun.elapsedMs, operationsCount: size, nodeCount: structure.nodeCount() });

  const searchSample = sample(words, SAMPLE_CAP);
  const searchRun = measure(() => {
    for (const w of searchSample) structure.search(w, false);
  });
  results.push({ structure: structureName, operation: 'search', size, pattern: 'random', executionTimeMs: searchRun.elapsedMs, operationsCount: searchSample.length, nodeCount: structure.nodeCount() });

  const removeSample = sample(words, SAMPLE_CAP);
  const removeRun = measure(() => {
    for (const w of removeSample) structure.remove(w, false);
  });
  results.push({ structure: structureName, operation: 'remove', size, pattern: 'random', executionTimeMs: removeRun.elapsedMs, operationsCount: removeSample.length, nodeCount: structure.nodeCount() });

  return results;
}

function benchmarkSplayOrTreap(structureName: 'Splay' | 'Treap', size: number, pattern: 'random' | 'sorted' | 'reverse'): BenchmarkResult[] {
  const keys = generateNumbers(size, pattern);
  const structure = structureName === 'Splay' ? new SplayTree() : new Treap();
  const results: BenchmarkResult[] = [];

  const insertRun = measure(() => {
    if (structureName === 'Splay') {
      for (const k of keys) (structure as SplayTree).insert(k, false);
    } else {
      for (const k of keys) (structure as Treap).insert(k, undefined, false);
    }
  });
  results.push({ structure: structureName, operation: 'insert', size, pattern, executionTimeMs: insertRun.elapsedMs, operationsCount: size, nodeCount: structure.nodeCount() });

  const searchSample = sample(keys, SAMPLE_CAP);
  const searchRun = measure(() => {
    for (const k of searchSample) structure.search(k, false);
  });
  results.push({ structure: structureName, operation: 'search', size, pattern, executionTimeMs: searchRun.elapsedMs, operationsCount: searchSample.length, nodeCount: structure.nodeCount() });

  const removeSample = sample(keys, SAMPLE_CAP);
  const removeRun = measure(() => {
    for (const k of removeSample) structure.remove(k, false);
  });
  results.push({ structure: structureName, operation: 'remove', size, pattern, executionTimeMs: removeRun.elapsedMs, operationsCount: removeSample.length, nodeCount: structure.nodeCount() });

  return results;
}

function benchmarkKDTree(size: number): BenchmarkResult[] {
  const points = generatePoints(size);
  const tree = new KDTree();
  const results: BenchmarkResult[] = [];

  const insertRun = measure(() => {
    for (const p of points) tree.insert(p, false);
  });
  results.push({ structure: 'KDTree', operation: 'insert', size, pattern: 'random', executionTimeMs: insertRun.elapsedMs, operationsCount: size, nodeCount: tree.nodeCount() });

  const searchSample = sample(points, SAMPLE_CAP);
  const searchRun = measure(() => {
    for (const p of searchSample) tree.search(p, false);
  });
  results.push({ structure: 'KDTree', operation: 'search', size, pattern: 'random', executionTimeMs: searchRun.elapsedMs, operationsCount: searchSample.length, nodeCount: tree.nodeCount() });

  const removeSample = sample(points, SAMPLE_CAP);
  const removeRun = measure(() => {
    for (const p of removeSample) tree.remove(p, false);
  });
  results.push({ structure: 'KDTree', operation: 'remove', size, pattern: 'random', executionTimeMs: removeRun.elapsedMs, operationsCount: removeSample.length, nodeCount: tree.nodeCount() });

  return results;
}

export interface BenchmarkOutcome {
  results: BenchmarkResult[];
  skipped: { structure: StructureName; size: number; reason: string }[];
}

export function runBenchmark(config: BenchmarkRunConfig): BenchmarkOutcome {
  const results: BenchmarkResult[] = [];
  const skipped: { structure: StructureName; size: number; reason: string }[] = [];

  for (const structure of config.structures) {
    for (const size of config.sizes) {
      if (!isSizeFeasible(structure, size)) {
        skipped.push({
          structure,
          size,
          reason: 'Tamanho acima do teto de segurança do benchmark (200.000).',
        });
        continue;
      }
      if (structure === 'Trie' || structure === 'Patricia') {
        results.push(...benchmarkTrieOrPatricia(structure, size));
      } else if (structure === 'Splay' || structure === 'Treap') {
        results.push(...benchmarkSplayOrTreap(structure, size, config.pattern));
      } else {
        results.push(...benchmarkKDTree(size));
      }
    }
  }

  return { results, skipped };
}

/** Devolve o controle ao navegador (permite repintar a tela e processar cliques)
 *  antes de continuar. `requestAnimationFrame` alinha com um quadro real de
 *  tela; cai para `setTimeout` fora do navegador (ex: nos testes). */
function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => resolve());
    } else {
      setTimeout(resolve, 0);
    }
  });
}

export interface BenchmarkProgress {
  done: number;
  total: number;
  currentStructure: StructureName;
  currentSize: number;
}

/**
 * Mesma lógica de `runBenchmark`, mas executada em pedaços: cada combinação
 * (estrutura, tamanho) roda de forma síncrona — como antes, para não
 * distorcer o tempo medido de cada operação —, mas ENTRE uma combinação e
 * outra o controle volta ao navegador. Assim, mesmo selecionando várias
 * estruturas grandes ao mesmo tempo, a thread principal nunca fica bloqueada
 * por mais do que o custo de uma única combinação — o navegador continua
 * respondendo, repintando a tela e processando o clique em "Cancelar".
 *
 * `onProgress` é chamado após cada combinação concluída, com os resultados
 * parciais já prontos — permite a interface mostrar o gráfico/tabela
 * preenchendo em tempo real, em vez de uma espera às cegas.
 */
export async function runBenchmarkAsync(
  config: BenchmarkRunConfig,
  onProgress?: (progress: BenchmarkProgress, partialResults: BenchmarkResult[]) => void,
  shouldCancel?: () => boolean,
): Promise<BenchmarkOutcome & { cancelled: boolean }> {
  const results: BenchmarkResult[] = [];
  const skipped: { structure: StructureName; size: number; reason: string }[] = [];
  const combos = config.structures.flatMap((structure) => config.sizes.map((size) => ({ structure, size })));
  const total = combos.length;
  let done = 0;

  for (const { structure, size } of combos) {
    if (shouldCancel?.()) {
      return { results, skipped, cancelled: true };
    }

    // Devolve o controle ANTES de cada combinação — é o que impede o
    // "Página sem resposta": o navegador sempre tem a chance de repintar e
    // reagir a cliques entre uma combinação (potencialmente pesada) e outra.
    await yieldToBrowser();

    if (!isSizeFeasible(structure, size)) {
      skipped.push({ structure, size, reason: 'Tamanho acima do teto de segurança do benchmark (200.000).' });
    } else if (structure === 'Trie' || structure === 'Patricia') {
      results.push(...benchmarkTrieOrPatricia(structure, size));
    } else if (structure === 'Splay' || structure === 'Treap') {
      results.push(...benchmarkSplayOrTreap(structure, size, config.pattern));
    } else {
      results.push(...benchmarkKDTree(size));
    }

    done += 1;
    onProgress?.({ done, total, currentStructure: structure, currentSize: size }, results);
  }

  return { results, skipped, cancelled: false };
}
