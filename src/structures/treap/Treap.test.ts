import { describe, it, expect, beforeEach } from 'vitest';
import { Treap } from './Treap';

describe('Treap', () => {
  let treap: Treap;

  beforeEach(() => {
    treap = new Treap();
  });

  it('busca em árvore vazia retorna falso', () => {
    expect(treap.search(10).value).toBe(false);
  });

  it('insere um único elemento', () => {
    treap.insert(50, 80);
    expect(treap.search(50).value).toBe(true);
    expect(treap.validate().valid).toBe(true);
  });

  it('mantém propriedade de heap quando prioridade força rotação', () => {
    // 50 inserido primeiro com prioridade baixa; 30 depois com prioridade alta
    // deve forçar rotação para que 30 suba (violação de heap corrigida).
    treap.insert(50, 10);
    treap.insert(30, 90);
    const snap = treap.getSnapshot();
    expect(snap.nodes[snap.rootId!].key).toBe(30);
    expect(treap.validate().valid).toBe(true);
  });

  it('mantém propriedade de BST mesmo após várias rotações', () => {
    treap.insert(50, 10);
    treap.insert(30, 90);
    treap.insert(70, 95);
    treap.insert(20, 50);
    treap.insert(40, 60);
    expect(treap.validate().valid).toBe(true);
    [50, 30, 70, 20, 40].forEach((k) => expect(treap.search(k).value).toBe(true));
  });

  it('não insere chave duplicada', () => {
    treap.insert(10, 50);
    treap.insert(10, 99);
    const snap = treap.getSnapshot();
    expect(Object.keys(snap.nodes).length).toBe(1);
  });

  it('remove a raiz corretamente', () => {
    treap.insert(50, 90);
    treap.insert(30, 50);
    treap.insert(70, 40);
    const result = treap.remove(50);
    expect(result.value).toBe(true);
    expect(treap.search(50).value).toBe(false);
    expect(treap.validate().valid).toBe(true);
    expect(treap.search(30).value).toBe(true);
    expect(treap.search(70).value).toBe(true);
  });

  it('remover elemento inexistente retorna falso', () => {
    treap.insert(10, 50);
    expect(treap.remove(999).value).toBe(false);
  });

  it('remover o único elemento esvazia a árvore', () => {
    treap.insert(5, 50);
    treap.remove(5);
    expect(treap.getSnapshot().rootId).toBeNull();
  });

  it('gera prioridade automática quando não especificada', () => {
    treap.insert(1);
    const snap = treap.getSnapshot();
    expect(snap.nodes[snap.rootId!].priority).toBeGreaterThanOrEqual(0);
  });

  it('mantém invariantes após sequência maior de operações com prioridades aleatórias', () => {
    const keys = [50, 20, 80, 10, 30, 70, 90, 5, 15, 25, 35];
    keys.forEach((k) => treap.insert(k));
    treap.remove(20);
    treap.remove(90);
    treap.insert(100);
    expect(treap.validate().valid).toBe(true);
  });
});
