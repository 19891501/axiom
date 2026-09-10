/**
 * Thermodynamic limits — Phase 1, strings only.
 *
 * Thermo counted K. This file states what counting still cannot beat.
 *
 *   D   = C/S           K free. Perpetual motion if S is fixed.
 *   D′  = C/(S+K)       K3. Sharing (SLP) may exceed 1. Time-paid cannot.
 *   D_L = C/(S+K+C)     Landauer: emitting the string costs its length.
 *
 * Theorem L: D_L < 1 whenever S+K > 0.
 * Theorem T: if K ≥ C (no sharing of work), D′ < 1.
 * Theorem S: an SLP may have D′ > 1; D_L still < 1.
 *
 * Carnot analogue: true |G_min| is uncomputable. We only have the write floor.
 */

import { ENGINES, getTrace, type Engine, type EngineId, type ThermoSample } from "./thermo";

export function landauerDensity(S: number, C: number, K: number): number {
  const den = S + K + C;
  return den === 0 ? 0 : C / den;
}

export interface FloorSample extends ThermoSample {
  landauer: number;
  timeBound: number;
  gap: number;
}

export function withFloor(p: ThermoSample): FloorSample {
  const landauer = landauerDensity(p.S, p.C, p.K);
  return {
    ...p,
    landauer,
    timeBound: p.S + p.C === 0 ? 0 : p.C / (p.S + p.C),
    gap: 1 - landauer,
  };
}

export interface FloorTrace {
  engine: Engine;
  points: FloorSample[];
}

const cache = new Map<EngineId, FloorTrace>();

export function getFloorTrace(id: EngineId): FloorTrace {
  const hit = cache.get(id);
  if (hit) return hit;
  const t = getTrace(id);
  const trace = { engine: t.engine, points: t.points.map(withFloor) };
  cache.set(id, trace);
  return trace;
}

export const WORLDS = [
  { id: "D", name: "K free", formula: "C / S", bound: "none", cheat: true },
  { id: "Dp", name: "K3", formula: "C / (S+K)", bound: "time-paid: < 1", cheat: false },
  { id: "DL", name: "Landauer", formula: "C / (S+K+C)", bound: "< 1 always", cheat: false },
] as const;

export function theoremL(points: FloorSample[]): boolean {
  return points.every((p) => p.S + p.K > 0 && p.landauer < 1 && p.landauer <= p.accounted + 1e-12);
}

export function theoremT(id: EngineId): boolean {
  if (id === "slp") return true;
  return getFloorTrace(id).points.every((p) => p.K + 1e-9 >= p.C && p.accounted < 1);
}

export function theoremS(): boolean {
  const last = getFloorTrace("slp").points.at(-1);
  return !!last && last.accounted > 1 && last.landauer < 1;
}

export function closestToCeiling(): { id: EngineId; landauer: number } {
  let best: { id: EngineId; landauer: number } = { id: "rule90", landauer: 0 };
  for (const e of ENGINES) {
    const last = getFloorTrace(e.id).points.at(-1);
    if (last && last.landauer > best.landauer) best = { id: e.id, landauer: last.landauer };
  }
  return best;
}

export function pareto(): { id: EngineId; S: number; K: number; C: number; landauer: number }[] {
  return ENGINES.map((e) => {
    const last = getFloorTrace(e.id).points.at(-1)!;
    return { id: e.id, S: last.S, K: last.K, C: last.C, landauer: last.landauer };
  });
}
