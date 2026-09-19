export type StructureName = 'Trie' | 'Patricia' | 'Splay' | 'Treap' | 'KDTree';
export type OperationName = 'insert' | 'search' | 'remove';
export type DataPattern = 'random' | 'sorted' | 'reverse';

/**
 * Resultado de uma medição real. Nunca é inventado: `executionTimeMs` vem
 * diretamente de `performance.now()` em torno da execução real da operação
 * na estrutura de dados correspondente (a mesma classe usada na UI).
 */
export interface BenchmarkResult {
  structure: StructureName;
  operation: OperationName;
  size: number;
  pattern: DataPattern;
  executionTimeMs: number;
  operationsCount: number;
  /**
   * Número de nós alocados na estrutura logo após a operação, usado como
   * indicador de custo de memória (proxy real, não estimado: contagem real
   * de nós, e não uma estimativa de bytes). Trie e Patricia costumam divergir
   * de `size` por causa do compartilhamento/compactação de prefixos — é
   * exatamente essa divergência que a comparação de memória evidencia.
   */
  nodeCount: number;
}

export interface BenchmarkRunConfig {
  structures: StructureName[];
  sizes: number[];
  pattern: DataPattern;
}
