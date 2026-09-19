/** Executa `fn`, mede o tempo real decorrido em milissegundos e devolve ambos. */
export function measure<T>(fn: () => T): { result: T; elapsedMs: number } {
  const start = performance.now();
  const result = fn();
  const elapsedMs = performance.now() - start;
  return { result, elapsedMs };
}
