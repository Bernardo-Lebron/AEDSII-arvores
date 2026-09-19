import { describe, it, expect, beforeEach } from 'vitest';
import { Trie } from './Trie';

describe('Trie', () => {
  let trie: Trie;

  beforeEach(() => {
    trie = new Trie();
  });

  it('busca em árvore vazia retorna falso', () => {
    expect(trie.search('casa').value).toBe(false);
  });

  it('insere e busca uma única palavra', () => {
    trie.insert('casa');
    expect(trie.search('casa').value).toBe(true);
    expect(trie.search('cas').value).toBe(false);
  });

  it('compartilha prefixos entre palavras', () => {
    trie.insert('casa');
    trie.insert('carro');
    const snap = trie.getSnapshot();
    // raiz -> c é compartilhado, então só deve haver 1 nó para 'c'
    const rootChildren = snap.nodes[snap.rootId].childrenIds;
    expect(rootChildren.length).toBe(1);
  });

  it('ignora inserção de palavra vazia sem quebrar', () => {
    const result = trie.insert('');
    expect(result.value).toBeUndefined();
    expect(trie.validate().valid).toBe(true);
  });

  it('não duplica ao inserir a mesma palavra duas vezes', () => {
    trie.insert('dog');
    trie.insert('dog');
    expect(trie.wordsWithPrefix('dog')).toEqual(['dog']);
  });

  it('busca por prefixo retorna todas as palavras relacionadas', () => {
    ['cat', 'car', 'card', 'care', 'dog'].forEach((w) => trie.insert(w));
    expect(trie.wordsWithPrefix('car').sort()).toEqual(['car', 'card', 'care']);
    expect(trie.wordsWithPrefix('do').sort()).toEqual(['dog']);
    expect(trie.wordsWithPrefix('zzz')).toEqual([]);
  });

  it('remove uma palavra sem afetar outras que compartilham prefixo', () => {
    trie.insert('car');
    trie.insert('card');
    trie.remove('car');
    expect(trie.search('car').value).toBe(false);
    expect(trie.search('card').value).toBe(true);
  });

  it('poda nós órfãos após remoção', () => {
    trie.insert('cat');
    trie.remove('cat');
    const snap = trie.getSnapshot();
    expect(snap.nodes[snap.rootId].childrenIds.length).toBe(0);
  });

  it('remover palavra inexistente retorna falso e não quebra', () => {
    trie.insert('cat');
    const result = trie.remove('dog');
    expect(result.value).toBe(false);
    expect(trie.validate().valid).toBe(true);
  });

  it('mantém invariantes após sequência maior de operações', () => {
    const words = ['a', 'ao', 'ao vivo', 'amigo', 'amiga', 'amizade', 'casa', 'casar', 'casamento'];
    words.forEach((w) => trie.insert(w));
    trie.remove('amigo');
    trie.remove('ao');
    expect(trie.validate().valid).toBe(true);
    expect(trie.search('amiga').value).toBe(true);
    expect(trie.search('amigo').value).toBe(false);
    expect(trie.search('ao vivo').value).toBe(true);
  });
});
