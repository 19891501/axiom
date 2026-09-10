import { ALGORITHMS } from "./algorithms";
import type { CompressionResult } from "./grammar";

export type RegimeId = "tile" | "unary" | "nested" | "fibonacci" | "random";

export interface Regime {
  id: RegimeId;
  name: string;
  blurb: string;
  xLabel: string;
  boundLabel?: string;
}

export interface SweepSample {
  d: number;
  g: number;
  ok: boolean;
}

export interface SweepPoint {
  scale: number;
  n: number;
  text: string;
  label: string;
  bound: number | null;
  byAlg: Partial<Record<string, SweepSample>>;
}

export interface Sweep {
  regime: Regime;
  points: SweepPoint[];
}

export const REGIMES: Regime[] = [
  {
    id: "tile",
    name: "Pure tile",
    blurb: "The motif abc, copied k times. Hierarchical grammars should grow like n / log n. RLE cannot see a period greater than 1.",
    xLabel: "copies k",
    boundLabel: "hierarchy n / (p + 2⌈log₂ k⌉)",
  },
  {
    id: "unary",
    name: "Unary run",
    blurb: "A single symbol repeated. RLE’s home ground — and a warning about the metric: a count costs one symbol, not log n bits.",
    xLabel: "length n",
  },
  {
    id: "nested",
    name: "Nested phrases",
    blurb: "Phrases inside phrases. Sequitur’s long right-hand sides win. Bisection, which only cuts in half, mostly fails.",
    xLabel: "inner copies",
  },
  {
    id: "fibonacci",
    name: "Fibonacci word",
    blurb: "No tandem run longer than two. Structure without tiles. Density still grows, because a morphism is a grammar.",
    xLabel: "generation",
  },
  {
    id: "random",
    name: "Incompressible",
    blurb: "The ceiling of the string itself. K(s) ≈ n, so D cannot leave 1, at any length, for any algorithm.",
    xLabel: "length n",
  },
];

export const REGIME_BY_ID: Record<RegimeId, Regime> = Object.fromEntries(
  REGIMES.map((r) => [r.id, r]),
) as Record<RegimeId, Regime>;

const SKIP_LONGEST_ABOVE = 64;
const SKIP_BISECT_ABOVE = 220;

function fibWord(gen: number): string {
  let a = "a";
  let b = "ab";
  if (gen <= 0) return a;
  if (gen === 1) return b;
  for (let i = 2; i <= gen; i++) {
    const t = b + a;
    a = b;
    b = t;
  }
  return b;
}

function lcg(seed: number, n: number): string {
  let x = seed >>> 0;
  let out = "";
  for (let i = 0; i < n; i++) {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    out += String.fromCharCode(97 + (x % 26));
  }
  return out;
}

function sampleOf(r: CompressionResult): SweepSample {
  return { d: r.density, g: r.grammarSize, ok: r.ok };
}

function runPoint(text: string): Partial<Record<string, SweepSample>> {
  const n = [...text].length;
  const byAlg: Partial<Record<string, SweepSample>> = {};
  for (const alg of ALGORITHMS) {
    if (alg.id === "longest" && n > SKIP_LONGEST_ABOVE) continue;
    if (alg.id === "bisection" && n > SKIP_BISECT_ABOVE) continue;
    byAlg[alg.id] = sampleOf(alg.run(text));
  }
  return byAlg;
}

function tileBound(k: number, period: number): number {
  if (k < 2) return 1;
  const g = period + 2 * Math.ceil(Math.log2(k));
  return (period * k) / g;
}

function buildPoints(
  scales: { scale: number; text: string; label: string; bound: number | null }[],
): SweepPoint[] {
  return scales.map((s) => ({
    scale: s.scale,
    n: [...s.text].length,
    text: s.text,
    label: s.label,
    bound: s.bound,
    byAlg: runPoint(s.text),
  }));
}

const cache = new Map<RegimeId, Sweep>();

export function getSweep(id: RegimeId): Sweep {
  const hit = cache.get(id);
  if (hit) return hit;
  const regime = REGIME_BY_ID[id];
  let points: SweepPoint[];
  switch (id) {
    case "tile":
      points = buildPoints(
        [1, 2, 3, 4, 8, 16, 32, 64].map((k) => ({
          scale: k,
          text: "abc".repeat(k),
          label: `${k}×`,
          bound: tileBound(k, 3),
        })),
      );
      break;
    case "unary":
      points = buildPoints(
        [4, 8, 16, 32, 64, 128].map((n) => ({
          scale: n,
          text: "a".repeat(n),
          label: String(n),
          bound: n / 2,
        })),
      );
      break;
    case "nested":
      points = buildPoints(
        [1, 2, 3, 4, 6, 8].map((k) => {
          const inner = "aaab".repeat(k);
          return {
            scale: k,
            text: (inner + "xy").repeat(3),
            label: `${k}×`,
            bound: null,
          };
        }),
      );
      break;
    case "fibonacci":
      points = buildPoints(
        [4, 6, 8, 10, 12].map((g) => ({
          scale: g,
          text: fibWord(g),
          label: `F${g}`,
          bound: null,
        })),
      );
      break;
    case "random":
      points = buildPoints(
        [12, 24, 48, 96, 180].map((n) => ({
          scale: n,
          text: lcg(20260910, n),
          label: String(n),
          bound: 1,
        })),
      );
      break;
  }
  const sweep = { regime, points };
  cache.set(id, sweep);
  return sweep;
}

export function bestOf(point: SweepPoint): { id: string; d: number; g: number } {
  let best = { id: "literal", d: 1, g: point.n };
  for (const [id, s] of Object.entries(point.byAlg)) {
    if (!s) continue;
    if (s.d > best.d) best = { id, d: s.d, g: s.g };
  }
  return best;
}

export const BREAKS: { id: string; ceiling: string; breaks: string }[] = [
  {
    id: "literal",
    ceiling: "D ≡ 1",
    breaks: "By construction. It is the storage baseline, not a compressor.",
  },
  {
    id: "rle",
    ceiling: "D = n/2 on a run; D = ½ on a run-free string",
    breaks: "Any period greater than 1. The tile abc^k is a perfect negative.",
  },
  {
    id: "lz78",
    ceiling: "Slow log-growth on tiles; D < 1 on noise (phrase tax)",
    breaks: "Nested reuse. A phrase is used as a prefix, not as a named constituent.",
  },
  {
    id: "lzw",
    ceiling: "Same family as LZ78, plus an alphabet table",
    breaks: "Short strings — the 256-entry seed already costs more than n.",
  },
  {
    id: "bpe",
    ceiling: "Re-Pair stopped at 40 merges",
    breaks: "When the structure needs more than 40 pairings. The cap is the theory.",
  },
  {
    id: "sequitur",
    ceiling: "n / log n on hierarchical copies; long RHS on nested phrases",
    breaks: "Not in this lab at these sizes. The remaining gap is the NP-hard smallest grammar.",
  },
  {
    id: "repair",
    ceiling: "n / log n, with a binary-rule tax versus Sequitur",
    breaks: "Long undivided phrases. Two-symbol RHS cannot name abc in one production.",
  },
  {
    id: "bisection",
    ceiling: "Self-similar halves",
    breaks: "Structure that is not aligned to midpoints — nested phrases, offset tiles.",
  },
  {
    id: "longest",
    ceiling: "First greedy phrase",
    breaks: "Copies of copies. It never builds a hierarchy, so D saturates while others keep climbing.",
  },
];

/** Measured D is n/|G_alg|. True grammatical density is n/|G_min| ≥ measured D. */
export function measuredIsLowerBound(point: SweepPoint, algId: string): boolean {
  const s = point.byAlg[algId];
  return !!s?.ok;
}
