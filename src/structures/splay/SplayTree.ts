import { StepRecorder, newOperationId } from '../../core/steps';
import { SplayNode } from './SplayNode';
import type { SplayOperationResult, SplaySnapshot, SplaySnapshotNode } from './types';

/**
 * Árvore Splay: BST auto-ajustável. Toda operação de acesso (inserção, busca
 * bem-sucedida ou mal-sucedida, remoção) termina com uma sequência de rotações
 * (splay) que traz o nó acessado (ou seu último ancestral visitado) para a raiz.
 *
 * Os três casos clássicos são detectados explicitamente: Zig, Zig-Zig, Zig-Zag.
 */
export class SplayTree {
  private root: SplayNode | null = null;

  private serialize(): SplaySnapshot {
    const nodes: Record<string, SplaySnapshotNode> = {};
    const visit = (node: SplayNode | null): void => {
      if (!node) return;
      nodes[node.id] = {
        id: node.id,
        key: node.key,
        leftId: node.left?.id ?? null,
        rightId: node.right?.id ?? null,
      };
      visit(node.left);
      visit(node.right);
    };
    visit(this.root);
    return { nodes, rootId: this.root?.id ?? null };
  }

  private rotateRight(x: SplayNode): void {
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

  private rotateLeft(x: SplayNode): void {
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

  /** Traz `x` até a raiz da (sub)árvore em que ele vive, registrando cada passo. */
  private splay(x: SplayNode, recorder: StepRecorder<SplaySnapshot>): void {
    while (x.parent) {
      const parent = x.parent;
      const grand = parent.parent;

      if (!grand) {
        const goingRight = x === parent.left;
        if (goingRight) this.rotateRight(parent);
        else this.rotateLeft(parent);
        recorder.record(
          'rotate-zig',
          `Zig: ${x.key} é filho direto da raiz (${parent.key}) — uma única rotação o traz ao topo.`,
          [x.id, parent.id],
          () => this.serialize(),
        );
        continue;
      }

      const parentIsLeftOfGrand = parent === grand.left;
      const xIsLeftOfParent = x === parent.left;

      if (xIsLeftOfParent === parentIsLeftOfGrand) {
        // Zig-Zig: x e parent do mesmo lado do avô.
        if (parentIsLeftOfGrand) {
          this.rotateRight(grand);
          this.rotateRight(parent);
        } else {
          this.rotateLeft(grand);
          this.rotateLeft(parent);
        }
        recorder.record(
          'rotate-zig-zig',
          `Zig-Zig: ${x.key} e seu pai (${parent.key}) estão do mesmo lado do avô (${grand.key}) — duas rotações no mesmo sentido.`,
          [x.id, parent.id, grand.id],
          () => this.serialize(),
        );
      } else {
        // Zig-Zag: lados opostos.
        if (xIsLeftOfParent) {
          this.rotateRight(parent);
          this.rotateLeft(grand);
        } else {
          this.rotateLeft(parent);
          this.rotateRight(grand);
        }
        recorder.record(
          'rotate-zig-zag',
          `Zig-Zag: ${x.key} está em lado oposto ao de seu pai (${parent.key}) em relação ao avô (${grand.key}) — rotações em sentidos opostos.`,
          [x.id, parent.id, grand.id],
          () => this.serialize(),
        );
      }
    }
    this.root = x;
  }

  insert(key: number, recordSteps = true): SplayOperationResult {
    const recorder = new StepRecorder<SplaySnapshot>(newOperationId('splay-insert'), { enabled: recordSteps });

    if (!this.root) {
      this.root = new SplayNode(key);
      recorder.record('create-node', `Árvore vazia — ${key} se torna a raiz.`, [this.root.id], () => this.serialize());
      recorder.record('done', `Inserção de ${key} concluída.`, [this.root.id], () => this.serialize());
      return { value: undefined, steps: recorder.toArray() };
    }

    let current: SplayNode = this.root;
    recorder.record('start', `Iniciando inserção de ${key} a partir da raiz (${current.key}).`, [current.id], () => this.serialize());

    for (;;) {
      recorder.record('compare', `Comparando ${key} com ${current.key}.`, [current.id], () => this.serialize());
      if (key === current.key) {
        recorder.record('no-op', `${key} já existe na árvore — nenhum novo nó criado.`, [current.id], () => this.serialize());
        this.splay(current, recorder);
        recorder.record('done', `${key} já existia; trazido ao topo por splay.`, [current.id], () => this.serialize());
        return { value: undefined, steps: recorder.toArray() };
      }
      if (key < current.key) {
        if (!current.left) {
          const created = new SplayNode(key);
          created.parent = current;
          current.left = created;
          recorder.record('create-node', `Criando nó ${key} como filho esquerdo de ${current.key}.`, [current.id, created.id], () => this.serialize());
          current = created;
          break;
        }
        current = current.left;
      } else {
        if (!current.right) {
          const created = new SplayNode(key);
          created.parent = current;
          current.right = created;
          recorder.record('create-node', `Criando nó ${key} como filho direito de ${current.key}.`, [current.id, created.id], () => this.serialize());
          current = created;
          break;
        }
        current = current.right;
      }
    }

    this.splay(current, recorder);
    recorder.record('done', `Inserção de ${key} concluída — nó trazido à raiz.`, [current.id], () => this.serialize());
    return { value: undefined, steps: recorder.toArray() };
  }

  search(key: number, recordSteps = true): SplayOperationResult<boolean> {
    const recorder = new StepRecorder<SplaySnapshot>(newOperationId('splay-search'), { enabled: recordSteps });

    if (!this.root) {
      recorder.record('not-found', 'Árvore vazia.', [], () => this.serialize());
      return { value: false, steps: recorder.toArray() };
    }

    let current: SplayNode = this.root;
    let last: SplayNode = current;
    recorder.record('start', `Buscando ${key} a partir da raiz (${current.key}).`, [current.id], () => this.serialize());

    while (true) {
      recorder.record('compare', `Comparando ${key} com ${current.key}.`, [current.id], () => this.serialize());
      last = current;
      if (key === current.key) {
        recorder.record('found', `${key} encontrado.`, [current.id], () => this.serialize());
        this.splay(current, recorder);
        recorder.record('done', `${key} trazido ao topo por splay.`, [current.id], () => this.serialize());
        return { value: true, steps: recorder.toArray() };
      }
      const next = key < current.key ? current.left : current.right;
      if (!next) {
        recorder.record('not-found', `${key} não encontrado — último nó visitado será trazido ao topo.`, [current.id], () => this.serialize());
        this.splay(last, recorder);
        recorder.record('done', `Busca de ${key} concluída (não encontrado).`, [last.id], () => this.serialize());
        return { value: false, steps: recorder.toArray() };
      }
      current = next;
    }
  }

  remove(key: number, recordSteps = true): SplayOperationResult<boolean> {
    const recorder = new StepRecorder<SplaySnapshot>(newOperationId('splay-remove'), { enabled: recordSteps });

    if (!this.root) {
      recorder.record('not-found', 'Árvore vazia — nada a remover.', [], () => this.serialize());
      return { value: false, steps: recorder.toArray() };
    }

    // Localiza o nó (sem exigir splay ainda) para saber se existe.
    let current: SplayNode | null = this.root;
    recorder.record('start', `Buscando ${key} para remoção.`, [current.id], () => this.serialize());
    while (current && current.key !== key) {
      recorder.record('compare', `Comparando ${key} com ${current.key}.`, [current.id], () => this.serialize());
      current = key < current.key ? current.left : current.right;
    }

    if (!current) {
      recorder.record('not-found', `${key} não existe — nada a remover.`, [], () => this.serialize());
      return { value: false, steps: recorder.toArray() };
    }

    // Splay do nó alvo para a raiz.
    this.splay(current, recorder);
    recorder.record('remove-node', `${key} está na raiz — desconectando para remoção.`, [current.id], () => this.serialize());

    const left = current.left;
    const right = current.right;

    if (!left) {
      this.root = right;
      if (right) right.parent = null;
      recorder.record('change-root', right ? `Subárvore direita (raiz ${right.key}) se torna a nova raiz.` : 'Árvore ficou vazia.', right ? [right.id] : [], () => this.serialize());
    } else {
      left.parent = null;
      // Encontra o máximo da subárvore esquerda e o traz ao topo dela via splay.
      let maxNode = left;
      while (maxNode.right) maxNode = maxNode.right;
      this.splay(maxNode, recorder);
      maxNode.right = right;
      if (right) right.parent = maxNode;
      this.root = maxNode;
      recorder.record(
        'change-root',
        `Maior chave da subárvore esquerda (${maxNode.key}) trazida ao topo e reconectada com a subárvore direita — vira a nova raiz.`,
        [maxNode.id],
        () => this.serialize(),
      );
    }

    recorder.record('done', `Remoção de ${key} concluída.`, this.root ? [this.root.id] : [], () => this.serialize());
    return { value: true, steps: recorder.toArray() };
  }

  getSnapshot(): SplaySnapshot {
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
    const visited = new Set<string>();

    const visit = (node: SplayNode | null, min: number, max: number): void => {
      if (!node) return;
      if (visited.has(node.id)) {
        errors.push(`Ciclo detectado no nó ${node.id}`);
        return;
      }
      visited.add(node.id);
      if (node.key < min || node.key > max) {
        errors.push(`Violação de propriedade BST no nó ${node.key} (esperado entre ${min} e ${max}).`);
      }
      if (node.left && node.left.parent !== node) errors.push(`Ponteiro de pai inválido no filho esquerdo de ${node.key}.`);
      if (node.right && node.right.parent !== node) errors.push(`Ponteiro de pai inválido no filho direito de ${node.key}.`);
      visit(node.left, min, node.key);
      visit(node.right, node.key, max);
    };

    visit(this.root, -Infinity, Infinity);
    return { valid: errors.length === 0, errors };
  }
}
