import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { LSYSTEMS, grammarStateSize } from "./lsystem";
import { getTrace, rewriteWork } from "./thermo";

describe("thermodynamic accounting", () => {
  it("SLP on a tile: D grows, and A ≈ D because K = |G|", () => {
    const t = getTrace("slp");
    const first = t.points[0]!;
    const last = t.points.at(-1)!;
    assert.ok(last.D > first.D * 2, `D ${first.D} → ${last.D}`);
    for (const p of t.points) {
      assert.equal(p.ok, true);
      assert.ok(Math.abs(p.A - p.D) < 1e-9, `A=${p.A} D=${p.D}`);
    }
  });

  it("Koch: D grows with iterations; A stays < 1 (work is paid in rewrites)", () => {
    const t = getTrace("koch");
    const a = t.points[1]!;
    const b = t.points.at(-1)!;
    assert.ok(b.D > a.D * 4, `D ${a.D} → ${b.D}`);
    for (const p of t.points.slice(1)) {
      assert.ok(p.A < 1, `A=${p.A} at iter ${p.scale}`);
      assert.ok(p.K >= p.C, "K includes the last word");
    }
  });

  it("Koch accounted density does not explode — perpetual motion is K=0", () => {
    const t = getTrace("koch");
    const last = t.points.at(-1)!;
    assert.ok(last.D > 50, `miracle D=${last.D}`);
    assert.ok(last.accounted < 1, `accounted D'=${last.accounted}`);
    assert.ok(last.accounted < last.D / 50);
  });

  it("Rule 90: A ≡ 1 (K = spacetime); D grows with t", () => {
    const t = getTrace("rule90");
    const first = t.points[0]!;
    const last = t.points.at(-1)!;
    assert.ok(last.D > first.D * 3);
    for (const p of t.points) {
      assert.ok(Math.abs(p.A - 1) < 1e-9, `A=${p.A}`);
      assert.equal(p.S, 9);
    }
  });

  it("rewriteWork matches expand length; Koch |G| is invariant", () => {
    const sys = LSYSTEMS.find((s) => s.id === "koch")!;
    const S = grammarStateSize(sys);
    for (const iter of [0, 1, 2, 3]) {
      const w = rewriteWork(sys, iter);
      assert.equal(w.n > 0, true);
      assert.equal(S, grammarStateSize(sys));
    }
  });
});
