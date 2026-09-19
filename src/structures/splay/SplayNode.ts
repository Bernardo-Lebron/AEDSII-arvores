let counter = 0;
function nextId(): string {
  counter += 1;
  return `splay-node-${counter}`;
}

export class SplayNode {
  readonly id: string;
  key: number;
  left: SplayNode | null = null;
  right: SplayNode | null = null;
  parent: SplayNode | null = null;

  constructor(key: number) {
    this.id = nextId();
    this.key = key;
  }
}
