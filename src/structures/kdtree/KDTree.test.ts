import { describe, it, expect, beforeEach } from 'vitest';
import { KDTree } from './KDTree';
import type { Point2D } from './types';

describe('KDTree', () => {
  let tree: KDTree;

  beforeEach(() => {
    tree = new KDTree();
  });

  it('busca em árvore vazia retorna falso', () => {
    expect(tree.search({ x: 1, y: 1 }).value).toBe(false);
  });

  it('insere e busca um único ponto', () => {
    tree.insert({ x: 30, y: 40 });
    expect(tree.search({ x: 30, y: 40 }).value).toBe(true);
    expect(tree.search({ x: 1, y: 1 }).value).toBe(false);
  });

  it('alterna corretamente o eixo de particionamento por nível', () => {
    const points = [
      { x: 30, y: 40 },
      { x: 5, y: 25 },
      { x: 10, y: 12 },
      { x: 70, y: 70 },
      { x: 50, y: 30 },
      { x: 35, y: 45 },
    ];
    points.forEach((p) => tree.insert(p));
    expect(tree.validate().valid).toBe(true);
    const snap = tree.getSnapshot();
    expect(snap.nodes[snap.rootId!].axis).toBe(0);
  });

  it('não duplica ponto já existente', () => {
    tree.insert({ x: 10, y: 10 });
    tree.insert({ x: 10, y: 10 });
    const snap = tree.getSnapshot();
    expect(Object.keys(snap.nodes).length).toBe(1);
  });

  it('encontra o vizinho mais próximo corretamente', () => {
    const points = [
      { x: 30, y: 40 },
      { x: 5, y: 25 },
      { x: 10, y: 12 },
      { x: 70, y: 70 },
      { x: 50, y: 30 },
      { x: 35, y: 45 },
    ];
    points.forEach((p) => tree.insert(p));
    const result = tree.nearestNeighbor({ x: 32, y: 41 }).value;
    expect(result.point).toEqual({ x: 30, y: 40 });
  });

  it('vizinho mais próximo em árvore vazia retorna null', () => {
    const result = tree.nearestNeighbor({ x: 1, y: 1 }).value;
    expect(result.point).toBeNull();
  });

  it('busca por região retorna apenas pontos dentro do retângulo', () => {
    const points = [
      { x: 30, y: 40 },
      { x: 5, y: 25 },
      { x: 10, y: 12 },
      { x: 70, y: 70 },
      { x: 50, y: 30 },
      { x: 35, y: 45 },
    ];
    points.forEach((p) => tree.insert(p));
    const result = tree.rangeSearch({ xMin: 0, xMax: 40, yMin: 0, yMax: 50 }).value;
    const expected = [
      { x: 30, y: 40 },
      { x: 5, y: 25 },
      { x: 10, y: 12 },
      { x: 35, y: 45 },
    ];
    expect(result.length).toBe(expected.length);
    expected.forEach((p) => expect(result).toContainEqual(p));
  });

  it('mantém invariantes de particionamento após várias inserções', () => {
    for (let i = 0; i < 30; i++) {
      tree.insert({ x: (i * 7) % 50, y: (i * 13) % 50 });
    }
    expect(tree.validate().valid).toBe(true);
  });

  it('remove a raiz de uma árvore com um único ponto, esvaziando a árvore', () => {
    tree.insert({ x: 10, y: 10 });
    const result = tree.remove({ x: 10, y: 10 });
    expect(result.value).toBe(true);
    expect(tree.search({ x: 10, y: 10 }).value).toBe(false);
    expect(tree.getSnapshot().rootId).toBeNull();
  });

  it('remoção de ponto inexistente retorna falso e não altera a árvore', () => {
    const points = [
      { x: 30, y: 40 },
      { x: 5, y: 25 },
      { x: 70, y: 70 },
    ];
    points.forEach((p) => tree.insert(p));
    const before = tree.nodeCount();
    const result = tree.remove({ x: 99, y: 99 });
    expect(result.value).toBe(false);
    expect(tree.nodeCount()).toBe(before);
  });

  it('remove uma folha sem afetar os demais pontos', () => {
    const points = [
      { x: 30, y: 40 },
      { x: 5, y: 25 },
      { x: 10, y: 12 },
      { x: 70, y: 70 },
      { x: 50, y: 30 },
      { x: 35, y: 45 },
    ];
    points.forEach((p) => tree.insert(p));
    expect(tree.remove({ x: 10, y: 12 }).value).toBe(true);
    expect(tree.search({ x: 10, y: 12 }).value).toBe(false);
    points
      .filter((p) => !(p.x === 10 && p.y === 12))
      .forEach((p) => expect(tree.search(p).value).toBe(true));
    expect(tree.validate().valid).toBe(true);
  });

  it('remove um nó interno com filho direito, preservando as invariantes', () => {
    const points = [
      { x: 30, y: 40 },
      { x: 5, y: 25 },
      { x: 10, y: 12 },
      { x: 70, y: 70 },
      { x: 50, y: 30 },
      { x: 35, y: 45 },
    ];
    points.forEach((p) => tree.insert(p));
    expect(tree.remove({ x: 30, y: 40 }).value).toBe(true);
    expect(tree.search({ x: 30, y: 40 }).value).toBe(false);
    points
      .filter((p) => !(p.x === 30 && p.y === 40))
      .forEach((p) => expect(tree.search(p).value).toBe(true));
    expect(tree.validate().valid).toBe(true);
  });

  it('remove um nó com apenas filho esquerdo, promovendo a subárvore corretamente', () => {
    // Construída para que um nó específico tenha apenas filho esquerdo.
    const points = [
      { x: 50, y: 50 },
      { x: 20, y: 80 },
      { x: 10, y: 90 },
    ];
    points.forEach((p) => tree.insert(p));
    expect(tree.remove({ x: 20, y: 80 }).value).toBe(true);
    expect(tree.search({ x: 20, y: 80 }).value).toBe(false);
    expect(tree.search({ x: 50, y: 50 }).value).toBe(true);
    expect(tree.search({ x: 10, y: 90 }).value).toBe(true);
    expect(tree.validate().valid).toBe(true);
  });

  it('mantém invariantes após remoções sucessivas em uma árvore maior', () => {
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < 40; i++) {
      points.push({ x: (i * 7) % 50, y: (i * 13) % 50 });
    }
    points.forEach((p) => tree.insert(p));

    const toRemove = points.filter((_, i) => i % 3 === 0);
    toRemove.forEach((p) => {
      expect(tree.remove(p).value).toBe(true);
    });

    expect(tree.validate().valid).toBe(true);
    toRemove.forEach((p) => expect(tree.search(p).value).toBe(false));
    points
      .filter((p) => !toRemove.includes(p))
      .forEach((p) => expect(tree.search(p).value).toBe(true));
  });

  it('sobrevive a um ciclo aleatório de inserções e remoções sem violar invariantes', () => {
    const alive = new Map<string, Point2D>();
    const key = (p: Point2D) => `${p.x},${p.y}`;
    let seed = 42;
    const rand = () => {
      // PRNG determinístico simples, só para reprodutibilidade do teste.
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };

    for (let i = 0; i < 200; i++) {
      const shouldRemove = alive.size > 0 && rand() < 0.4;
      if (shouldRemove) {
        const keys = [...alive.keys()];
        const k = keys[Math.floor(rand() * keys.length)];
        const p = alive.get(k)!;
        expect(tree.remove(p).value).toBe(true);
        alive.delete(k);
      } else {
        const p = { x: Math.floor(rand() * 30), y: Math.floor(rand() * 30) };
        if (alive.has(key(p))) continue;
        tree.insert(p);
        alive.set(key(p), p);
      }
      expect(tree.validate().valid).toBe(true);
      expect(tree.nodeCount()).toBe(alive.size);
    }

    alive.forEach((p) => expect(tree.search(p).value).toBe(true));
  });

  it('nodeCount reflete o número de pontos após inserções e remoções', () => {
    expect(tree.nodeCount()).toBe(0);
    tree.insert({ x: 1, y: 1 });
    tree.insert({ x: 2, y: 2 });
    tree.insert({ x: 3, y: 3 });
    expect(tree.nodeCount()).toBe(3);
    tree.remove({ x: 2, y: 2 });
    expect(tree.nodeCount()).toBe(2);
  });
});
