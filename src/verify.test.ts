import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runRle, runRepair, runSequitur } from "./algorithms";
import { CORPORA } from "./corpora";
import { expand } from "./grammar";
import {
  densityFromGrammar,
  digest,
  isAcyclic,
  oracleFor,
  reconstructionPath,
  sequiturUtility,
  tamperOneTerminal,
  verify,
} from "./verify";

const tile = CORPORA.find((c) => c.id === "repeat")!.text;

describe("verification mechanisms", () => {
  it("identity passes with the original and is unknown without it", () => {
    const r = runSequitur(tile);
    const withS = verify(r, oracleFor("original", tile));
    const digestOnly = verify(r, oracleFor("digest", tile));
    const none = verify(r, oracleFor("none", tile));
    assert.equal(withS.checks.find((c) => c.id === "identity")?.status, "pass");
    assert.equal(digestOnly.checks.find((c) => c.id === "identity")?.status, "unknown");
    assert.equal(none.checks.find((c) => c.id === "identity")?.status, "unknown");
    assert.equal(withS.verdict, true);
    assert.equal(digestOnly.verdict, true);
    assert.equal(none.verdict, true);
  });

  it("digest survives discarding the original; a wrong digest fails", () => {
    const r = runRepair(tile);
    const ok = verify(r, oracleFor("digest", tile));
    assert.equal(ok.checks.find((c) => c.id === "digest")?.status, "pass");
    const bad = verify(r, { kind: "digest", digest: "deadbeef" });
    assert.equal(bad.checks.find((c) => c.id === "digest")?.status, "fail");
    assert.equal(bad.verdict, false);
  });

  it("invariants do not consult the original", () => {
    const r = runSequitur(tile);
    const none = verify(r, oracleFor("none", tile));
    assert.equal(none.checks.find((c) => c.id === "utility")?.status, "pass");
    assert.equal(none.checks.find((c) => c.id === "acyclic")?.status, "pass");
    assert.equal(sequiturUtility(r.rules), true);
    assert.equal(isAcyclic(r.rules, r.start), true);
  });

  it("tampering a terminal kills identity and digest; Sequitur utility still holds", () => {
    const r = runSequitur(tile);
    const dirty = tamperOneTerminal(r, tile);
    assert.equal(dirty.ok, false);
    assert.notEqual(dirty.reconstructed, tile);
    const report = verify(dirty, oracleFor("original", tile));
    assert.equal(report.checks.find((c) => c.id === "identity")?.status, "fail");
    assert.equal(report.checks.find((c) => c.id === "digest")?.status, "fail");
    assert.equal(report.checks.find((c) => c.id === "utility")?.status, "pass");
    assert.equal(report.verdict, false);
  });

  it("RLE reconstruction is a decoder, not expand()", () => {
    const r = runRle("aaaabbc");
    assert.equal(r.ok, true);
    assert.equal(r.reconstructed, "aaaabbc");
    assert.notEqual(expand(r.rules, r.start), r.reconstructed);
    assert.equal(reconstructionPath(r), "decoder");
    const slp = runSequitur(tile);
    assert.equal(reconstructionPath(slp), "slp");
  });

  it("density from the grammar equals measured D without needing the original", () => {
    const r = runRepair(tile);
    assert.equal(densityFromGrammar(r), r.density);
    const none = verify(r, oracleFor("none", tile));
    const metric = none.checks.find((c) => c.id === "metric")!;
    assert.equal(metric.status, "pass");
    assert.equal(metric.needs, "none");
  });

  it("without an oracle, tampering does not fail the report — that is the hole", () => {
    const r = runSequitur(tile);
    const dirty = tamperOneTerminal(r, tile);
    assert.equal(dirty.ok, false);
    const none = verify(dirty, oracleFor("none", tile));
    assert.equal(none.checks.find((c) => c.id === "identity")?.status, "unknown");
    assert.equal(none.failed.length, 0);
    assert.equal(none.verdict, true);
  });

  it("digest is stable and collision-distinct on these corpora", () => {
    const a = digest("abcabcabc");
    const b = digest("abcabcabd");
    assert.equal(a, digest("abcabcabc"));
    assert.notEqual(a, b);
    assert.match(a, /^[0-9a-f]{8}$/);
  });
});
