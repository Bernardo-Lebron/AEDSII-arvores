/**
 * Núcleo do sistema de rastreamento passo a passo.
 *
 * Cada estrutura de dados, ao executar uma operação (inserir, buscar, remover...),
 * não apenas modifica seu estado interno: ela também produz uma sequência de
 * `OperationStep`, cada um contendo um SNAPSHOT serializado (não uma referência viva)
 * da estrutura naquele instante. Isso permite que a interface "volte no tempo" e
 * reproduza os passos sem re-executar o algoritmo.
 */

/** Tipos de evento que podem ocorrer durante uma operação, em qualquer estrutura. */
export type StepEventType =
  | 'start'
  | 'compare'
  | 'descend'
  | 'create-node'
  | 'update-pointer'
  | 'mark-end'
  | 'unmark-end'
  | 'remove-node'
  | 'split-edge'
  | 'merge-edge'
  | 'rotate-left'
  | 'rotate-right'
  | 'rotate-zig'
  | 'rotate-zig-zig'
  | 'rotate-zig-zag'
  | 'heap-violation'
  | 'change-root'
  | 'axis-partition'
  | 'found'
  | 'not-found'
  | 'no-op'
  | 'done';

/**
 * Um passo de uma operação. `TSnapshot` é o tipo de estado serializado específico
 * de cada estrutura (ex: TrieSnapshot, SplaySnapshot, KDTreeSnapshot...).
 */
export interface OperationStep<TSnapshot> {
  id: string;
  index: number;
  type: StepEventType;
  description: string;
  /** ids dos nós envolvidos neste passo, para destaque visual */
  highlights: string[];
  /** estado completo da estrutura logo após este passo */
  snapshot: TSnapshot;
  metadata?: Record<string, unknown>;
}

/** Resultado completo de uma operação: valor de retorno + trilha de passos. */
export interface OperationResult<TSnapshot, TValue = void> {
  value: TValue;
  steps: OperationStep<TSnapshot>[];
}

/**
 * Coletor auxiliar usado internamente pelas estruturas para acumular passos
 * durante a execução de uma operação, sem precisar gerenciar índices manualmente.
 */
export class StepRecorder<TSnapshot> {
  private steps: OperationStep<TSnapshot>[] = [];
  private counter = 0;
  private readonly enabled: boolean;

  /**
   * `enabled = false` (usado pelos experimentos de desempenho) faz de `record`
   * um no-op completo: a função `snapshot` passada para `record` nem chega a
   * ser executada. Isso é essencial — sem isso, cada passo serializaria a
   * estrutura inteira à toa, transformando uma inserção O(log n) em O(n) só
   * pelo custo de rastreamento, e um benchmark de N operações em O(n²).
   */
  constructor(
    private readonly opId: string,
    options?: { enabled?: boolean },
  ) {
    this.enabled = options?.enabled ?? true;
  }

  record(
    type: StepEventType,
    description: string,
    highlights: string[],
    snapshot: TSnapshot | (() => TSnapshot),
    metadata?: Record<string, unknown>,
  ): void {
    if (!this.enabled) return;
    const resolvedSnapshot = typeof snapshot === 'function' ? (snapshot as () => TSnapshot)() : snapshot;
    this.steps.push({
      id: `${this.opId}-${this.counter}`,
      index: this.counter,
      type,
      description,
      highlights,
      snapshot: resolvedSnapshot,
      metadata,
    });
    this.counter += 1;
  }

  toArray(): OperationStep<TSnapshot>[] {
    return this.steps;
  }
}

let opCounter = 0;
export function newOperationId(prefix: string): string {
  opCounter += 1;
  return `${prefix}-${Date.now()}-${opCounter}`;
}
