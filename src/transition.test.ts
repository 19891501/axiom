import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  TRANSITION_THEORY,
  branchingBisimilar,
  buildLts,
  encode,
  evaluateTransition,
  makeS,
  transitionPass,
} from "./transition";

describe("transition state T1", () => {
  it("every registered claim holds and the theory is NO-GO", () => {
    for (const c of evaluateTransition()) assert.equal(c.ok, true, `${c.id}: ${c.detail}`);
    assert.equal(transitionPass(), true);
    assert.equal(TRANSITION_THEORY, "NO-GO");
  });

  it("branching bisimulation is reflexive on the full K2 LTS", () => {
    const s = makeS();
    const full = encode("full", s);
    const lts = buildLts(full, s, ["export", "index0", "emit"]);
    assert.equal(branchingBisimilar(lts, lts), true);
  });
});
