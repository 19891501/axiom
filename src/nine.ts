/**
 * Theory of the nine — Axiom v1.0.
 *
 * Each algorithm is a witness: K(x) ≤ |G_alg| + O(1).
 * The smallest-grammar problem is NP-hard. Measured D is a lower bound.
 * They do not compete for a record. Families win regimes; algorithms don't.
 */

import { ALGORITHMS, type AlgorithmFamily } from "./algorithms";
import { REGIMES, getSweep, type RegimeId } from "./limits";

export const AXIOM_VERSION = "1.0.0";
export const NINE_FROZEN_ON = "2026-09-11";

export const THESIS =
  "Each of the nine is a witness that a short grammar exists, not a champion of density.";

export const FAMILIES: { id: AlgorithmFamily; name: string; sees: string }[] = [
  { id: "baseline", name: "Baseline", sees: "The string itself. D ≡ 1." },
  { id: "run", name: "Run", sees: "Maximal streaks. Blind to period > 1." },
  { id: "dictionary", name: "Dictionary", sees: "Prefix-closed phrases, one pass." },
  { id: "tokenizer", name: "Tokenizer", sees: "Re-Pair cut at a merge budget." },
  { id: "grammar", name: "Grammar", sees: "Hierarchy, pairing, midpoints, longest blocks." },
];

export interface RegimeWin {
  regime: RegimeId;
  algId: string;
  family: AlgorithmFamily;
  d: number;
}

export function winnerOf(regime: RegimeId): RegimeWin {
  const last = getSweep(regime).points.at(-1)!;
  let best: RegimeWin = { regime, algId: "literal", family: "baseline", d: 0 };
  for (const [id, samp] of Object.entries(last.byAlg)) {
    if (!samp || id === "literal") continue;
    if (samp.d > best.d) {
      const def = ALGORITHMS.find((a) => a.id === id)!;
      best = { regime, algId: id, family: def.family, d: samp.d };
    }
  }
  return best;
}

export function allWinners(): RegimeWin[] {
  return REGIMES.map((r) => winnerOf(r.id));
}

export interface NineClaim {
  id: string;
  ok: boolean;
  detail: string;
}

export function evaluateNine(): NineClaim[] {
  const tile = getSweep("tile");
  const unary = getSweep("unary");
  const nested = getSweep("nested");
  const fib = getSweep("fibonacci");
  const rand = getSweep("random");
  const dSeq = (s: typeof tile, k: number) => s.points.find((p) => p.scale === k)!.byAlg.sequitur!.d;
  const tileLast = tile.points.at(-1)!;
  const nestLast = nested.points.at(-1)!;
  const wTile = winnerOf("tile");
  const wUnary = winnerOf("unary");
  const wNest = winnerOf("nested");
  const wFib = winnerOf("fibonacci");

  let randomOk = true;
  for (const p of rand.points) {
    for (const [id, samp] of Object.entries(p.byAlg)) {
      if (!samp || id === "literal") continue;
      if (samp.d >= 1.15 || !samp.ok) randomOk = false;
    }
  }

  return [
    {
      id: "count",
      ok: ALGORITHMS.length === 9,
      detail: `${ALGORITHMS.length} algorithms`,
    },
    {
      id: "families",
      ok: FAMILIES.length === 5,
      detail: FAMILIES.map((f) => f.id).join(" · "),
    },
    {
      id: "tile-grammar",
      ok: wTile.family === "grammar" && wTile.d > 10,
      detail: `tile winner ${wTile.algId} D=${wTile.d.toFixed(1)}`,
    },
    {
      id: "tile-rle-blind",
      ok: tile.points.every((p) => Math.abs(p.byAlg.rle!.d - 0.5) < 1e-9),
      detail: "RLE D = 1/2 on abc^k",
    },
    {
      id: "tile-climb",
      ok: dSeq(tile, 64) > dSeq(tile, 8),
      detail: `Sequitur D(8)=${dSeq(tile, 8).toFixed(1)} D(64)=${dSeq(tile, 64).toFixed(1)}`,
    },
    {
      id: "unary-run",
      ok: wUnary.family === "run" && unary.points.every((p) => p.byAlg.rle!.d === p.n / 2),
      detail: `unary winner ${wUnary.algId} D=${wUnary.d.toFixed(1)}`,
    },
    {
      id: "nested-rhs",
      ok: nestLast.byAlg.sequitur!.d > nestLast.byAlg.bisection!.d * 2,
      detail: `Sequitur ${nestLast.byAlg.sequitur!.d.toFixed(1)} vs Bisection ${nestLast.byAlg.bisection!.d.toFixed(1)}`,
    },
    {
      id: "nested-grammar",
      ok: wNest.family === "grammar",
      detail: `nested winner ${wNest.algId}`,
    },
    {
      id: "fib-morphism",
      ok: fib.points.at(-1)!.byAlg.sequitur!.d > fib.points[0]!.byAlg.sequitur!.d * 2,
      detail: `fib Sequitur grows; winner ${wFib.algId} D=${wFib.d.toFixed(1)} (tokenizer may beat unbounded grammar)`,
    },
    {
      id: "random-ceiling",
      ok: randomOk,
      detail: "every D < 1.15 on incompressible",
    },
    {
      id: "bpe-truncates",
      ok: (tileLast.byAlg.bpe?.d ?? 0) <= (tileLast.byAlg.repair?.d ?? 0) + 1e-9,
      detail: `BPE ${tileLast.byAlg.bpe?.d.toFixed(1)} ≤ Re-Pair ${tileLast.byAlg.repair?.d.toFixed(1)}`,
    },
    {
      id: "version",
      ok: AXIOM_VERSION === "1.0.0",
      detail: `v${AXIOM_VERSION}`,
    },
  ];
}

export function ninePass(): boolean {
  return evaluateNine().every((c) => c.ok);
}
