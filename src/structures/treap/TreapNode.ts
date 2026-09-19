let counter = 0;
function nextId(): string {
  counter += 1;
  return `treap-node-${counter}`;
}

export class TreapNode {
  readonly id: string;
  key: number;
  priority: number;
  left: TreapNode | null = null;
  right: TreapNode | null = null;
  parent: TreapNode | null = null;

  constructor(key: number, priority: number) {
    this.id = nextId();
    this.key = key;
    this.priority = priority;
  }
}
