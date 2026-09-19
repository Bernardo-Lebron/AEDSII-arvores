let nodeCounter = 0;
function nextId(): string {
  nodeCounter += 1;
  return `trie-node-${nodeCounter}`;
}

/**
 * Nó real da Trie. `children` é um Map ordenado por ordem de inserção de char;
 * ao serializar para snapshot, ordenamos alfabeticamente para uma visualização estável.
 */
export class TrieNode {
  readonly id: string;
  char: string;
  isEndOfWord: boolean;
  children: Map<string, TrieNode>;

  constructor(char: string) {
    this.id = nextId();
    this.char = char;
    this.isEndOfWord = false;
    this.children = new Map();
  }
}
