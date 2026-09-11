import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ALGORITHMS } from "./algorithms";
import { AXIOM_VERSION, evaluateNine, ninePass, winnerOf } from "./nine";

describe("theory of the nine", () => {
  it("is nine witnesses in five families", () => {
    assert.equal(ALGORITHMS.length, 9);
    const families = new Set(ALGORITHMS.map((a) => a.family));
    assert.deepEqual([...families].sort(), ["baseline", "dictionary", "grammar", "run", "tokenizer"].sort());
  });

  it("tile belongs to grammar; unary to run; nested to grammar; fibonacci still grows", () => {
    assert.equal(winnerOf("tile").family, "grammar");
    assert.equal(winnerOf("unary").family, "run");
    assert.equal(winnerOf("nested").family, "grammar");
    assert.ok(["grammar", "tokenizer"].includes(winnerOf("fibonacci").family));
  });

  it("every claim of the theory holds", () => {
    const claims = evaluateNine();
    for (const c of claims) assert.equal(c.ok, true, `${c.id}: ${c.detail}`);
    assert.equal(ninePass(), true);
    assert.equal(AXIOM_VERSION, "1.0.0");
  });
});
