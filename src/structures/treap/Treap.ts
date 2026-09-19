import { StepRecorder, newOperationId } from '../../core/steps';
import { TreapNode } from './TreapNode';
import type { TreapOperationResult, TreapSnapshot, TreapSnapshotNode } from './types';

/**
 * Treap: combina propriedade de BST (por `key`) com propriedade de Heap máximo
 * (por `priority`). Prioridades podem ser fornecidas manualmente (para fins
 * didáticos, provocando rotações específicas) ou geradas automaticamente.
 */
export class Treap {
  private root: TreapNode | null = null;

  private serialize(): TreapSnapshot {
    const nodes: Record<string, TreapSnapshotNode> = {};
    const visit = (node: TreapNode | null): void => {
      if (!node) return;
      nodes[node.id] = {
        id: node.id,
        key: node.key,
        priority: node.priority,
        leftId: node.left?.id ?? null,
        rightId: node.right?.id ?? null,
      };
      visit(node.left);
      visit(node.right);
    };
    visit(this.root);
    return { nodes, rootId: this.root?.id ?? null };
  }

  private rotateRight(x: TreapNode): void {
    const y = x.left!;
    x.left = y.right;
    if (y.right) y.right.parent = x;
    y.parent = x.parent;
    if (!x.parent) this.root = y;
    else if (x === x.parent.left) x.parent.left = y;
    else x.parent.right = y;
    y.right = x;
    x.parent = y;
  }

  private rotateLeft(x: TreapNode): void {
    const y = x.right!;
    x.right = y.left;
    if (y.left) y.left.parent = x;
    y.parent = x.parent;
    if (!x.parent) this.root = y;
    else if (x === x.parent.left) x.parent.left = y;
    else x.parent.right = y;
    y.left = x;
    x.parent = y;
  }

  static randomPriority(): number {
    return Math.floor(Math.random() * 100);
  }

  insert(key: number, priority?: number, recordSteps = true): TreapOperationResult {
    const recorder = new StepRecorder<TreapSnapshot>(newOperationId('treap-insert'), { enabled: recordSteps });
    const effectivePriority = priority ?? Treap.randomPriority();

    if (!this.root) {
      this.root = new TreapNode(key, effectivePriority);
      recorder.record('create-node', `Árvore vazia — ${key} (prioridade ${effectivePriority}) se torna a raiz.`, [this.root.id], () => this.serialize());
      recorder.record('done', `Inserção de ${key} concluída.`, [this.root.id], () => this.serialize());
      return { value: undefined, steps: recorder.toArray() };
    }

    let current: TreapNode = this.root;
    recorder.record('start', `Iniciando inserção de ${key} (prioridade ${effectivePriority}) a partir da raiz.`, [current.id], () => this.serialize());

    let created: TreapNode;
    for (;;) {
      recorder.record('compare', `Comparando chave ${key} com ${current.key}.`, [current.id], () => this.serialize());
      if (key === current.key) {
        recorder.record('no-op', `Chave ${key} já existe — inserção ignorada.`, [current.id], () => this.serialize());
        return { value: undefined, steps: recorder.toArray() };
      }
      if (key < current.key) {
        if (!current.left) {
          created = new TreapNode(key, effectivePriority);
          created.parent = current;
          current.left = created;
          recorder.record('create-node', `Criando nó ${key} (prioridade ${effectivePriority}) como filho esquerdo de ${current.key}.`, [current.id, created.id], () => this.serialize());
          break;
        }
        current = current.left;
      } else {
        if (!current.right) {
          created = new TreapNode(key, effectivePriority);
          created.parent = current;
          current.right = created;
          recorder.record('create-node', `Criando nó ${key} (prioridade ${effectivePriority}) como filho direito de ${current.key}.`, [current.id, created.id], () => this.serialize());
          break;
        }
        current = current.right;
      }
    }

    // Corrige a propriedade de heap subindo com rotações enquanto houver violação.
    let node = created;
    while (node.parent && node.priority > node.parent.priority) {
      const parent = node.parent;
      recorder.record(
        'heap-violation',
        `Violação da propriedade de heap: ${node.key} (prioridade ${node.priority}) é maior que seu pai ${parent.key} (prioridade ${parent.priority}).`,
        [node.id, parent.id],
        () => this.serialize(),
      );
      if (node === parent.left) {
        this.rotateRight(parent);
        recorder.record('rotate-right', `Rotação à direita em ${parent.key} para promover ${node.key}.`, [node.id, parent.id], () => this.serialize());
      } else {
        this.rotateLeft(parent);
        recorder.record('rotate-left', `Rotação à esquerda em ${parent.key} para promover ${node.key}.`, [node.id, parent.id], () => this.serialize());
      }
    }

    recorder.record('done', `Inserção de ${key} concluída — propriedade de heap restaurada.`, [node.id], () => this.serialize());
    return { value: undefined, steps: recorder.toArray() };
  }

  search(key: number, recordSteps = true): TreapOperationResult<boolean> {
    const recorder = new StepRecorder<TreapSnapshot>(newOperationId('treap-search'), { enabled: recordSteps });
    let current = this.root;
    recorder.record('start', `Buscando ${key}.`, current ? [current.id] : [], () => this.serialize());

    while (current) {
      recorder.record('compare', `Comparando ${key} com ${current.key}.`, [current.id], () => this.serialize());
      if (key === current.key) {
        recorder.record('found', `${key} encontrado.`, [current.id], () => this.serialize());
        return { value: true, steps: recorder.toArray() };
      }
      current = key < current.key ? current.left : current.right;
    }
    recorder.record('not-found', `${key} não encontrado.`, [], () => this.serialize());
    return { value: false, steps: recorder.toArray() };
  }

  remove(key: number, recordSteps = true): TreapOperationResult<boolean> {
    const recorder = new StepRecorder<TreapSnapshot>(newOperationId('treap-remove'), { enabled: recordSteps });
    let node = this.root;
    recorder.record('start', `Buscando ${key} para remoção.`, node ? [node.id] : [], () => this.serialize());

    while (node && node.key !== key) {
      recorder.record('compare', `Comparando ${key} com ${node.key}.`, [node.id], () => this.serialize());
      node = key < node.key ? node.left : node.right;
    }

    if (!node) {
      recorder.record('not-found', `${key} não existe — nada a remover.`, [], () => this.serialize());
      return { value: false, steps: recorder.toArray() };
    }

    // "Desce" o nó via rotações (sempre promovendo o filho de maior prioridade)
    // até que ele se torne uma folha, e então o desconecta.
    while (node.left || node.right) {
      const goRight = !node.left || (node.right && node.right.priority > node.left.priority);
      if (goRight) {
        recorder.record('rotate-left', `Promovendo filho direito ${node.right!.key} (maior prioridade) — rotação à esquerda em ${node.key}.`, [node.id, node.right!.id], () => this.serialize());
        this.rotateLeft(node);
      } else {
        recorder.record('rotate-right', `Promovendo filho esquerdo ${node.left!.key} (maior prioridade) — rotação à direita em ${node.key}.`, [node.id, node.left!.id], () => this.serialize());
        this.rotateRight(node);
      }
    }

    // node agora é uma folha; desconecta do pai.
    if (node.parent) {
      if (node.parent.left === node) node.parent.left = null;
      else node.parent.right = null;
    } else {
      this.root = null;
    }
    recorder.record('remove-node', `${key} agora é folha — removendo.`, [node.id], () => this.serialize());
    recorder.record('done', `Remoção de ${key} concluída.`, this.root ? [this.root.id] : [], () => this.serialize());
    return { value: true, steps: recorder.toArray() };
  }

  getSnapshot(): TreapSnapshot {
    return this.serialize();
  }

  /** Número de nós atualmente alocados — usado como indicador de custo de memória. */
  nodeCount(): number {
    return Object.keys(this.serialize().nodes).length;
  }

  clear(): void {
    this.root = null;
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const visit = (node: TreapNode | null, min: number, max: number): void => {
      if (!node) return;
      if (node.key < min || node.key > max) {
        errors.push(`Violação de BST no nó ${node.key} (esperado entre ${min} e ${max}).`);
      }
      if (node.left && node.left.priority > node.priority) {
        errors.push(`Violação de heap: filho esquerdo ${node.left.key} (prio ${node.left.priority}) > pai ${node.key} (prio ${node.priority}).`);
      }
      if (node.right && node.right.priority > node.priority) {
        errors.push(`Violação de heap: filho direito ${node.right.key} (prio ${node.right.priority}) > pai ${node.key} (prio ${node.priority}).`);
      }
      visit(node.left, min, node.key);
      visit(node.right, node.key, max);
    };
    visit(this.root, -Infinity, Infinity);
    return { valid: errors.length === 0, errors };
  }
}
