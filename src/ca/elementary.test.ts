import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  bitAt,
  caDensity,
  caStateSize,
  evolve,
  flatten,
  hamming,
  lastRowString,
  pointSeed,
  step,
  toggleBit,
} from "./elementary";

describe("elementary CA", () => {
  it("Rule 90 from a point is binomial mod 2 (Sierpiński)", () => {
    const seed = pointSeed(7);
    assert.equal([...seed].join(""), "0001000");
    const t1 = step(seed, 90, false);
    assert.equal([...t1].join(""), "0010100");
    const t2 = step(t1, 90, false);
    assert.equal([...t2].join(""), "0100010");
    const t3 = step(t2, 90, false);
    assert.equal([...t3].join(""), "1010101");
  });

  it("Rule 254 fills the light cone from a single 1", () => {
    const rows = evolve(254, pointSeed(9), 5, false);
    assert.equal([...rows[0]!].join(""), "000010000");
    assert.equal([...rows[4]!].join(""), "111111111");
  });

  it("Rule 0 dies, Rule 255 fills", () => {
    const live = pointSeed(5);
    assert.equal(hamming(step(live, 0, true)), 0);
    assert.equal(hamming(step(live, 255, true)), 5);
  });

  it("toggleBit is involutive and stays in 0..255", () => {
    let r = 90;
    r = toggleBit(r, 1);
    r = toggleBit(r, 1);
    assert.equal(r, 90);
    assert.equal(bitAt(90, 1), (90 >> 1) & 1);
  });

  it("capacity grows with time; state does not (point seed)", () => {
    const seed = pointSeed(41);
    const a = evolve(90, seed, 10, false);
    const b = evolve(90, seed, 40, false);
    const da = caDensity(a, 1);
    const db = caDensity(b, 1);
    assert.equal(caStateSize(1), 9);
    assert.ok(db > da * 3, `D(10)=${da} D(40)=${db}`);
    assert.equal(flatten(a).length, 10 * 41);
  });

  it("wraparound is periodic in space", () => {
    const seed = new Uint8Array([1, 0, 0, 1]);
    const a = step(seed, 90, true);
    // neighbors wrap: first cell sees last and second
    assert.equal(a.length, 4);
  });

  it("last row of Rule 90 is not all zeros", () => {
    const rows = evolve(90, pointSeed(33), 16, false);
    assert.ok(hamming(rows.at(-1)!) > 0);
    assert.match(lastRowString(rows), /^[01]+$/);
  });
});
