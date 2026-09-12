/**
 * Transition State — T1 instrument, not a law.
 *
 * Frozen 2026-09-12. Branching bisimulation (van Glabbeek & Weijland 1996)
 * is the referee, not a discovery. Theory: NO-GO (occupied). Instrument: this file.
 *
 * Nested capacities on one family:
 *   K0 = {export}
 *   K1 = {export, index0}
 *   K2 = {export, index0, emit}
 *
 * M that reconstructs S preserves every K. The flag that only stores the
 * periodicity bit preserves K0 and collapses K1/K2. That gap is a sufficient
 * statistic, already named. We measure it. We do not baptise it.
 */

import { buildHierarchy } from "./ratio";
import { expand } from "./grammar";

export const TRANSITION_FROZEN_ON = "2026-09-12";
export const TRANSITION_THEORY = "NO-GO" as const;
export const TRANSITION_STATUS = "instrument" as const;
export const TRANSITION_K = 8;
export const TILE = "abc";

export const TRANSITION_QUESTION =
  "At which nested capacity K does a named representation cease to be branching-bisimilar to the full string?";

export type Query = "export" | "index0" | "emit";
export type CapacityId = "K0" | "K1" | "K2";
export type Verdict = "EXECUTER" | "NO_ACTION" | "ASK";
export type RepId = "full" | "hier" | "meta" | "flag" | "digest" | "empty";

export const CAPACITIES: { id: CapacityId; queries: Query[]; blurb: string }[] = [
  { id: "K0", queries: ["export"], blurb: "May I export? Only the periodicity invariant." },
  { id: "K1", queries: ["export", "index0"], blurb: "Export, and read S[0]." },
  { id: "K2", queries: ["export", "index0", "emit"], blurb: "Export, read, reconstruct. Reconstruction." },
];

export interface Rep {
  id: RepId;
  name: string;
  bits: number;
  reconstructs: boolean;
  /** Persistent payload. Not the original S, except for `full`. */
  payload: unknown;
}

function isTile(s: string): boolean {
  if (s.length % TILE.length !== 0 || s.length === 0) return false;
  return s === TILE.repeat(s.length / TILE.length);
}

function fnv1a32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function makeS(): string {
  return TILE.repeat(TRANSITION_K);
}

function lcg(n: number, seed = 20260912): string {
  let x = seed >>> 0;
  let out = "";
  for (let i = 0; i < n; i++) {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    out += String.fromCharCode(97 + (x % 26));
  }
  return out;
}

export function makeNeg(): string {
  return lcg(makeS().length);
}

export function encode(id: RepId, s: string): Rep {
  const n = s.length;
  const k = n / TILE.length;
  switch (id) {
    case "full":
      return { id, name: "Full string", bits: n * 8, reconstructs: true, payload: s };
    case "hier": {
      if (!isTile(s)) {
        return { id, name: "Hierarchy", bits: 0, reconstructs: false, payload: null };
      }
      const g = buildHierarchy(k);
      return { id, name: "Hierarchy SLP", bits: g.grammarSize * 8, reconstructs: g.ok, payload: g };
    }
    case "meta":
      if (!isTile(s)) {
        return { id, name: "Tile + k", bits: 0, reconstructs: false, payload: null };
      }
      return {
        id,
        name: "Tile + k",
        bits: TILE.length * 8 + 8,
        reconstructs: true,
        payload: { tile: TILE, k },
      };
    case "flag":
      return { id, name: "Periodicity bit", bits: 1, reconstructs: false, payload: isTile(s) };
    case "digest":
      return { id, name: "FNV-1a 32", bits: 32, reconstructs: false, payload: fnv1a32(s) };
    case "empty":
      return { id, name: "Empty", bits: 0, reconstructs: false, payload: null };
  }
}

function reconstruct(rep: Rep): string | null {
  if (rep.id === "full" && typeof rep.payload === "string") return rep.payload;
  if (rep.id === "hier" && rep.payload && typeof rep.payload === "object" && "rules" in (rep.payload as object)) {
    const g = rep.payload as { rules: Parameters<typeof expand>[0]; start: string };
    return expand(g.rules, g.start);
  }
  if (rep.id === "meta" && rep.payload && typeof rep.payload === "object") {
    const p = rep.payload as { tile: string; k: number };
    if (!p.tile || !p.k) return null;
    return p.tile.repeat(p.k);
  }
  return null;
}

export function decide(rep: Rep, s: string, q: Query): Verdict {
  const rec = reconstruct(rep);
  if (q === "export") {
    if (rep.id === "flag" && typeof rep.payload === "boolean") {
      return rep.payload ? "EXECUTER" : "NO_ACTION";
    }
    if (rec !== null) return isTile(rec) ? "EXECUTER" : "NO_ACTION";
    return "ASK";
  }
  if (q === "index0") {
    if (rec !== null && rec.length > 0) return "EXECUTER";
    return "ASK";
  }
  if (q === "emit") {
    if (rec !== null && rec === s) return "EXECUTER";
    return "ASK";
  }
  return "ASK";
}

export type Label = "tau" | Query | Verdict | "commit" | "ask" | "abandon" | "stop";

export interface Edge {
  from: string;
  lab: Label;
  to: string;
}

export interface Lts {
  id: string;
  init: string;
  states: string[];
  edges: Edge[];
}

function add(edges: Edge[], from: string, lab: Label, to: string) {
  edges.push({ from, lab, to });
}

export function buildLts(rep: Rep, s: string, queries: Query[]): Lts {
  const edges: Edge[] = [];
  const states = new Set<string>(["Idle", "Sink"]);
  add(edges, "Idle", "tau", "Idle");
  for (const q of queries) {
    const prove = `P:${q}`;
    const done = `D:${q}`;
    states.add(prove);
    states.add(done);
    add(edges, "Idle", q, prove);
    add(edges, prove, "tau", prove);
    const v = decide(rep, s, q);
    add(edges, prove, v, done);
    if (v === "EXECUTER") add(edges, done, "commit", "Sink");
    else if (v === "ASK") {
      add(edges, done, "ask", "Sink");
      add(edges, done, "abandon", "Sink");
    } else add(edges, done, "stop", "Sink");
  }
  return { id: `${rep.id}/${queries.join("+")}`, init: "Idle", states: [...states], edges };
}

function outs(lts: Lts, s: string, lab: Label): string[] {
  return lts.edges.filter((e) => e.from === s && e.lab === lab).map((e) => e.to);
}

function labelsFrom(lts: Lts, s: string): Label[] {
  return [...new Set(lts.edges.filter((e) => e.from === s).map((e) => e.lab))];
}

function tauReach(lts: Lts, s: string): Set<string> {
  const seen = new Set<string>([s]);
  const stack = [s];
  while (stack.length) {
    const x = stack.pop()!;
    for (const y of outs(lts, x, "tau")) {
      if (!seen.has(y)) {
        seen.add(y);
        stack.push(y);
      }
    }
  }
  return seen;
}

/** Largest-branching-bisimulation test on two finite LTS (Park/Glabbeek). */
export function branchingBisimilar(a: Lts, b: Lts): boolean {
  let rel = new Set<string>();
  for (const p of a.states) for (const q of b.states) rel.add(`${p}|${q}`);

  const related = (p: string, q: string) => rel.has(`${p}|${q}`);

  function match(src: Lts, p: string, dst: Lts, q: string, flip: boolean): boolean {
    for (const lab of labelsFrom(src, p)) {
      for (const p2 of outs(src, p, lab)) {
        if (lab === "tau") {
          const inert = flip ? related(q, p2) : related(p2, q);
          if (inert) continue;
          let ok = false;
          for (const q1 of tauReach(dst, q)) {
            const mid = flip ? related(q1, p) : related(p, q1);
            if (!mid) continue;
            for (const q2 of outs(dst, q1, "tau")) {
              const end = flip ? related(q2, p2) : related(p2, q2);
              if (end) {
                ok = true;
                break;
              }
            }
            if (ok) break;
          }
          if (!ok) return false;
        } else {
          let ok = false;
          for (const q1 of tauReach(dst, q)) {
            const mid = flip ? related(q1, p) : related(p, q1);
            if (!mid) continue;
            for (const q2 of outs(dst, q1, lab)) {
              const end = flip ? related(q2, p2) : related(p2, q2);
              if (end) {
                ok = true;
                break;
              }
            }
            if (ok) break;
          }
          if (!ok) return false;
        }
      }
    }
    return true;
  }

  let changed = true;
  while (changed) {
    changed = false;
    for (const key of [...rel]) {
      const i = key.indexOf("|");
      const p = key.slice(0, i);
      const q = key.slice(i + 1);
      if (!match(a, p, b, q, false) || !match(b, q, a, p, true)) {
        rel.delete(key);
        changed = true;
      }
    }
  }
  return related(a.init, b.init);
}

export const REP_IDS: RepId[] = ["full", "hier", "meta", "flag", "digest", "empty"];

export interface Cell {
  rep: RepId;
  cap: CapacityId;
  bits: number;
  reconstructs: boolean;
  bisim: boolean;
  verdicts: Record<Query, Verdict>;
}

let cached: { pos: Cell[]; negFlag: Cell } | null = null;

export function runTransition(): { pos: Cell[]; neg: { flagExport: Verdict; digestExport: Verdict } } {
  if (cached) {
    return {
      pos: cached.pos,
      neg: {
        flagExport: decide(encode("flag", makeNeg()), makeNeg(), "export"),
        digestExport: decide(encode("digest", makeNeg()), makeNeg(), "export"),
      },
    };
  }
  const s = makeS();
  const full = encode("full", s);
  const pos: Cell[] = [];
  for (const id of REP_IDS) {
    const rep = encode(id, s);
    for (const cap of CAPACITIES) {
      const left = buildLts(full, s, cap.queries);
      const right = buildLts(rep, s, cap.queries);
      const verdicts = {} as Record<Query, Verdict>;
      for (const q of cap.queries) verdicts[q] = decide(rep, s, q);
      pos.push({
        rep: id,
        cap: cap.id,
        bits: rep.bits,
        reconstructs: rep.reconstructs,
        bisim: branchingBisimilar(left, right),
        verdicts,
      });
    }
  }
  cached = { pos, negFlag: pos[0]! };
  return {
    pos,
    neg: {
      flagExport: decide(encode("flag", makeNeg()), makeNeg(), "export"),
      digestExport: decide(encode("digest", makeNeg()), makeNeg(), "export"),
    },
  };
}

export interface TransitionClaim {
  id: string;
  ok: boolean;
  detail: string;
}

export function evaluateTransition(): TransitionClaim[] {
  const { pos, neg } = runTransition();
  const cell = (rep: RepId, cap: CapacityId) => pos.find((c) => c.rep === rep && c.cap === cap)!;
  const hierK2 = cell("hier", "K2");
  const flagK0 = cell("flag", "K0");
  const flagK2 = cell("flag", "K2");
  const digestK2 = cell("digest", "K2");
  const metaK2 = cell("meta", "K2");
  const plateau = flagK0.bits < metaK2.bits && flagK0.bisim && !flagK2.bisim && metaK2.bisim;
  return [
    { id: "calibration", ok: hierK2.bisim && metaK2.bisim && hierK2.reconstructs, detail: "Hierarchy and tile+k stay branching-bisimilar to full on K2 — reconstruction implies the gate." },
    { id: "digest-collapses", ok: !digestK2.bisim, detail: "A 32-bit digest is not branching-bisimilar to full. Collapse." },
    { id: "K0-flag", ok: flagK0.bisim && !flagK0.reconstructs, detail: "The periodicity bit preserves K0 and does not reconstruct S." },
    { id: "K2-flag-collapses", ok: !flagK2.bisim, detail: "The same bit does not preserve K2. Nested capacity is not a single number." },
    { id: "plateau", ok: plateau, detail: `M*(K0)=${flagK0.bits} bit (no reconstruct) < M*(K2)≤${metaK2.bits} bits (tile+k, reconstructs).` },
    { id: "negative-flag", ok: neg.flagExport === "NO_ACTION" && neg.digestExport === "ASK", detail: "On LCG: flag refuses; digest asks. The bit is not a constant yes." },
    { id: "theory", ok: TRANSITION_THEORY === "NO-GO", detail: "Sufficient statistic / branching quotient. Occupied. Not a law." },
  ];
}

export function transitionPass(): boolean {
  return evaluateTransition().every((c) => c.ok);
}
