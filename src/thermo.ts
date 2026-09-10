import { runSequitur } from "./algorithms";
import { evolve, pointSeed, caStateSize } from "./ca/elementary";
import { LSYSTEMS, expandLSystem, grammarStateSize, type LSystem } from "./lsystem";

/**
 * Thermodynamic analogy for reconstruction — Phase 1, strings only.
 *
 * Density D = C/S ignores reconstruction work. If that work is free, an
 * L-system is perpetual motion: |G| is constant, n grows without bound.
 * Count K, and the miracle becomes a tradeoff.
 *
 * Convention K3 (this file, frozen):
 *   SLP   K = |G|           (memoized DAG — work is paid in the grammar)
 *   Koch  K = Σ |w_i|       (every rewrite is paid)
 *   CA    K = t × w         (one lookup per cell)
 *
 * Amplification A = C/K. Accounted density D' = C/(S+K).
 * This is an analogy. Energy is not conserved. There is no temperature.
 */

export type EngineId = "slp" | "koch" | "rule90";

export interface Engine {
  id: EngineId;
  name: string;
  pays: "state" | "time";
  kName: string;
  blurb: string;
  xLabel: string;
}

export const ENGINES: Engine[] = [
  {
    id: "slp",
    name: "SLP · tile",
    pays: "state",
    kName: "K = |G|  (DAG, memoized)",
    blurb: "Sequitur on abc^k. Sharing is stored. Reconstruction work is paid in the grammar, so A ≈ D.",
    xLabel: "copies k",
  },
  {
    id: "koch",
    name: "Koch",
    pays: "time",
    kName: "K = Σ |w_i|  (every rewrite)",
    blurb: "One production, iterated. State does not grow. Work does. If K is free, this is perpetual motion.",
    xLabel: "iterations",
  },
  {
    id: "rule90",
    name: "Rule 90",
    pays: "time",
    kName: "K = t × w  (one lookup / cell)",
    blurb: "Sierpiński from 9 bits of state. Spacetime is the capacity. The lattice must actually run.",
    xLabel: "generations t",
  },
];

export const ENGINE_BY_ID: Record<EngineId, Engine> = Object.fromEntries(
  ENGINES.map((e) => [e.id, e]),
) as Record<EngineId, Engine>;

export interface ThermoSample {
  scale: number;
  label: string;
  S: number;
  C: number;
  K: number;
  D: number;
  A: number;
  accounted: number;
  ok: boolean;
}

export interface ThermoTrace {
  engine: Engine;
  points: ThermoSample[];
}

function sample(S: number, C: number, K: number, scale: number, label: string, ok = true): ThermoSample {
  return {
    scale,
    label,
    S,
    C,
    K,
    D: S === 0 ? 0 : C / S,
    A: K === 0 ? 0 : C / K,
    accounted: S + K === 0 ? 0 : C / (S + K),
    ok,
  };
}

function slpPoints(): ThermoSample[] {
  return [1, 2, 4, 8, 16, 32].map((k) => {
    const text = "abc".repeat(k);
    const r = runSequitur(text);
    return sample(r.grammarSize, r.inputLength, r.grammarSize, k, `${k}×`, r.ok);
  });
}

export function rewriteWork(sys: LSystem, iterations: number): { n: number; K: number } {
  let s = sys.axiom;
  let K = s.length;
  const cap = 25000;
  for (let i = 0; i < iterations; i++) {
    let next = "";
    for (const ch of s) next += sys.rules[ch] ?? ch;
    K += next.length;
    s = next;
    if (s.length > cap) break;
  }
  return { n: s.length, K };
}

function kochPoints(): ThermoSample[] {
  const sys = LSYSTEMS.find((s) => s.id === "koch")!;
  const S = grammarStateSize(sys);
  return [0, 1, 2, 3, 4, 5].map((iter) => {
    const { n, K } = rewriteWork(sys, iter);
    const word = expandLSystem(sys, iter);
    return sample(S, n, K, iter, String(iter), word.length === n);
  });
}

function rule90Points(): ThermoSample[] {
  return [5, 10, 20, 40, 60].map((t) => {
    const w = 2 * t + 1;
    const rows = evolve(90, pointSeed(w), t, false);
    const C = rows.length * w;
    const S = caStateSize(1);
    const K = C;
    return sample(S, C, K, t, String(t), rows.length === t);
  });
}

const cache = new Map<EngineId, ThermoTrace>();

export function getTrace(id: EngineId): ThermoTrace {
  const hit = cache.get(id);
  if (hit) return hit;
  const engine = ENGINE_BY_ID[id];
  const points = id === "slp" ? slpPoints() : id === "koch" ? kochPoints() : rule90Points();
  const trace = { engine, points };
  cache.set(id, trace);
  return trace;
}

/** Where the analogy holds, and where calling it a science would be a lie. */
export const ANALOGUES: { thermo: string; axiom: string; holds: boolean }[] = [
  {
    thermo: "Fuel / free energy",
    axiom: "Persistent state |G|",
    holds: true,
  },
  {
    thermo: "Work extracted",
    axiom: "Reconstructed length n",
    holds: true,
  },
  {
    thermo: "Heat / irreversible work",
    axiom: "Reconstruction cost K",
    holds: true,
  },
  {
    thermo: "Efficiency η = W/Q",
    axiom: "Amplification A = n/K",
    holds: true,
  },
  {
    thermo: "Perpetual motion of the second kind",
    axiom: "D → ∞ with K claimed to be 0 (Law, Koch, slider)",
    holds: true,
  },
  {
    thermo: "Landauer: erasure costs",
    axiom: "Discarding s without a witness (Verify)",
    holds: true,
  },
  {
    thermo: "Carnot bound",
    axiom: "D ≤ n/K(s) — true, and K(s) is uncomputable",
    holds: true,
  },
  {
    thermo: "Conservation of energy",
    axiom: "|G| is not conserved. You can throw state away.",
    holds: false,
  },
  {
    thermo: "Temperature T",
    axiom: "No ensemble, no k_B. Structure class is not T.",
    holds: false,
  },
  {
    thermo: "Second law",
    axiom: "An algorithm is a prior. Compression is not a closed system.",
    holds: false,
  },
];
