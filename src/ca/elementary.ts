/** Elementary cellular automata (Wolfram). Radius-1, two states, cyclic or zero-padded. */

export type SeedMode = "point" | "random" | "periodic" | "custom";

export type WolframClass = "I" | "II" | "III" | "IV";

export interface FamousRule {
  n: number;
  name: string;
  klass: WolframClass;
  blurb: string;
}

export const FAMOUS_RULES: FamousRule[] = [
  {
    n: 30,
    name: "Rule 30",
    klass: "III",
    blurb: "Chaotic from a single 1. Wolfram used it as a PRNG. The left edge looks nested; the bulk does not.",
  },
  {
    n: 54,
    name: "Rule 54",
    klass: "IV",
    blurb: "Particles and collisions. Complex, not random — class IV on a thin lattice.",
  },
  {
    n: 73,
    name: "Rule 73",
    klass: "II",
    blurb: "Stable domains separated by walls. Structure that does not travel.",
  },
  {
    n: 90,
    name: "Rule 90",
    klass: "III",
    blurb: "Left XOR right. A Sierpiński triangle. Additive: the lattice is a morphism.",
  },
  {
    n: 110,
    name: "Rule 110",
    klass: "IV",
    blurb: "Turing-complete (Cook, 2004). The smallest universal machine that is also a lattice.",
  },
  {
    n: 150,
    name: "Rule 150",
    klass: "III",
    blurb: "Left XOR self XOR right. Another additive fractal, denser than 90.",
  },
  {
    n: 184,
    name: "Rule 184",
    klass: "II",
    blurb: "Traffic. Particles hop right into empty cells. Conservation, not growth.",
  },
  {
    n: 18,
    name: "Rule 18",
    klass: "III",
    blurb: "A diluted Sierpiński. Nested voids.",
  },
];

export const CLASS_BLURB: Record<WolframClass, string> = {
  I: "Homogeneous. Everything dies or fills. Capacity collapses to a constant.",
  II: "Periodic or stable. Local structure, no long-range novelty.",
  III: "Chaotic or nested. The trace is large; whether it is dense depends on additivity.",
  IV: "Complex. Persistent particles. The candidate for a reconstructive machine.",
};

export function clampRule(n: number): number {
  return ((n | 0) % 256 + 256) % 256;
}

export function bitAt(rule: number, neighborhood: number): 0 | 1 {
  return ((rule >> neighborhood) & 1) as 0 | 1;
}

export function toggleBit(rule: number, neighborhood: number): number {
  return clampRule(rule ^ (1 << neighborhood));
}

/** Neighborhood index: 7 = 111 … 0 = 000. */
export function neighborhoods(): number[] {
  return [7, 6, 5, 4, 3, 2, 1, 0];
}

export function triple(n: number): [0 | 1, 0 | 1, 0 | 1] {
  return [((n >> 2) & 1) as 0 | 1, ((n >> 1) & 1) as 0 | 1, (n & 1) as 0 | 1];
}

export function step(row: Uint8Array, rule: number, wrap: boolean): Uint8Array {
  const n = row.length;
  const next = new Uint8Array(n);
  const at = (i: number): number => {
    if (i >= 0 && i < n) return row[i]!;
    if (wrap) return row[(i + n) % n]!;
    return 0;
  };
  for (let i = 0; i < n; i++) {
    const idx = (at(i - 1) << 2) | (at(i) << 1) | at(i + 1);
    next[i] = (rule >> idx) & 1;
  }
  return next;
}

export function evolve(
  rule: number,
  seed: Uint8Array,
  generations: number,
  wrap: boolean,
): Uint8Array[] {
  const t = Math.max(1, generations | 0);
  const rows: Uint8Array[] = [Uint8Array.from(seed)];
  for (let i = 1; i < t; i++) rows.push(step(rows[i - 1]!, rule, wrap));
  return rows;
}

export function pointSeed(width: number): Uint8Array {
  const w = Math.max(1, width | 0);
  const s = new Uint8Array(w);
  s[Math.floor(w / 2)] = 1;
  return s;
}

export function randomSeed(width: number, rng = lcg(20260910)): Uint8Array {
  const s = new Uint8Array(Math.max(1, width | 0));
  for (let i = 0; i < s.length; i++) s[i] = rng() < 0.5 ? 1 : 0;
  return s;
}

export function periodicSeed(width: number, motif = [1, 1, 0, 1, 0]): Uint8Array {
  const s = new Uint8Array(Math.max(1, width | 0));
  for (let i = 0; i < s.length; i++) s[i] = motif[i % motif.length] ? 1 : 0;
  return s;
}

export function hamming(row: Uint8Array): number {
  let n = 0;
  for (const b of row) if (b) n++;
  return n;
}

export function flatten(rows: Uint8Array[]): string {
  let out = "";
  for (const row of rows) {
    for (const b of row) out += b ? "1" : "0";
  }
  return out;
}

export function lastRowString(rows: Uint8Array[]): string {
  const row = rows.at(-1);
  if (!row) return "";
  let out = "";
  for (const b of row) out += b ? "1" : "0";
  return out;
}

/**
 * State is the 8-bit rule plus the seed bits we actually specified.
 * A point seed is one bit on a known background. A random seed is the whole row.
 */
export function caStateSize(seedBits: number): number {
  return 8 + Math.max(0, seedBits);
}

export function caCapacity(rows: Uint8Array[]): number {
  if (rows.length === 0) return 0;
  return rows.length * (rows[0]?.length ?? 0);
}

export function caDensity(rows: Uint8Array[], seedBits: number): number {
  const g = caStateSize(seedBits);
  const n = caCapacity(rows);
  return g === 0 ? 0 : n / g;
}

export function seedBitsFor(mode: SeedMode, seed: Uint8Array): number {
  if (mode === "point") return 1;
  if (mode === "periodic") return 5;
  return seed.length;
}

export function lcg(seed: number): () => number {
  let x = seed >>> 0;
  return () => {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    return x / 0x100000000;
  };
}

export function wolframClass(rule: number): WolframClass {
  const famous = FAMOUS_RULES.find((r) => r.n === rule);
  if (famous) return famous.klass;
  // Cheap recognizer for the two trivial attractors; else leave unclassified via III default.
  if (rule === 0 || rule === 255 || rule === 8 || rule === 32 || rule === 40 || rule === 128 || rule === 136 || rule === 160 || rule === 168) {
    return "I";
  }
  return "III";
}
