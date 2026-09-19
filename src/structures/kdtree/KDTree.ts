import { StepRecorder, newOperationId } from '../../core/steps';
import { KDNode, distance, pointAxisValue } from './KDNode';
import type {
  KDOperationResult,
  KDSnapshot,
  KDSnapshotNode,
  NearestNeighborResult,
  Point2D,
  RangeRect,
} from './types';

/**
 * KD-Tree para pontos bidimensionais. Cada nível alterna a dimensão de
 * particionamento: nível 0 → eixo X, nível 1 → eixo Y, nível 2 → eixo X, etc.
 * Convenção: valores estritamente MENORES que o nó vão para a esquerda;
 * valores MAIORES OU IGUAIS vão para a direita.
 */
export class KDTree {
  private root: KDNode | null = null;

  private serialize(): KDSnapshot {
    const nodes: Record<string, KDSnapshotNode> = {};
    const visit = (node: KDNode | null): void => {
      if (!node) return;
      nodes[node.id] = {
        id: node.id,
        point: node.point,
        axis: node.axis,
        leftId: node.left?.id ?? null,
        rightId: node.right?.id ?? null,
      };
      visit(node.left);
      visit(node.right);
    };
    visit(this.root);
    return { nodes, rootId: this.root?.id ?? null };
  }

  insert(point: Point2D, recordSteps = true): KDOperationResult {
    const recorder = new StepRecorder<KDSnapshot>(newOperationId('kd-insert'), { enabled: recordSteps });

    if (!this.root) {
      this.root = new KDNode(point, 0);
      recorder.record(
        'create-node',
        `Árvore vazia — (${point.x}, ${point.y}) se torna a raiz, particionando pelo eixo X.`,
        [this.root.id],
        () => this.serialize(),
      );
      recorder.record('done', 'Inserção concluída.', [this.root.id], () => this.serialize());
      return { value: undefined, steps: recorder.toArray() };
    }

    let current: KDNode = this.root;
    recorder.record('start', `Iniciando inserção de (${point.x}, ${point.y}) a partir da raiz.`, [current.id], () => this.serialize());

    for (;;) {
      if (current.point.x === point.x && current.point.y === point.y) {
        recorder.record('no-op', `Ponto (${point.x}, ${point.y}) já existe — inserção ignorada.`, [current.id], () => this.serialize());
        return { value: undefined, steps: recorder.toArray() };
      }

      const axisName = current.axis === 0 ? 'X' : 'Y';
      const pointValue = pointAxisValue(point, current.axis);
      const nodeValue = current.axisValue();
      recorder.record(
        'compare',
        `Comparando eixo ${axisName}: ponto=${pointValue} vs nó=(${current.point.x}, ${current.point.y}) [${nodeValue}].`,
        [current.id],
        () => this.serialize(),
      );

      const goLeft = pointValue < nodeValue;
      const childAxis: 0 | 1 = current.axis === 0 ? 1 : 0;

      if (goLeft) {
        if (!current.left) {
          const created = new KDNode(point, childAxis);
          current.left = created;
          recorder.record(
            'axis-partition',
            `${pointValue} < ${nodeValue} no eixo ${axisName} — criando filho esquerdo (${point.x}, ${point.y}), agora particionando pelo eixo ${childAxis === 0 ? 'X' : 'Y'}.`,
            [current.id, created.id],
            () => this.serialize(),
          );
          break;
        }
        current = current.left;
      } else {
        if (!current.right) {
          const created = new KDNode(point, childAxis);
          current.right = created;
          recorder.record(
            'axis-partition',
            `${pointValue} >= ${nodeValue} no eixo ${axisName} — criando filho direito (${point.x}, ${point.y}), agora particionando pelo eixo ${childAxis === 0 ? 'X' : 'Y'}.`,
            [current.id, created.id],
            () => this.serialize(),
          );
          break;
        }
        current = current.right;
      }
    }

    recorder.record('done', 'Inserção concluída.', [], () => this.serialize());
    return { value: undefined, steps: recorder.toArray() };
  }

  search(point: Point2D, recordSteps = true): KDOperationResult<boolean> {
    const recorder = new StepRecorder<KDSnapshot>(newOperationId('kd-search'), { enabled: recordSteps });
    let current = this.root;
    recorder.record('start', `Buscando (${point.x}, ${point.y}).`, current ? [current.id] : [], () => this.serialize());

    while (current) {
      recorder.record('compare', `Verificando nó (${current.point.x}, ${current.point.y}).`, [current.id], () => this.serialize());
      if (current.point.x === point.x && current.point.y === point.y) {
        recorder.record('found', 'Ponto encontrado.', [current.id], () => this.serialize());
        return { value: true, steps: recorder.toArray() };
      }
      const pointValue = pointAxisValue(point, current.axis);
      current = pointValue < current.axisValue() ? current.left : current.right;
    }

    recorder.record('not-found', 'Ponto não encontrado.', [], () => this.serialize());
    return { value: false, steps: recorder.toArray() };
  }

  nearestNeighbor(target: Point2D, recordSteps = true): KDOperationResult<NearestNeighborResult> {
    const recorder = new StepRecorder<KDSnapshot>(newOperationId('kd-nearest'), { enabled: recordSteps });

    if (!this.root) {
      recorder.record('not-found', 'Árvore vazia.', [], () => this.serialize());
      return { value: { point: null, distance: null }, steps: recorder.toArray() };
    }

    recorder.record('start', `Buscando o vizinho mais próximo de (${target.x}, ${target.y}).`, [this.root.id], () => this.serialize());

    let best: { point: Point2D; distance: number; nodeId: string } | null = null;

    const visit = (node: KDNode | null): void => {
      if (!node) return;
      const d = distance(node.point, target);
      recorder.record(
        'compare',
        `Distância até (${node.point.x}, ${node.point.y}) = ${d.toFixed(2)}.`,
        [node.id],
        () => this.serialize(),
      );

      if (!best || d < best.distance) {
        best = { point: node.point, distance: d, nodeId: node.id };
        recorder.record('found', `Novo melhor candidato: (${node.point.x}, ${node.point.y}) a distância ${d.toFixed(2)}.`, [node.id], () => this.serialize());
      }

      const targetValue = pointAxisValue(target, node.axis);
      const nodeValue = node.axisValue();
      const goLeftFirst = targetValue < nodeValue;
      const primary = goLeftFirst ? node.left : node.right;
      const secondary = goLeftFirst ? node.right : node.left;

      visit(primary);

      const axisDistance = Math.abs(targetValue - nodeValue);
      if (!best || axisDistance < best.distance) {
        recorder.record(
          'axis-partition',
          `Distância ao plano de corte (${axisDistance.toFixed(2)}) é menor que o melhor raio atual — é preciso verificar o outro lado também.`,
          [node.id],
          () => this.serialize(),
        );
        visit(secondary);
      } else {
        recorder.record(
          'no-op',
          `Distância ao plano de corte (${axisDistance.toFixed(2)}) já é maior que o melhor raio atual — poda do outro lado da árvore.`,
          [node.id],
          () => this.serialize(),
        );
      }
    };

    visit(this.root);

    const finalBest = best as { point: Point2D; distance: number; nodeId: string } | null;
    recorder.record(
      'done',
      finalBest ? `Vizinho mais próximo: (${finalBest.point.x}, ${finalBest.point.y}).` : 'Nenhum ponto encontrado.',
      finalBest ? [finalBest.nodeId] : [],
      () => this.serialize(),
    );

    return {
      value: finalBest ? { point: finalBest.point, distance: finalBest.distance } : { point: null, distance: null },
      steps: recorder.toArray(),
    };
  }

  rangeSearch(rect: RangeRect, recordSteps = true): KDOperationResult<Point2D[]> {
    const recorder = new StepRecorder<KDSnapshot>(newOperationId('kd-range'), { enabled: recordSteps });
    const results: Point2D[] = [];

    recorder.record(
      'start',
      `Buscando pontos na região X∈[${rect.xMin}, ${rect.xMax}], Y∈[${rect.yMin}, ${rect.yMax}].`,
      this.root ? [this.root.id] : [],
      () => this.serialize(),
    );

    const visit = (node: KDNode | null): void => {
      if (!node) return;

      const inside = node.point.x >= rect.xMin && node.point.x <= rect.xMax && node.point.y >= rect.yMin && node.point.y <= rect.yMax;
      recorder.record(
        inside ? 'found' : 'compare',
        inside
          ? `Ponto (${node.point.x}, ${node.point.y}) está dentro da região — incluído no resultado.`
          : `Ponto (${node.point.x}, ${node.point.y}) está fora da região.`,
        [node.id],
        () => this.serialize(),
      );
      if (inside) results.push(node.point);

      const isXAxis = node.axis === 0;
      const nodeValue = node.axisValue();
      const rectMin = isXAxis ? rect.xMin : rect.yMin;
      const rectMax = isXAxis ? rect.xMax : rect.yMax;

      if (rectMin < nodeValue) visit(node.left);
      if (rectMax >= nodeValue) visit(node.right);
    };

    visit(this.root);
    recorder.record('done', `Busca por região concluída — ${results.length} ponto(s) encontrado(s).`, [], () => this.serialize());
    return { value: results, steps: recorder.toArray() };
  }

  /**
   * Remove um ponto da KD-Tree, seguindo o algoritmo clássico de Bentley (1975).
   *
   * Diferente de uma BST comum, aqui não basta pegar "o menor da subárvore
   * direita" — a comparação tem que respeitar o EIXO de particionamento do nó
   * removido, não a ordem natural dos números. Por isso a remoção usa duas
   * fases:
   *
   *  1. Se o nó tem filho direito: encontra o ponto de valor mínimo, no eixo
   *     do nó, dentro da subárvore direita (`findMin`). Esse ponto substitui
   *     o nó removido, preservando as invariantes de particionamento — e o
   *     antigo nó-mínimo é removido recursivamente da subárvore direita.
   *  2. Se não há filho direito mas há filho esquerdo: o mesmo raciocínio é
   *     aplicado sobre a subárvore esquerda, que é então promovida a
   *     subárvore direita (KD-Tree não distingue esquerda "menor que" de
   *     forma estrita como uma BST — a convenção adotada nesta implementação
   *     tolera valores iguais à direita, o que torna essa promoção segura).
   *  3. Nó-folha: remoção direta.
   *
   * Essa é justamente a razão pela qual muitas implementações de KD-Tree
   * evitam remoção "verdadeira" e preferem marcação lógica (soft-delete) —
   * o custo de encontrar o mínimo por eixo é O(√n) amortizado em árvores
   * balanceadas, e o rebalanceamento por remoções sucessivas não é garantido.
   */
  remove(point: Point2D, recordSteps = true): KDOperationResult<boolean> {
    const recorder = new StepRecorder<KDSnapshot>(newOperationId('kd-remove'), { enabled: recordSteps });

    recorder.record(
      'start',
      `Buscando (${point.x}, ${point.y}) para remoção.`,
      this.root ? [this.root.id] : [],
      () => this.serialize(),
    );

    /** Ponto de menor valor no eixo `axis`, dentro da subárvore `node`. */
    const findMin = (node: KDNode | null, axis: 0 | 1): KDNode | null => {
      if (!node) return null;
      if (node.axis === axis) {
        return node.left ? findMin(node.left, axis) : node;
      }
      const candidates = [node, findMin(node.left, axis), findMin(node.right, axis)].filter(
        (n): n is KDNode => n !== null,
      );
      return candidates.reduce((min, n) => (pointAxisValue(n.point, axis) < pointAxisValue(min.point, axis) ? n : min));
    };

    let removed = false;

    // `target` é o ponto que esta chamada precisa apagar da subárvore `node`.
    // É PARAMETRIZADO (não fechado sobre `point`) porque, ao substituir um nó
    // pelo seu sucessor, o que precisa ser removido recursivamente da
    // subárvore não é mais o ponto original — é o ponto do próprio sucessor,
    // na sua posição antiga.
    const removeRec = (node: KDNode | null, target: Point2D): KDNode | null => {
      if (!node) return null;

      recorder.record('compare', `Verificando nó (${node.point.x}, ${node.point.y}).`, [node.id], () => this.serialize());

      if (node.point.x !== target.x || node.point.y !== target.y) {
        const axisName = node.axis === 0 ? 'X' : 'Y';
        const targetValue = pointAxisValue(target, node.axis);
        const goLeft = targetValue < node.axisValue();
        recorder.record(
          'axis-partition',
          `(${target.x}, ${target.y}) ≠ nó atual — comparando eixo ${axisName}, descendo para a ${goLeft ? 'esquerda' : 'direita'}.`,
          [node.id],
          () => this.serialize(),
        );
        if (goLeft) {
          node.left = removeRec(node.left, target);
        } else {
          node.right = removeRec(node.right, target);
        }
        return node;
      }

      if (target.x === point.x && target.y === point.y) removed = true;

      if (node.right) {
        const successor = findMin(node.right, node.axis)!;
        const successorOriginalPoint = successor.point;
        recorder.record(
          'found',
          `Nó (${target.x}, ${target.y}) encontrado. Substituindo pelo mínimo da subárvore direita no eixo ${node.axis === 0 ? 'X' : 'Y'}: (${successor.point.x}, ${successor.point.y}).`,
          [node.id, successor.id],
          () => this.serialize(),
        );
        node.point = successorOriginalPoint;
        node.right = removeRec(node.right, successorOriginalPoint);
        recorder.record(
          'update-pointer',
          `(${node.point.x}, ${node.point.y}) ocupa a posição do nó removido; subárvore direita reorganizada.`,
          [node.id],
          () => this.serialize(),
        );
        return node;
      }

      if (node.left) {
        const successor = findMin(node.left, node.axis)!;
        const successorOriginalPoint = successor.point;
        recorder.record(
          'found',
          `Nó (${target.x}, ${target.y}) encontrado, sem filho direito. Substituindo pelo mínimo da subárvore esquerda no eixo ${node.axis === 0 ? 'X' : 'Y'}: (${successor.point.x}, ${successor.point.y}), que passa a ser a nova subárvore direita.`,
          [node.id, successor.id],
          () => this.serialize(),
        );
        node.point = successorOriginalPoint;
        node.right = removeRec(node.left, successorOriginalPoint);
        node.left = null;
        recorder.record(
          'update-pointer',
          `(${node.point.x}, ${node.point.y}) ocupa a posição do nó removido; subárvore antiga (esquerda) promovida a subárvore direita.`,
          [node.id],
          () => this.serialize(),
        );
        return node;
      }

      recorder.record('remove-node', `Nó-folha (${node.point.x}, ${node.point.y}) removido diretamente.`, [], () => this.serialize());
      return null;
    };

    this.root = removeRec(this.root, point);

    if (!removed) {
      recorder.record('not-found', `Ponto (${point.x}, ${point.y}) não encontrado — nada a remover.`, [], () => this.serialize());
      return { value: false, steps: recorder.toArray() };
    }

    recorder.record('done', 'Remoção concluída.', [], () => this.serialize());
    return { value: true, steps: recorder.toArray() };
  }

  getSnapshot(): KDSnapshot {
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
    const visit = (node: KDNode | null, expectedAxis: 0 | 1): void => {
      if (!node) return;
      if (node.axis !== expectedAxis) {
        errors.push(`Nó (${node.point.x}, ${node.point.y}) deveria particionar pelo eixo ${expectedAxis} mas usa ${node.axis}.`);
      }
      if (node.left && pointAxisValue(node.left.point, node.axis) >= node.axisValue()) {
        errors.push(`Filho esquerdo de (${node.point.x}, ${node.point.y}) viola o particionamento (deveria ser menor no eixo ${node.axis}).`);
      }
      if (node.right && pointAxisValue(node.right.point, node.axis) < node.axisValue()) {
        errors.push(`Filho direito de (${node.point.x}, ${node.point.y}) viola o particionamento (deveria ser >= no eixo ${node.axis}).`);
      }
      const nextAxis: 0 | 1 = node.axis === 0 ? 1 : 0;
      visit(node.left, nextAxis);
      visit(node.right, nextAxis);
    };
    visit(this.root, 0);
    return { valid: errors.length === 0, errors };
  }
}
