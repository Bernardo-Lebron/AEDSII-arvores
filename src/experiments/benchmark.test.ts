import { describe, it, expect } from 'vitest';
import { runBenchmark, runBenchmarkAsync } from './benchmark';

describe('runBenchmark (síncrono)', () => {
  it('produz insert/search/remove para cada combinação estrutura x tamanho', () => {
    const outcome = runBenchmark({ structures: ['Trie', 'Splay'], sizes: [50, 200], pattern: 'random' });
    expect(outcome.skipped).toHaveLength(0);
    // 2 estruturas x 2 tamanhos x 3 operações (insert/search/remove) = 12
    expect(outcome.results).toHaveLength(12);
    expect(outcome.results.every((r) => r.executionTimeMs >= 0)).toBe(true);
    expect(outcome.results.every((r) => r.nodeCount >= 0)).toBe(true);
  });

  it('ignora tamanhos acima do teto de segurança', () => {
    const outcome = runBenchmark({ structures: ['Trie'], sizes: [500000], pattern: 'random' });
    expect(outcome.results).toHaveLength(0);
    expect(outcome.skipped).toHaveLength(1);
    expect(outcome.skipped[0].reason).toMatch(/teto de segurança/);
  });
});

describe('runBenchmarkAsync (em pedaços, sem travar a thread)', () => {
  it('produz o mesmo conjunto de resultados que a versão síncrona', async () => {
    const outcome = await runBenchmarkAsync({ structures: ['Trie', 'Patricia'], sizes: [50, 100], pattern: 'random' });
    expect(outcome.cancelled).toBe(false);
    expect(outcome.results).toHaveLength(12); // 2 estruturas x 2 tamanhos x 3 operações
  });

  it('reporta progresso incremental, uma combinação por vez, terminando em done === total', async () => {
    const progressCalls: { done: number; total: number }[] = [];
    await runBenchmarkAsync({ structures: ['Trie', 'Splay', 'Treap'], sizes: [50, 100], pattern: 'random' }, (p) => {
      progressCalls.push({ done: p.done, total: p.total });
    });
    expect(progressCalls).toHaveLength(6); // 3 estruturas x 2 tamanhos
    expect(progressCalls.every((p) => p.total === 6)).toBe(true);
    expect(progressCalls.map((p) => p.done)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('entrega resultados parciais a cada callback de progresso (streaming), não só no final', async () => {
    const snapshots: number[] = [];
    await runBenchmarkAsync({ structures: ['Trie', 'Splay'], sizes: [50, 100], pattern: 'random' }, (_p, partial) => {
      snapshots.push(partial.length);
    });
    // cresce a cada combinação: 3, 6, 9, 12 (3 operações por combinação)
    expect(snapshots).toEqual([3, 6, 9, 12]);
  });

  it('para de verdade quando cancelado no meio da execução', async () => {
    let calls = 0;
    const outcome = await runBenchmarkAsync(
      { structures: ['Trie', 'Splay', 'Treap', 'KDTree'], sizes: [50, 100], pattern: 'random' },
      () => {
        calls += 1;
      },
      () => calls >= 2, // cancela logo após a 2ª combinação concluir
    );
    expect(outcome.cancelled).toBe(true);
    // resultados parciais das combinações já concluídas são preservados
    expect(outcome.results.length).toBeGreaterThan(0);
    expect(outcome.results.length).toBeLessThan(4 * 2 * 3);
  });
});
