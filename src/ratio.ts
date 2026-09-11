/**
 * Ratio — approximation against a named construction, not against the literal.
 *
 * ρ = |G_alg| / |G_ref|. |G_ref| is a grammar we can expand and check.
 * It is not |G_min|. Charikar is NP-hard; we do not claim a record.
 *
 * Three referees, one negative:
 *   hierarchy  — balanced copies of a tile
 *   doubling   — binary method for a^n (an SLP, unlike RLE)
 *   morphism   — Fibonacci recurrence as an SLP
 *   literal    — incompressible ceiling
 */

import { ALGORITHMS } from "./algorithms";
import {
  type CompressionResult,
  type Rule,
  type Sym,
  finish,
  nonterm,
  term,
} from "./grammar";

export const RATIO_FROZEN_ON = "2026-09-11";

export type RefId = "hierarchy" | "doubling" | "morphism" | "literal";

export interface Referee {
  id: RefId;
  name: string;
  blurb: string;
  scales: number[];
  build: (scale: number) => CompressionResult;
}

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

/** Balanced copies of "abc". |G| = 3 + 2⌈log₂ k⌉ when k is a power of two. */
export function buildHierarchy(k: number): CompressionResult {
  const text = "abc".repeat(k);
  if (k <= 1) {
    return finish("hierarchy", text, [{ lhs: "S", rhs: [...text].map(term) }], "S");
  }
  const rules: Rule[] = [{ lhs: "P", rhs: [term("a"), term("b"), term("c")] }];
  function power(exp: number): string {
    if (exp === 0) return "P";
    const name = `H${exp}`;
    if (!rules.some((r) => r.lhs === name)) {
      const prev = power(exp - 1);
      rules.push({ lhs: name, rhs: [nonterm(prev), nonterm(prev)] });
    }
    return name;
  }
  const bits: string[] = [];
  let rem = k;
  let e = 0;
  while (rem > 0) {
    if (rem & 1) bits.push(power(e));
    rem >>= 1;
    e++;
  }
  const startRhs: Sym[] = bits.reverse().map((n) => (n === "P" ? nonterm("P") : nonterm(n)));
  if (startRhs.length === 1 && startRhs[0]!.k === "n") {
    return finish("hierarchy", text, rules, startRhs[0]!.v);
  }
  rules.unshift({ lhs: "S", rhs: startRhs });
  return finish("hierarchy", text, rules, "S");
}

/** Binary method SLP for a^n. Not RLE: counts are unfolded. */
export function buildDoubling(n: number): CompressionResult {
  const text = "a".repeat(n);
  if (n <= 0) return finish("doubling", "", [{ lhs: "S", rhs: [] }], "S");
  if (n === 1) return finish("doubling", text, [{ lhs: "S", rhs: [term("a")] }], "S");
  const rules: Rule[] = [{ lhs: "A0", rhs: [term("a")] }];
  const log = Math.floor(Math.log2(n));
  for (let i = 1; i <= log; i++) {
    const prev = `A${i - 1}`;
    rules.push({ lhs: `A${i}`, rhs: [nonterm(prev), nonterm(prev)] });
  }
  const start: Sym[] = [];
  for (let i = log; i >= 0; i--) {
    if (n & (1 << i)) start.push(nonterm(`A${i}`));
  }
  if (start.length === 1 && start[0]!.k === "n") {
    return finish("doubling", text, rules, start[0]!.v);
  }
  rules.unshift({ lhs: "S", rhs: start });
  return finish("doubling", text, rules, "S");
}

/** Fibonacci recurrence as an SLP. Start is F_k. */
export function buildMorphism(gen: number): CompressionResult {
  const text = fibWord(gen);
  const rules: Rule[] = [
    { lhs: "F0", rhs: [term("a")] },
    { lhs: "F1", rhs: [term("a"), term("b")] },
  ];
  for (let i = 2; i <= gen; i++) {
    rules.push({ lhs: `F${i}`, rhs: [nonterm(`F${i - 1}`), nonterm(`F${i - 2}`)] });
  }
  return finish("morphism", text, rules, `F${gen}`);
}

export function buildLiteralRef(n: number): CompressionResult {
  const text = lcg(20260910, n);
  return finish("literal-ref", text, [{ lhs: "S", rhs: [...text].map(term) }], "S");
}

export const REFEREES: Referee[] = [
  {
    id: "hierarchy",
    name: "Hierarchy",
    blurb: "Balanced copies of abc. The construction Limits already drew as a bound.",
    scales: [2, 4, 8, 16, 32, 64],
    build: buildHierarchy,
  },
  {
    id: "doubling",
    name: "Doubling",
    blurb: "An SLP for a^n. RLE is not this object: a count is not a rewrite.",
    scales: [8, 16, 32, 64, 128],
    build: buildDoubling,
  },
  {
    id: "morphism",
    name: "Morphism",
    blurb: "F_k → F_{k-1} F_{k-2}. Mieno 2022: true Re-Pair is optimal here. This lab’s Re-Pair is not.",
    scales: [6, 8, 10, 12],
    build: buildMorphism,
  },
  {
    id: "literal",
    name: "Literal",
    blurb: "Incompressible ceiling. Nothing should beat 1 by much.",
    scales: [24, 48, 96],
    build: buildLiteralRef,
  },
];

const SKIP_LONGEST_ABOVE = 64;

export interface RatioCell {
  algId: string;
  g: number;
  rho: number;
  ok: boolean;
}

export interface RatioPoint {
  scale: number;
  n: number;
  refG: number;
  refOk: boolean;
  cells: RatioCell[];
}

export interface RatioSweep {
  referee: Referee;
  points: RatioPoint[];
}

const cache = new Map<RefId, RatioSweep>();

export function getRatioSweep(id: RefId): RatioSweep {
  const hit = cache.get(id);
  if (hit) return hit;
  const referee = REFEREES.find((r) => r.id === id)!;
  const points: RatioPoint[] = referee.scales.map((scale) => {
    const ref = referee.build(scale);
    const cells: RatioCell[] = [];
    for (const alg of ALGORITHMS) {
      if (alg.id === "longest" && ref.inputLength > SKIP_LONGEST_ABOVE) continue;
      const r = alg.run(ref.reconstructed);
      cells.push({
        algId: alg.id,
        g: r.grammarSize,
        rho: ref.grammarSize === 0 ? 0 : r.grammarSize / ref.grammarSize,
        ok: r.ok,
      });
    }
    return {
      scale,
      n: ref.inputLength,
      refG: ref.grammarSize,
      refOk: ref.ok,
      cells,
    };
  });
  const sweep = { referee, points };
  cache.set(id, sweep);
  return sweep;
}

export function lastCell(id: RefId, algId: string): RatioCell | undefined {
  const p = getRatioSweep(id).points.at(-1);
  return p?.cells.find((c) => c.algId === algId);
}

export interface RatioClaim {
  id: string;
  ok: boolean;
  detail: string;
}

export function evaluateRatio(): RatioClaim[] {
  const hier = getRatioSweep("hierarchy");
  const doub = getRatioSweep("doubling");
  const morph = getRatioSweep("morphism");
  const lit = getRatioSweep("literal");
  const seqH = lastCell("hierarchy", "sequitur")!;
  const repH = lastCell("hierarchy", "repair")!;
  const rleD = lastCell("doubling", "rle")!;
  const seqD = lastCell("doubling", "sequitur")!;
  const repD = lastCell("doubling", "repair")!;
  const seqM = lastCell("morphism", "sequitur")!;
  const repM = lastCell("morphism", "repair")!;
  const bpeM = lastCell("morphism", "bpe")!;
  let refsOk = true;
  for (const s of [hier, doub, morph, lit]) {
    for (const p of s.points) if (!p.refOk) refsOk = false;
  }
  let randomOk = true;
  for (const p of lit.points) {
    for (const c of p.cells) {
      if (c.algId === "literal") continue;
      if (c.rho < 0.85 || !c.ok) randomOk = false;
    }
  }
  return [
    { id: "refs-ok", ok: refsOk, detail: "every named construction reconstructs" },
    {
      id: "tile-sequitur",
      ok: seqH.rho <= 1.02 && seqH.ok,
      detail: `Sequitur ρ=${seqH.rho.toFixed(3)} vs hierarchy (|G|=${seqH.g}/${hier.points.at(-1)!.refG})`,
    },
    {
      id: "tile-repair",
      ok: repH.rho <= 1.15 && repH.ok,
      detail: `Re-Pair ρ=${repH.rho.toFixed(3)} vs hierarchy`,
    },
    {
      id: "unary-rle-not-slp",
      ok: rleD.g === 2,
      detail: `RLE |G|=${rleD.g} on a^n — a count, not a rewrite`,
    },
    {
      id: "unary-slp-beats-doubling",
      ok: seqD.rho <= 1 && repD.rho <= 1 && seqD.ok && repD.ok,
      detail: `Sequitur ρ=${seqD.rho.toFixed(3)} Re-Pair ρ=${repD.rho.toFixed(3)} vs doubling`,
    },
    {
      id: "fib-not-mieno",
      ok: repM.rho > 1 && (bpeM.g < repM.g || seqM.g < repM.g),
      detail: `lab Re-Pair |G|=${repM.g} > Sequitur ${seqM.g} / BPE ${bpeM.g} — not Mieno-optimal`,
    },
    {
      id: "fib-sequitur-vs-morphism",
      ok: seqM.rho <= 1.05 && seqM.ok,
      detail: `Sequitur ρ=${seqM.rho.toFixed(3)} vs morphism SLP`,
    },
    {
      id: "random-ceiling",
      ok: randomOk,
      detail: "no compressor beats literal by 15% on LCG",
    },
  ];
}

export function ratioPass(): boolean {
  return evaluateRatio().every((c) => c.ok);
}
