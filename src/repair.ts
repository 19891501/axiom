/**
 * Re-Pair optimality audit.
 *
 * Mieno, Inenaga, Horiyama (CPM 2022): every Re-Pair grammar of F_n is a
 * smallest grammar, and g*(F_n) = n, counted as the number of productions
 * of a CNF SLP.
 *
 * Axiom’s runRepair is not that object. It sums RHS lengths, skips the
 * unary stage and the CNF finish, and counts overlapping pairs when the
 * two symbols differ. Sequitur can beat it on |G|_rhs without touching g*.
 *
 * This file is a referee, not a tenth algorithm.
 */

import { runRepair, runSequitur } from "./algorithms";
import {
  type CompressionResult,
  type Rule,
  type Sym,
  chars,
  finish,
  nonterm,
  ntName,
  symKey,
  term,
} from "./grammar";

export const REPAIR_FROZEN_ON = "2026-09-11";

/** Mieno: F_1 = b, F_2 = a, F_i = F_{i-1} F_{i-2}. |F_n| = f_n. */
export function mienoWord(n: number): string {
  let f1 = "b";
  let f2 = "a";
  if (n <= 1) return f1;
  if (n === 2) return f2;
  for (let i = 3; i <= n; i++) {
    const t = f2 + f1;
    f1 = f2;
    f2 = t;
  }
  return f2;
}

function pairKey(a: Sym, b: Sym): string {
  return `${symKey(a)}\0${symKey(b)}`;
}

function nonOverlapCount(seq: Sym[], a: Sym, b: Sym): number {
  let c = 0;
  for (let i = 0; i < seq.length - 1; ) {
    if (symKey(seq[i]!) === symKey(a) && symKey(seq[i + 1]!) === symKey(b)) {
      c++;
      i += 2;
    } else i += 1;
  }
  return c;
}

/**
 * Three-stage Re-Pair as used by Mieno et al.:
 * 1. unary production per terminal
 * 2. replace a most-frequent non-overlapping bigram until none repeats
 * 3. binarize the remaining sequence (CNF)
 *
 * Size that matches the theorem: number of productions.
 */
export function repairCanonical(input: string): CompressionResult {
  const produced = new Map<string, Sym[]>();
  const terms = [...new Set(chars(input))];
  const termNt = new Map<string, string>();
  for (const t of terms) {
    const name = `T_${t === " " ? "sp" : t}`;
    produced.set(name, [term(t)]);
    termNt.set(t, name);
  }
  let seq: Sym[] = chars(input).map((t) => nonterm(termNt.get(t)!));
  let nti = 0;

  function mostFrequent(): { a: Sym; b: Sym; count: number } | null {
    const seen = new Map<string, { a: Sym; b: Sym }>();
    for (let i = 0; i < seq.length - 1; i++) {
      const a = seq[i]!;
      const b = seq[i + 1]!;
      const k = pairKey(a, b);
      if (!seen.has(k)) seen.set(k, { a, b });
    }
    let best: { a: Sym; b: Sym; count: number } | null = null;
    for (const { a, b } of seen.values()) {
      const count = nonOverlapCount(seq, a, b);
      if (count < 2) continue;
      const k = pairKey(a, b);
      if (
        !best ||
        count > best.count ||
        (count === best.count && k < pairKey(best.a, best.b))
      ) {
        best = { a, b, count };
      }
    }
    return best;
  }

  let guard = 0;
  while (guard++ < 8000) {
    const best = mostFrequent();
    if (!best) break;
    const name = ntName(nti++);
    produced.set(name, [best.a, best.b]);
    const next: Sym[] = [];
    for (let i = 0; i < seq.length; ) {
      if (
        i < seq.length - 1 &&
        symKey(seq[i]!) === symKey(best.a) &&
        symKey(seq[i + 1]!) === symKey(best.b)
      ) {
        next.push(nonterm(name));
        i += 2;
      } else {
        next.push(seq[i]!);
        i += 1;
      }
    }
    seq = next;
  }

  const extra: Rule[] = [];
  let start: string;
  if (seq.length === 1 && seq[0]!.k === "n") {
    start = seq[0]!.v;
  } else if (seq.length <= 2) {
    start = "S";
    extra.push({ lhs: "S", rhs: [...seq] });
  } else {
    start = "S";
    let current = "S";
    let z = 0;
    for (let i = 0; i < seq.length - 2; i++) {
      const nxt = `Z${z++}`;
      extra.push({ lhs: current, rhs: [seq[i]!, nonterm(nxt)] });
      current = nxt;
    }
    extra.push({ lhs: current, rhs: [seq[seq.length - 2]!, seq[seq.length - 1]!] });
  }

  const rules: Rule[] = [...extra];
  for (const [lhs, rhs] of produced) rules.push({ lhs, rhs });
  return finish("repair-cnf", input, rules, start);
}

export const MIENO_NS = [6, 7, 8, 9, 10, 11, 12, 13, 14] as const;

export interface RepairRow {
  n: number;
  length: number;
  gStar: number;
  canonicalProductions: number;
  canonicalRhs: number;
  canonicalOk: boolean;
  labRhs: number;
  labRules: number;
  labOk: boolean;
  sequiturRhs: number;
  sequiturRules: number;
  sequiturOk: boolean;
}

export function auditRow(n: number): RepairRow {
  const text = mienoWord(n);
  const can = repairCanonical(text);
  const lab = runRepair(text);
  const seq = runSequitur(text);
  return {
    n,
    length: text.length,
    gStar: n,
    canonicalProductions: can.ruleCount,
    canonicalRhs: can.grammarSize,
    canonicalOk: can.ok,
    labRhs: lab.grammarSize,
    labRules: lab.ruleCount,
    labOk: lab.ok,
    sequiturRhs: seq.grammarSize,
    sequiturRules: seq.ruleCount,
    sequiturOk: seq.ok,
  };
}

const cache = new Map<number, RepairRow>();

export function getAudit(n: number): RepairRow {
  const hit = cache.get(n);
  if (hit) return hit;
  const row = auditRow(n);
  cache.set(n, row);
  return row;
}

export function allAudit(): RepairRow[] {
  return MIENO_NS.map(getAudit);
}

export interface RepairClaim {
  id: string;
  ok: boolean;
  detail: string;
}

export function evaluateRepair(): RepairClaim[] {
  const rows = allAudit();
  const last = rows.at(-1)!;
  const mienoHit = rows.every((r) => r.canonicalOk && r.canonicalProductions === r.gStar);
  const labRhsWorse = last.labRhs > last.sequiturRhs;
  const canRhsNotWorse = last.canonicalRhs <= last.labRhs;
  return [
    {
      id: "mieno-productions",
      ok: mienoHit,
      detail: mienoHit
        ? `canonical productions = n on F_6…F_14`
        : `missed g* on ${rows.filter((r) => r.canonicalProductions !== r.gStar).map((r) => r.n).join(",")}`,
    },
    {
      id: "reconstruct",
      ok: rows.every((r) => r.canonicalOk && r.labOk && r.sequiturOk),
      detail: "canonical, lab, Sequitur all reconstruct F_n",
    },
    {
      id: "two-measures",
      ok: labRhsWorse && last.canonicalProductions === last.gStar,
      detail: `F_14: lab |G|_rhs=${last.labRhs} > Sequitur ${last.sequiturRhs}; canonical productions=${last.canonicalProductions}=g*`,
    },
    {
      id: "lab-is-not-mieno",
      ok: last.labRules !== last.gStar,
      detail: `lab ruleCount=${last.labRules} ≠ ${last.gStar} — missing unary stage and CNF finish`,
    },
    {
      id: "canonical-rhs",
      ok: canRhsNotWorse && last.canonicalOk,
      detail: `canonical |G|_rhs=${last.canonicalRhs} ≤ lab ${last.labRhs} on F_14`,
    },
  ];
}

export function repairPass(): boolean {
  return evaluateRepair().every((c) => c.ok);
}

/** Documented forks. Not a compressor list. */
export const FORKS = [
  {
    id: "size",
    lab: "sum of RHS lengths",
    mieno: "number of CNF productions",
  },
  {
    id: "unary",
    lab: "terminals sit on binary RHS",
    mieno: "stage 1: one unary production per letter",
  },
  {
    id: "cnf",
    lab: "start may be longer than 2",
    mieno: "stage 3: remaining sequence is binarized",
  },
  {
    id: "overlap",
    lab: "ab counts overlap; aa does not",
    mieno: "every bigram counted non-overlapping",
  },
] as const;
