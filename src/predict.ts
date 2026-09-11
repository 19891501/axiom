/**
 * Predict — Ĉ first, held-out k second.
 *
 * Registered before the run:
 *   tile     Ĉ(k) = |G| of the hierarchy construction
 *   unary    Ĉ(n) = |G| of the doubling SLP; RLE is a different object (|G|=2)
 *   fib      Ĉ(n) = n productions (Mieno)
 *   random   Ĉ(n) = n (literal)
 *
 * Held-out scales are disjoint from Ratio v1.1 and Repair v1.2.
 * No tenth algorithm. No new metric.
 */

import { ALGORITHMS, runRle, runSequitur } from "./algorithms";
import { repairCanonical, mienoWord } from "./repair";
import {
  buildDoubling,
  buildHierarchy,
  buildLiteralRef,
} from "./ratio";

export const PREDICT_FROZEN_ON = "2026-09-11";

export const HOLDOUT = {
  tile: [3, 5, 7, 12, 24, 48, 96, 128],
  unary: [12, 24, 48, 96, 192],
  fib: [15, 16],
  random: [36, 72, 144],
} as const;

export const SEEN = {
  tile: [2, 4, 8, 16, 32, 64],
  unary: [8, 16, 32, 64, 128],
  fib: [6, 7, 8, 9, 10, 11, 12, 13, 14],
  random: [24, 48, 96],
} as const;

export type FamilyId = "tile" | "unary" | "fib" | "random";

export interface PredictPoint {
  k: number;
  n: number;
  chat: number;
  measured: number;
  rho: number;
  ok: boolean;
  note: string;
}

export interface PredictFamily {
  id: FamilyId;
  name: string;
  blurb: string;
  measure: string;
  points: PredictPoint[];
}

function tileFamily(): PredictFamily {
  const points: PredictPoint[] = HOLDOUT.tile.map((k) => {
    const ref = buildHierarchy(k);
    const seq = runSequitur(ref.reconstructed);
    return {
      k,
      n: ref.inputLength,
      chat: ref.grammarSize,
      measured: seq.grammarSize,
      rho: seq.grammarSize / ref.grammarSize,
      ok: ref.ok && seq.ok && seq.grammarSize <= ref.grammarSize,
      note: Number.isInteger(Math.log2(k)) ? "dyadic" : "held-out",
    };
  });
  return {
    id: "tile",
    name: "Tile (abc)^k",
    blurb: "Ĉ = hierarchy |G|_rhs. Sequitur should not exceed it.",
    measure: "|G|_rhs",
    points,
  };
}

function unaryFamily(): PredictFamily {
  const points: PredictPoint[] = HOLDOUT.unary.map((n) => {
    const ref = buildDoubling(n);
    const seq = runSequitur(ref.reconstructed);
    const rle = runRle(ref.reconstructed);
    return {
      k: n,
      n,
      chat: ref.grammarSize,
      measured: seq.grammarSize,
      rho: seq.grammarSize / ref.grammarSize,
      ok: ref.ok && seq.ok && seq.grammarSize <= ref.grammarSize && rle.grammarSize === 2,
      note: `RLE |G|=${rle.grammarSize}`,
    };
  });
  return {
    id: "unary",
    name: "Unary a^n",
    blurb: "Ĉ = doubling SLP. RLE |G|=2 is a different object, locked separately.",
    measure: "|G|_rhs SLP",
    points,
  };
}

function fibFamily(): PredictFamily {
  const points: PredictPoint[] = HOLDOUT.fib.map((n) => {
    const w = mienoWord(n);
    const can = repairCanonical(w);
    return {
      k: n,
      n: w.length,
      chat: n,
      measured: can.ruleCount,
      rho: can.ruleCount / n,
      ok: can.ok && can.ruleCount === n,
      note: "productions",
    };
  });
  return {
    id: "fib",
    name: "Fibonacci F_n",
    blurb: "Ĉ = n productions. The theorem, on k the audit never saw.",
    measure: "CNF productions",
    points,
  };
}

function randomFamily(): PredictFamily {
  const points: PredictPoint[] = HOLDOUT.random.map((n) => {
    const ref = buildLiteralRef(n);
    let minG = ref.grammarSize;
    for (const a of ALGORITHMS) {
      if (a.id === "literal" || a.id === "longest") continue;
      const r = a.run(ref.reconstructed);
      if (r.ok && r.grammarSize < minG) minG = r.grammarSize;
    }
    const rho = minG / ref.grammarSize;
    return {
      k: n,
      n: ref.inputLength,
      chat: ref.grammarSize,
      measured: minG,
      rho,
      ok: ref.ok && rho >= 0.85,
      note: "min |G|_rhs / n",
    };
  });
  return {
    id: "random",
    name: "LCG",
    blurb: "Ĉ = n. Nobody should beat the literal by 15%.",
    measure: "|G|_rhs",
    points,
  };
}

let cached: PredictFamily[] | null = null;

export function getPredictions(): PredictFamily[] {
  if (cached) return cached;
  cached = [tileFamily(), unaryFamily(), fibFamily(), randomFamily()];
  return cached;
}

export interface PredictClaim {
  id: string;
  ok: boolean;
  detail: string;
}

export type PredictVerdict = "LAW" | "INVARIANT" | "NO-GO";

export function evaluatePredict(): PredictClaim[] {
  const [tile, unary, fib, random] = getPredictions();
  const tileBound = tile!.points.every((p) => p.ok);
  const dyadic = tile!.points.filter((p) => p.note === "dyadic");
  const dyadicTight = dyadic.length > 0 && dyadic.every((p) => Math.abs(p.rho - 1) < 1e-9);
  const gap3 = tile!.points.find((p) => p.k === 3)!;
  const gap96 = tile!.points.find((p) => p.k === 96)!;
  const gapShrinks = 1 - gap96.rho <= 1 - gap3.rho + 1e-9;
  const fibHit = fib!.points.every((p) => p.ok);
  const unaryHit = unary!.points.every((p) => p.ok);
  const randomHit = random!.points.every((p) => p.ok);
  const oddBeats = tile!.points.filter((p) => p.note !== "dyadic").every((p) => p.rho < 1);
  return [
    { id: "tile-bound", ok: tileBound, detail: "Sequitur |G| ≤ Ĉ_hierarchy on every held-out k" },
    { id: "tile-dyadic", ok: dyadicTight, detail: `k=128 (unseen power of two): ρ=${dyadic[0]?.rho.toFixed(3) ?? "?"}` },
    { id: "tile-gap-shrinks", ok: gapShrinks, detail: `relative gap k=3 → k=96 : ${(1 - gap3.rho).toFixed(3)} → ${(1 - gap96.rho).toFixed(3)}` },
    { id: "tile-odd-beats", ok: oddBeats, detail: "on non-dyadic k, Sequitur beats the construction — Ĉ is a bound, not an equality" },
    { id: "unary-rle-and-slp", ok: unaryHit, detail: "RLE |G|=2 and Sequitur ≤ doubling, held-out n" },
    { id: "fib-mieno", ok: fibHit, detail: "canonical productions = n on F_15, F_16" },
    { id: "random-ceiling", ok: randomHit, detail: "min ρ ≥ 0.85 on unseen LCG lengths" },
  ];
}

export function predictPass(): boolean {
  return evaluatePredict().every((c) => c.ok);
}

/** Bound that is tight on dyadic tiles and Fibonacci productions. Not a law. */
export const PREDICT_VERDICT: PredictVerdict = "INVARIANT";
