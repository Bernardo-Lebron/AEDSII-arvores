import { describe, it, expect, beforeEach } from 'vitest';
import { Patricia } from './Patricia';

describe('Patricia', () => {
  let tree: Patricia;

  beforeEach(() => {
    tree = new Patricia();
  });

  it('busca em árvore vazia retorna falso', () => {
    expect(tree.search('test').value).toBe(false);
  });

  it('insere e busca uma única chave', () => {
    tree.insert('test');
    expect(tree.search('test').value).toBe(true);
    expect(tree.search('te').value).toBe(false);
  });

  it('compacta uma única aresta para a primeira chave', () => {
    tree.insert('romane');
    const snap = tree.getSnapshot();
    const rootChildren = snap.nodes[snap.rootId].childrenIds;
    expect(rootChildren.length).toBe(1);
    expect(snap.nodes[rootChildren[0]].edgeLabel).toBe('romane');
  });

  it('divide arestas quando chaves divergem no meio (split)', () => {
    tree.insert('romane');
    tree.insert('romanus');
    // prefixo comum "roman", diverge em 'e' vs 'us'
    expect(tree.search('romane').value).toBe(true);
    expect(tree.search('romanus').value).toBe(true);
    expect(tree.validate().valid).toBe(true);
    const snap = tree.getSnapshot();
    const rootChild = snap.nodes[snap.nodes[snap.rootId].childrenIds[0]];
    expect(rootChild.edgeLabel).toBe('roman');
  });

  it('não trata como Trie simples: chaves com prefixo comum não criam 1 nó por caractere', () => {
    tree.insert('romane');
    tree.insert('romanus');
    tree.insert('romulus');
    const snap = tree.getSnapshot();
    // Deve haver bem menos nós do que caracteres totais (compactação real)
    expect(Object.keys(snap.nodes).length).toBeLessThan(10);
  });

  it('remove uma chave e compacta o restante corretamente', () => {
    tree.insert('romane');
    tree.insert('romanus');
    tree.remove('romane');
    expect(tree.search('romane').value).toBe(false);
    expect(tree.search('romanus').value).toBe(true);
    expect(tree.validate().valid).toBe(true);
  });

  it('remover chave inexistente não quebra a árvore', () => {
    tree.insert('abc');
    const result = tree.remove('xyz');
    expect(result.value).toBe(false);
    expect(tree.validate().valid).toBe(true);
  });

  it('lida com chave duplicada sem duplicar nós', () => {
    tree.insert('abc');
    tree.insert('abc');
    expect(tree.search('abc').value).toBe(true);
    expect(tree.validate().valid).toBe(true);
  });

  it('mantém invariantes após sequência maior de operações', () => {
    const words = ['romane', 'romanus', 'romulus', 'rubens', 'ruber', 'rubicon', 'rubicundus'];
    words.forEach((w) => tree.insert(w));
    tree.remove('rubicon');
    tree.remove('ruber');
    expect(tree.validate().valid).toBe(true);
    expect(tree.search('rubicundus').value).toBe(true);
    expect(tree.search('rubens').value).toBe(true);
    expect(tree.search('ruber').value).toBe(false);
  });
});
