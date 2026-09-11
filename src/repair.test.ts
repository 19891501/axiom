import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  allAudit,
  evaluateRepair,
  mienoWord,
  repairCanonical,
  repairPass,
} from "./repair";

describe("Re-Pair optimality (Mieno 2022)", () => {
  it("Mieno F_14 has length 377", () => {
    assert.equal(mienoWord(14).length, 377);
  });

  it("canonical productions equal n on F_6…F_14", () => {
    for (const r of allAudit()) {
      assert.equal(r.canonicalOk, true, `F_${r.n} reconstruct`);
      assert.equal(r.canonicalProductions, r.n, `F_${r.n} g*`);
    }
  });

  it("lab |G|_rhs can exceed Sequitur without beating g*", () => {
    const f14 = allAudit().at(-1)!;
    assert.ok(f14.labRhs > f14.sequiturRhs);
    assert.equal(f14.canonicalProductions, 14);
  });

  it("every claim holds", () => {
    for (const c of evaluateRepair()) assert.equal(c.ok, true, `${c.id}: ${c.detail}`);
    assert.equal(repairPass(), true);
  });

  it("does not add a tenth algorithm", () => {
    const r = repairCanonical("abcabc");
    assert.equal(r.algorithmId, "repair-cnf");
  });
});
