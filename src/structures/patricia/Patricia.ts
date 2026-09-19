import { StepRecorder, newOperationId } from '../../core/steps';
import { PatriciaNode, commonPrefixLength } from './PatriciaNode';
import type { PatriciaOperationResult, PatriciaSnapshot, PatriciaSnapshotNode } from './types';

/**
 * Árvore Patricia / Radix Tree compacta.
 *
 * Diferente da Trie, cada aresta carrega uma STRING (não um único caractere).
 * Quando duas chaves divergem no meio de uma aresta existente, a aresta é
 * DIVIDIDA (split) em um nó intermediário — este é o mecanismo central que
 * diferencia a Patricia de uma Trie comum.
 */
export class Patricia {
  private root: PatriciaNode;

  constructor() {
    this.root = new PatriciaNode('');
  }

  private serialize(): PatriciaSnapshot {
    const nodes: Record<string, PatriciaSnapshotNode> = {};
    const visit = (node: PatriciaNode): void => {
      const childrenIds = [...node.children.values()]
        .sort((a, b) => a.edgeLabel.localeCompare(b.edgeLabel))
        .map((c) => c.id);
      nodes[node.id] = {
        id: node.id,
        edgeLabel: node.edgeLabel,
        isEndOfWord: node.isEndOfWord,
        childrenIds,
      };
      for (const child of node.children.values()) visit(child);
    };
    visit(this.root);
    return { nodes, rootId: this.root.id };
  }

  insert(word: string, recordSteps = true): PatriciaOperationResult {
    const recorder = new StepRecorder<PatriciaSnapshot>(newOperationId('patricia-insert'), { enabled: recordSteps });
    const key = word.toLowerCase();

    if (key.length === 0) {
      recorder.record('no-op', 'Chave vazia: nada a inserir.', [], () => this.serialize());
      return { value: undefined, steps: recorder.toArray() };
    }

    recorder.record('start', `Iniciando inserção de "${key}" a partir da raiz.`, [this.root.id], () => this.serialize());
    this.insertRec(this.root, key, recorder);
    recorder.record('done', `Inserção de "${key}" concluída.`, [this.root.id], () => this.serialize());
    return { value: undefined, steps: recorder.toArray() };
  }

  private insertRec(node: PatriciaNode, remaining: string, recorder: StepRecorder<PatriciaSnapshot>): void {
    if (remaining.length === 0) {
      if (!node.isEndOfWord) {
        node.isEndOfWord = true;
        recorder.record('mark-end', 'Marcando nó como fim de palavra.', [node.id], () => this.serialize());
      } else {
        recorder.record('no-op', 'A chave já existia.', [node.id], () => this.serialize());
      }
      return;
    }

    const firstChar = remaining[0];
    const child = node.children.get(firstChar);

    if (!child) {
      const created = new PatriciaNode(remaining);
      created.isEndOfWord = true;
      node.children.set(firstChar, created);
      recorder.record(
        'create-node',
        `Nenhuma aresta começa com "${firstChar}" — criando nova aresta compactada "${remaining}".`,
        [node.id, created.id],
        () => this.serialize(),
      );
      return;
    }

    const cpl = commonPrefixLength(remaining, child.edgeLabel);
    recorder.record(
      'compare',
      `Comparando "${remaining}" com a aresta existente "${child.edgeLabel}" — prefixo comum de tamanho ${cpl}.`,
      [child.id],
      () => this.serialize(),
    );

    if (cpl === child.edgeLabel.length) {
      // A aresta inteira bate — descemos e continuamos com o restante.
      recorder.record(
        'descend',
        `Aresta "${child.edgeLabel}" totalmente consumida — descendo para continuar com "${remaining.slice(cpl)}".`,
        [child.id],
        () => this.serialize(),
      );
      this.insertRec(child, remaining.slice(cpl), recorder);
      return;
    }

    // Divergência no meio da aresta: é preciso DIVIDIR (split).
    const commonPart = child.edgeLabel.slice(0, cpl);
    const childRemainder = child.edgeLabel.slice(cpl);
    const insertRemainder = remaining.slice(cpl);

    const splitNode = new PatriciaNode(commonPart);
    node.children.set(firstChar, splitNode);

    child.edgeLabel = childRemainder;
    splitNode.children.set(childRemainder[0], child);

    recorder.record(
      'split-edge',
      `Prefixos divergem após "${commonPart}" — dividindo a aresta "${child.edgeLabel === childRemainder ? commonPart + childRemainder : commonPart}" em um nó intermediário "${commonPart}" e o restante "${childRemainder}".`,
      [splitNode.id, child.id],
      () => this.serialize(),
    );

    if (insertRemainder.length === 0) {
      splitNode.isEndOfWord = true;
      recorder.record('mark-end', `Chave termina exatamente no ponto de divisão — marcando "${commonPart}" como fim de palavra.`, [splitNode.id], () => this.serialize());
    } else {
      const newLeaf = new PatriciaNode(insertRemainder);
      newLeaf.isEndOfWord = true;
      splitNode.children.set(insertRemainder[0], newLeaf);
      recorder.record(
        'create-node',
        `Criando nova ramificação "${insertRemainder}" a partir do nó de divisão.`,
        [splitNode.id, newLeaf.id],
        () => this.serialize(),
      );
    }
  }

  search(word: string, recordSteps = true): PatriciaOperationResult<boolean> {
    const recorder = new StepRecorder<PatriciaSnapshot>(newOperationId('patricia-search'), { enabled: recordSteps });
    const key = word.toLowerCase();
    let node = this.root;
    let remaining = key;
    recorder.record('start', `Buscando "${key}" a partir da raiz.`, [node.id], () => this.serialize());

    while (remaining.length > 0) {
      const child = node.children.get(remaining[0]);
      if (!child) {
        recorder.record('not-found', `Não há aresta começando com "${remaining[0]}".`, [node.id], () => this.serialize());
        return { value: false, steps: recorder.toArray() };
      }
      const cpl = commonPrefixLength(remaining, child.edgeLabel);
      recorder.record('compare', `Comparando restante "${remaining}" com aresta "${child.edgeLabel}".`, [child.id], () => this.serialize());
      if (cpl < child.edgeLabel.length) {
        recorder.record('not-found', `Prefixo comum menor que a aresta — "${key}" não existe.`, [child.id], () => this.serialize());
        return { value: false, steps: recorder.toArray() };
      }
      node = child;
      remaining = remaining.slice(cpl);
    }

    const found = node.isEndOfWord;
    recorder.record(
      found ? 'found' : 'not-found',
      found ? `"${key}" encontrada.` : `Caminho existe mas nó não é fim de palavra.`,
      [node.id],
      () => this.serialize(),
    );
    return { value: found, steps: recorder.toArray() };
  }

  remove(word: string, recordSteps = true): PatriciaOperationResult<boolean> {
    const recorder = new StepRecorder<PatriciaSnapshot>(newOperationId('patricia-remove'), { enabled: recordSteps });
    const key = word.toLowerCase();

    const path: { parent: PatriciaNode; node: PatriciaNode }[] = [];
    let node = this.root;
    let remaining = key;
    recorder.record('start', `Buscando "${key}" para remoção.`, [node.id], () => this.serialize());

    while (remaining.length > 0) {
      const child = node.children.get(remaining[0]);
      if (!child) {
        recorder.record('not-found', `"${key}" não existe — nada a remover.`, [node.id], () => this.serialize());
        return { value: false, steps: recorder.toArray() };
      }
      const cpl = commonPrefixLength(remaining, child.edgeLabel);
      if (cpl < child.edgeLabel.length) {
        recorder.record('not-found', `"${key}" não existe (divergência no meio de uma aresta).`, [child.id], () => this.serialize());
        return { value: false, steps: recorder.toArray() };
      }
      path.push({ parent: node, node: child });
      node = child;
      remaining = remaining.slice(cpl);
    }

    if (!node.isEndOfWord) {
      recorder.record('not-found', `"${key}" não é uma palavra completa — nada a remover.`, [node.id], () => this.serialize());
      return { value: false, steps: recorder.toArray() };
    }

    node.isEndOfWord = false;
    recorder.record('unmark-end', `Desmarcando fim de palavra em "${key}".`, [node.id], () => this.serialize());

    // Compactação: da folha para a raiz, remove nós vazios e funde arestas quando sobra 1 filho.
    for (let i = path.length - 1; i >= 0; i--) {
      const { parent, node: current } = path[i];

      if (current.children.size === 0 && !current.isEndOfWord) {
        parent.children.delete(current.edgeLabel[0]);
        recorder.record('remove-node', `Nó folha "${current.edgeLabel}" ficou vazio — removendo.`, [parent.id], () => this.serialize());
        continue;
      }

      if (current.children.size === 1 && !current.isEndOfWord) {
        const onlyChild = [...current.children.values()][0];
        const mergedLabel = current.edgeLabel + onlyChild.edgeLabel;
        onlyChild.edgeLabel = mergedLabel;
        parent.children.set(mergedLabel[0], onlyChild);
        recorder.record(
          'merge-edge',
          `Nó intermediário "${current.edgeLabel}" tem apenas 1 filho e não marca fim de palavra — compactando em "${mergedLabel}".`,
          [parent.id, onlyChild.id],
          () => this.serialize(),
        );
      }

      break; // acima deste ponto nada mudou estruturalmente
    }

    recorder.record('done', `Remoção de "${key}" concluída.`, [this.root.id], () => this.serialize());
    return { value: true, steps: recorder.toArray() };
  }

  getSnapshot(): PatriciaSnapshot {
    return this.serialize();
  }

  /** Número de nós atualmente alocados — usado como indicador de custo de memória. */
  nodeCount(): number {
    return Object.keys(this.serialize().nodes).length;
  }

  clear(): void {
    this.root = new PatriciaNode('');
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const visit = (node: PatriciaNode, isRoot: boolean): void => {
      if (!isRoot && node.edgeLabel.length === 0) {
        errors.push(`Nó não-raiz ${node.id} tem edgeLabel vazio (deveria ter sido compactado).`);
      }
      if (!isRoot && node.children.size === 1 && !node.isEndOfWord) {
        errors.push(`Nó ${node.id} deveria ter sido compactado (1 filho, não é fim de palavra).`);
      }
      for (const [firstChar, child] of node.children) {
        if (child.edgeLabel[0] !== firstChar) {
          errors.push(`Filho indexado por "${firstChar}" tem edgeLabel começando com "${child.edgeLabel[0]}".`);
        }
        visit(child, false);
      }
    };
    visit(this.root, true);
    return { valid: errors.length === 0, errors };
  }
}
