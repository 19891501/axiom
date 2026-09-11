import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  HOLDOUT,
  PREDICT_VERDICT,
  SEEN,
  evaluatePredict,
  getPredictions,
  predictPass,
} from "./predict";

describe("predict: Ĉ first, held-out k second", () => {
  it("held-out scales are disjoint from v1.1 / v1.2", () => {
    for (const id of ["tile", "unary", "fib", "random"] as const) {
      const seen = new Set(SEEN[id] as readonly number[]);
      for (const k of HOLDOUT[id]) assert.equal(seen.has(k), false, `${id} ${k}`);
    }
  });

  it("every claim holds and the verdict is INVARIANT, not a law", () => {
    for (const c of evaluatePredict()) assert.equal(c.ok, true, `${c.id}: ${c.detail}`);
    assert.equal(predictPass(), true);
    assert.equal(PREDICT_VERDICT, "INVARIANT");
  });

  it("dyadic tile is tight; non-dyadic Sequitur is strictly below Ĉ", () => {
    const tile = getPredictions().find((f) => f.id === "tile")!;
    const d = tile.points.find((p) => p.k === 128)!;
    assert.equal(d.rho, 1);
    for (const p of tile.points) {
      if (p.note === "dyadic") continue;
      assert.ok(p.rho < 1, `k=${p.k} ρ=${p.rho}`);
    }
  });
});
