import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildDoubling,
  buildHierarchy,
  buildMorphism,
  evaluateRatio,
  getRatioSweep,
  ratioPass,
} from "./ratio";

describe("named constructions reconstruct", () => {
  it("hierarchy, doubling, morphism expand to the string", () => {
    assert.equal(buildHierarchy(64).ok, true);
    assert.equal(buildHierarchy(64).grammarSize, 15);
    assert.equal(buildDoubling(128).ok, true);
    assert.equal(buildMorphism(12).ok, true);
    assert.equal(buildMorphism(12).inputLength, 377);
  });
});

describe("ratio claims", () => {
  it("Sequitur saturates the tile hierarchy", () => {
    const last = getRatioSweep("hierarchy").points.at(-1)!;
    const seq = last.cells.find((c) => c.algId === "sequitur")!;
    assert.equal(seq.g, last.refG);
    assert.ok(Math.abs(seq.rho - 1) < 1e-9);
  });

  it("lab Re-Pair is not Mieno-optimal on Fibonacci", () => {
    const last = getRatioSweep("morphism").points.at(-1)!;
    const rep = last.cells.find((c) => c.algId === "repair")!;
    const seq = last.cells.find((c) => c.algId === "sequitur")!;
    assert.ok(rep.g > seq.g);
    assert.ok(rep.rho > 1);
  });

  it("every claim holds", () => {
    for (const c of evaluateRatio()) assert.equal(c.ok, true, `${c.id}: ${c.detail}`);
    assert.equal(ratioPass(), true);
  });
});
