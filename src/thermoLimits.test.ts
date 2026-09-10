import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ENGINES } from "./thermo";
import {
  closestToCeiling,
  getFloorTrace,
  landauerDensity,
  pareto,
  theoremL,
  theoremS,
  theoremT,
} from "./thermoLimits";

describe("thermodynamic limits", () => {
  it("Landauer density is strictly below 1 if anything is stored or paid", () => {
    assert.ok(landauerDensity(1, 100, 1) < 1);
    assert.equal(landauerDensity(1, 100, 1), 100 / 102);
  });

  it("theorem L: D_L < 1 on every engine, every scale", () => {
    for (const e of ENGINES) {
      const t = getFloorTrace(e.id);
      assert.equal(theoremL(t.points), true, e.id);
      for (const p of t.points) {
        assert.ok(p.landauer < 1, `${e.id} D_L=${p.landauer}`);
        assert.ok(p.landauer <= p.accounted + 1e-12);
      }
    }
  });

  it("theorem T: time-paid engines have K ≥ C and D′ < 1", () => {
    assert.equal(theoremT("koch"), true);
    assert.equal(theoremT("rule90"), true);
  });

  it("theorem S: SLP sharing beats D′ = 1, not the write floor", () => {
    assert.equal(theoremS(), true);
    const last = getFloorTrace("slp").points.at(-1)!;
    assert.ok(last.accounted > 1, `D′=${last.accounted}`);
    assert.ok(last.landauer < 1, `D_L=${last.landauer}`);
  });

  it("Koch D explodes, D_L stays near ½", () => {
    const last = getFloorTrace("koch").points.at(-1)!;
    assert.ok(last.D > 50);
    assert.ok(last.landauer < 0.6);
    assert.ok(last.landauer > 0.3);
  });

  it("SLP is closest to the Landauer wall — sharing wastes less write-adjacent work", () => {
    const best = closestToCeiling();
    assert.equal(best.id, "slp");
    assert.ok(best.landauer > 0.7);
  });

  it("Pareto: Koch and Rule 90 pay K ≫ S; SLP pays K = S", () => {
    const pts = pareto();
    const slp = pts.find((p) => p.id === "slp")!;
    const koch = pts.find((p) => p.id === "koch")!;
    assert.equal(slp.K, slp.S);
    assert.ok(koch.K > koch.S * 10);
  });
});
