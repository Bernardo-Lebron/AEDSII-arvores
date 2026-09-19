import { describe, it, expect, beforeEach } from 'vitest';
import { SplayTree } from './SplayTree';

describe('SplayTree', () => {
  let tree: SplayTree;

  beforeEach(() => {
    tree = new SplayTree();
  });

  it('busca em árvore vazia retorna falso', () => {
    expect(tree.search(10).value).toBe(false);
  });

  it('insere um único elemento e ele vira raiz', () => {
    tree.insert(50);
    const snap = tree.getSnapshot();
    expect(snap.rootId).not.toBeNull();
    expect(snap.nodes[snap.rootId!].key).toBe(50);
  });

  it('nó buscado é trazido para a raiz (splay)', () => {
    [50, 30, 70, 20, 40, 60, 80].forEach((k) => tree.insert(k));
    tree.search(20);
    const snap = tree.getSnapshot();
    expect(snap.nodes[snap.rootId!].key).toBe(20);
  });

  it('nó inserido é trazido para a raiz', () => {
    [50, 30, 70].forEach((k) => tree.insert(k));
    tree.insert(10);
    const snap = tree.getSnapshot();
    expect(snap.nodes[snap.rootId!].key).toBe(10);
  });

  it('não insere chave duplicada, mas a traz ao topo', () => {
    [50, 30, 70].forEach((k) => tree.insert(k));
    tree.insert(30);
    const snap = tree.getSnapshot();
    expect(Object.keys(snap.nodes).length).toBe(3);
    expect(snap.nodes[snap.rootId!].key).toBe(30);
  });

  it('remove a raiz corretamente e mantém propriedade BST', () => {
    [50, 30, 70, 20, 40, 60, 80].forEach((k) => tree.insert(k));
    const result = tree.remove(50);
    expect(result.value).toBe(true);
    expect(tree.search(50).value).toBe(false);
    expect(tree.validate().valid).toBe(true);
  });

  it('remover elemento inexistente retorna falso', () => {
    tree.insert(10);
    expect(tree.remove(999).value).toBe(false);
  });

  it('remover o único elemento esvazia a árvore', () => {
    tree.insert(5);
    tree.remove(5);
    expect(tree.getSnapshot().rootId).toBeNull();
  });

  it('mantém invariante BST após sequência maior de operações', () => {
    const keys = [50, 20, 80, 10, 30, 70, 90, 5, 15, 25, 35];
    keys.forEach((k) => tree.insert(k));
    tree.search(90);
    tree.remove(20);
    tree.remove(5);
    tree.insert(100);
    expect(tree.validate().valid).toBe(true);
    keys.filter((k) => k !== 20 && k !== 5).forEach((k) => expect(tree.search(k).value).toBe(true));
  });
});
