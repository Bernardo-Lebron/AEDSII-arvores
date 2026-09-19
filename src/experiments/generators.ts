import type { DataPattern } from './types';

/** Gera `count` palavras pseudoaleatórias e únicas, de tamanho variável (5–10 caracteres). */
export function generateWords(count: number): string[] {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  const words = new Set<string>();
  while (words.size < count) {
    const length = 5 + Math.floor(Math.random() * 6);
    let word = '';
    for (let i = 0; i < length; i++) {
      word += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    words.add(word);
  }
  return [...words];
}

/** Gera `count` números inteiros únicos, no padrão solicitado. */
export function generateNumbers(count: number, pattern: DataPattern): number[] {
  if (pattern === 'sorted') {
    return Array.from({ length: count }, (_, i) => i);
  }
  if (pattern === 'reverse') {
    return Array.from({ length: count }, (_, i) => count - i);
  }
  // random: embaralha um intervalo maior que `count` para reduzir colisões
  const pool = Array.from({ length: count * 4 }, (_, i) => i);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

/** Gera `count` pontos 2D pseudoaleatórios únicos dentro de um intervalo. */
export function generatePoints(count: number): { x: number; y: number }[] {
  const seen = new Set<string>();
  const points: { x: number; y: number }[] = [];
  while (points.length < count) {
    const x = Math.floor(Math.random() * count * 4);
    const y = Math.floor(Math.random() * count * 4);
    const key = `${x},${y}`;
    if (seen.has(key)) continue;
    seen.add(key);
    points.push({ x, y });
  }
  return points;
}
