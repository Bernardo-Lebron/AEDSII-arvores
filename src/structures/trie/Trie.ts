import { StepRecorder, newOperationId } from '../../core/steps';
import type { TrieOperationResult, TrieSnapshot, TrieSnapshotNode } from './types';
import { TrieNode } from './TrieNode';

/**
 * Trie (árvore de prefixos) real, sem estruturas auxiliares fictícias.
 * Cada operação pública devolve o resultado E a trilha de OperationStep,
 * gerada a partir da execução de verdade do algoritmo.
 */
export class Trie {
  private root: TrieNode;

  constructor() {
    this.root = new TrieNode('');
  }

  /** Serializa a árvore inteira (usado a cada passo para o snapshot). */
  private serialize(): TrieSnapshot {
    const nodes: Record<string, TrieSnapshotNode> = {};

    const visit = (node: TrieNode): void => {
      const childrenIds = [...node.children.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, child]) => child.id);
      nodes[node.id] = {
        id: node.id,
        char: node.char,
        isEndOfWord: node.isEndOfWord,
        childrenIds,
      };
      for (const child of node.children.values()) visit(child);
    };

    visit(this.root);
    return { nodes, rootId: this.root.id };
  }

  insert(word: string, recordSteps = true): TrieOperationResult {
    const recorder = new StepRecorder<TrieSnapshot>(newOperationId('trie-insert'), { enabled: recordSteps });
    const normalized = word.toLowerCase();

    if (normalized.length === 0) {
      recorder.record('no-op', 'Palavra vazia: nada a inserir.', [], () => this.serialize());
      return { value: undefined, steps: recorder.toArray() };
    }

    let current = this.root;
    recorder.record('start', `Iniciando inserção de "${normalized}" a partir da raiz.`, [current.id], () => this.serialize());

    for (const char of normalized) {
      const existing = current.children.get(char);
      if (existing) {
        current = existing;
        recorder.record(
          'descend',
          `Caractere "${char}" já existe como filho — caminho compartilhado, descendo.`,
          [current.id],
          () => this.serialize(),
        );
      } else {
        const created = new TrieNode(char);
        current.children.set(char, created);
        recorder.record(
          'create-node',
          `Caractere "${char}" não existe neste ramo — criando novo nó.`,
          [current.id, created.id],
          () => this.serialize(),
        );
        current = created;
      }
    }

    if (!current.isEndOfWord) {
      current.isEndOfWord = true;
      recorder.record(
        'mark-end',
        `Marcando o nó final como fim da palavra "${normalized}".`,
        [current.id],
        () => this.serialize(),
      );
    } else {
      recorder.record('no-op', `A palavra "${normalized}" já existia na Trie.`, [current.id], () => this.serialize());
    }

    recorder.record('done', `Inserção de "${normalized}" concluída.`, [current.id], () => this.serialize());
    return { value: undefined, steps: recorder.toArray() };
  }

  search(word: string, recordSteps = true): TrieOperationResult<boolean> {
    const recorder = new StepRecorder<TrieSnapshot>(newOperationId('trie-search'), { enabled: recordSteps });
    const normalized = word.toLowerCase();
    let current = this.root;
    recorder.record('start', `Buscando "${normalized}" a partir da raiz.`, [current.id], () => this.serialize());

    for (const char of normalized) {
      const next = current.children.get(char);
      recorder.record(
        'compare',
        `Verificando se existe filho com caractere "${char}".`,
        [current.id],
        () => this.serialize(),
      );
      if (!next) {
        recorder.record('not-found', `Caractere "${char}" não encontrado — palavra ausente.`, [current.id], () => this.serialize());
        return { value: false, steps: recorder.toArray() };
      }
      current = next;
    }

    const found = current.isEndOfWord;
    recorder.record(
      found ? 'found' : 'not-found',
      found
        ? `Todos os caracteres percorridos e nó final marcado como fim de palavra — "${normalized}" encontrada.`
        : `Caminho existe, mas o nó final não está marcado como fim de palavra — "${normalized}" não é uma palavra completa.`,
      [current.id],
      () => this.serialize(),
    );
    return { value: found, steps: recorder.toArray() };
  }

  startsWith(prefix: string, recordSteps = true): TrieOperationResult<boolean> {
    const recorder = new StepRecorder<TrieSnapshot>(newOperationId('trie-prefix'), { enabled: recordSteps });
    const normalized = prefix.toLowerCase();
    let current = this.root;
    recorder.record('start', `Verificando prefixo "${normalized}".`, [current.id], () => this.serialize());

    for (const char of normalized) {
      const next = current.children.get(char);
      if (!next) {
        recorder.record('not-found', `Prefixo "${normalized}" não existe na Trie.`, [current.id], () => this.serialize());
        return { value: false, steps: recorder.toArray() };
      }
      current = next;
      recorder.record('descend', `Prefixo parcial encontrado até "${char}".`, [current.id], () => this.serialize());
    }

    recorder.record('found', `Prefixo "${normalized}" existe na Trie.`, [current.id], () => this.serialize());
    return { value: true, steps: recorder.toArray() };
  }

  /** Lista todas as palavras que começam com o prefixo dado (sem rastreamento de passos). */
  wordsWithPrefix(prefix: string): string[] {
    const normalized = prefix.toLowerCase();
    let current = this.root;
    for (const char of normalized) {
      const next = current.children.get(char);
      if (!next) return [];
      current = next;
    }
    const results: string[] = [];
    const dfs = (node: TrieNode, path: string): void => {
      if (node.isEndOfWord) results.push(path);
      for (const [char, child] of [...node.children.entries()].sort(([a], [b]) => a.localeCompare(b))) {
        dfs(child, path + char);
      }
    };
    dfs(current, normalized);
    return results;
  }

  remove(word: string, recordSteps = true): TrieOperationResult<boolean> {
    const recorder = new StepRecorder<TrieSnapshot>(newOperationId('trie-remove'), { enabled: recordSteps });
    const normalized = word.toLowerCase();

    // Primeiro localizamos o caminho completo (necessário para poda de nós órfãos).
    const path: TrieNode[] = [this.root];
    let current = this.root;
    recorder.record('start', `Buscando "${normalized}" para remoção.`, [current.id], () => this.serialize());

    for (const char of normalized) {
      const next = current.children.get(char);
      if (!next) {
        recorder.record('not-found', `Palavra "${normalized}" não existe — nada a remover.`, [current.id], () => this.serialize());
        return { value: false, steps: recorder.toArray() };
      }
      current = next;
      path.push(current);
    }

    if (!current.isEndOfWord) {
      recorder.record('not-found', `"${normalized}" não está marcada como palavra completa — nada a remover.`, [current.id], () => this.serialize());
      return { value: false, steps: recorder.toArray() };
    }

    current.isEndOfWord = false;
    recorder.record('unmark-end', `Desmarcando fim de palavra em "${normalized}".`, [current.id], () => this.serialize());

    // Poda os nós que ficaram sem filhos e não marcam fim de outra palavra.
    for (let i = path.length - 1; i > 0; i--) {
      const node = path[i];
      const parent = path[i - 1];
      if (node.children.size === 0 && !node.isEndOfWord) {
        parent.children.delete(node.char);
        recorder.record(
          'remove-node',
          `Nó "${node.char}" ficou sem filhos e sem marcação de palavra — removendo (poda).`,
          [parent.id],
          () => this.serialize(),
        );
      } else {
        break;
      }
    }

    recorder.record('done', `Remoção de "${normalized}" concluída.`, [this.root.id], () => this.serialize());
    return { value: true, steps: recorder.toArray() };
  }

  getSnapshot(): TrieSnapshot {
    return this.serialize();
  }

  /** Número de nós atualmente alocados — usado como indicador de custo de memória. */
  nodeCount(): number {
    return Object.keys(this.serialize().nodes).length;
  }

  clear(): void {
    this.root = new TrieNode('');
  }

  /**
   * Valida invariantes estruturais: toda chave alcançável por children.get(c) deve
   * ter char === c, e não deve haver ciclos (garantido estruturalmente pela ausência
   * de referências ao pai, mas verificamos profundidade máxima como sanidade).
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const visited = new Set<string>();

    const visit = (node: TrieNode, depth: number): void => {
      if (visited.has(node.id)) {
        errors.push(`Ciclo detectado no nó ${node.id}`);
        return;
      }
      visited.add(node.id);
      if (depth > 10000) {
        errors.push('Profundidade excessiva — possível ciclo.');
        return;
      }
      for (const [char, child] of node.children) {
        if (child.char !== char) {
          errors.push(`Nó filho indexado por "${char}" tem char="${child.char}"`);
        }
        visit(child, depth + 1);
      }
    };

    visit(this.root, 0);
    return { valid: errors.length === 0, errors };
  }
}
