import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getSweep } from "./limits";

describe("grammatical density limits", () => {
  it("tile: Sequitur D grows with copies (n/log n, not a cap at the period)", () => {
    const s = getSweep("tile");
    const d = (k: number) => {
      const p = s.points.find((x) => x.scale === k)!;
      return p.byAlg.sequitur!.d;
    };
    assert.ok(d(64) > d(8), `D(64)=${d(64)} should exceed D(8)=${d(8)}`);
    assert.ok(d(64) > 10, `hierarchical D should keep climbing, got ${d(64)}`);
  });

  it("tile: RLE is blind to period > 1 (D = 1/2)", () => {
    const s = getSweep("tile");
    for (const p of s.points) {
      assert.ok(Math.abs(p.byAlg.rle!.d - 0.5) < 1e-9, `k=${p.scale} D=${p.byAlg.rle!.d}`);
    }
  });

  it("tile: Longest-match saturates while Sequitur climbs", () => {
    const s = getSweep("tile");
    const at16 = s.points.find((p) => p.scale === 16)!;
    const long = at16.byAlg.longest!.d;
    const seq = at16.byAlg.sequitur!.d;
    assert.ok(seq > long * 1.5, `Sequitur ${seq} vs Longest ${long}`);
  });

  it("unary: RLE D = n/2, unbounded", () => {
    const s = getSweep("unary");
    for (const p of s.points) {
      assert.equal(p.byAlg.rle!.d, p.n / 2);
    }
    const last = s.points.at(-1)!;
    const first = s.points[0]!;
    assert.ok(last.byAlg.rle!.d > first.byAlg.rle!.d);
  });

  it("nested: Sequitur beats Bisection (structure not at midpoints)", () => {
    const s = getSweep("nested");
    const p = s.points.at(-1)!;
    assert.ok(p.byAlg.sequitur!.d > p.byAlg.bisection!.d * 2);
  });

  it("fibonacci: density grows without tandem runs", () => {
    const s = getSweep("fibonacci");
    const a = s.points[0]!.byAlg.sequitur!.d;
    const b = s.points.at(-1)!.byAlg.sequitur!.d;
    assert.ok(b > a * 2, `F4 D=${a} vs last D=${b}`);
  });

  it("random: every grammar stays near 1 at every length", () => {
    const s = getSweep("random");
    for (const p of s.points) {
      for (const [id, samp] of Object.entries(p.byAlg)) {
        if (!samp || id === "literal") continue;
        assert.ok(samp.d < 1.15, `${id} at n=${p.n} D=${samp.d}`);
        assert.equal(samp.ok, true);
      }
    }
  });

  it("reconstruction holds across every measured point", () => {
    for (const id of ["tile", "unary", "nested", "fibonacci", "random"] as const) {
      const s = getSweep(id);
      for (const p of s.points) {
        for (const [alg, samp] of Object.entries(p.byAlg)) {
          assert.equal(samp?.ok, true, `${id} ${p.label} ${alg}`);
        }
      }
    }
  });
});
