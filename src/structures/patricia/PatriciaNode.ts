let counter = 0;
function nextId(): string {
  counter += 1;
  return `patricia-node-${counter}`;
}

export class PatriciaNode {
  readonly id: string;
  /** rótulo compactado desta aresta (string, não caractere único) */
  edgeLabel: string;
  isEndOfWord: boolean;
  /** indexado pelo primeiro caractere do edgeLabel do filho */
  children: Map<string, PatriciaNode>;

  constructor(edgeLabel: string) {
    this.id = nextId();
    this.edgeLabel = edgeLabel;
    this.isEndOfWord = false;
    this.children = new Map();
  }
}

/** Tamanho do prefixo comum entre duas strings. */
export function commonPrefixLength(a: string, b: string): number {
  const max = Math.min(a.length, b.length);
  let i = 0;
  while (i < max && a[i] === b[i]) i++;
  return i;
}
