import { runCompleteProtocol } from "./battery";
import { getSweep, REGIMES } from "./limits";
import { evolve, pointSeed, caDensity, caStateSize } from "./ca/elementary";
import { CORPORA } from "./corpora";
import { runSequitur, runRepair } from "./algorithms";
import { oracleFor, tamperOneTerminal, verify } from "./verify";
import { ENGINES, getTrace } from "./thermo";
import { closestToCeiling, getFloorTrace, theoremL, theoremS, theoremT } from "./thermoLimits";
import { AXIOM_VERSION, evaluateNine, ninePass } from "./nine";
import { evaluateRatio, ratioPass } from "./ratio";
import { evaluateRepair, repairPass } from "./repair";
import { PREDICT_VERDICT, evaluatePredict, predictPass } from "./predict";
import { LAW_VERDICT, PHASE2_FROZEN_ON, PHASE2_STATUS, PHASE_B_VERDICT, QUESTION } from "./phase2";

const cmd = process.argv[2] ?? "battery";

if (cmd === "battery") {
  const r = runCompleteProtocol();
  console.log(r.verdict ? "PASS" : "FAIL", `${r.passed}/${r.total}`, `${r.elapsedMs} ms`);
  for (const s of r.suites) {
    console.log(`  ${s.passed}/${s.total}  ${s.name}`);
  }
  console.log(
    `  density  ${r.density.structuredPass}/${r.density.structuredTotal} structured · random D=${r.density.randomBest.toFixed(3)}`,
  );
  process.exit(r.verdict ? 0 : 1);
}

if (cmd === "limits") {
  for (const regime of REGIMES) {
    const s = getSweep(regime.id);
    const last = s.points.at(-1)!;
    const seq = last.byAlg.sequitur;
    const rle = last.byAlg.rle;
    console.log(
      `${regime.id.padEnd(12)} n=${String(last.n).padEnd(5)} sequitur D=${seq?.d.toFixed(2) ?? "—"}  rle D=${rle?.d.toFixed(2) ?? "—"}`,
    );
  }
  process.exit(0);
}

if (cmd === "ca") {
  const rule = Number(process.argv[3] ?? 90);
  const t = Number(process.argv[4] ?? 40);
  const seed = pointSeed(2 * t + 1);
  const rows = evolve(rule, seed, t, false);
  const d = caDensity(rows, 1);
  console.log(`rule ${rule}  t=${t}  |G|=${caStateSize(1)}  n=${rows.length * seed.length}  D=${d.toFixed(2)}`);
  process.exit(0);
}

if (cmd === "verify") {
  const tile = CORPORA.find((c) => c.id === "repeat")!.text;
  const r = runSequitur(tile);
  const withS = verify(r, oracleFor("original", tile));
  const digestOnly = verify(r, oracleFor("digest", tile));
  const none = verify(r, oracleFor("none", tile));
  const dirty = tamperOneTerminal(r, tile);
  const hole = verify(dirty, oracleFor("none", tile));
  const caught = verify(dirty, oracleFor("original", tile));
  const rp = runRepair(tile);
  const ok =
    withS.checks.find((c) => c.id === "identity")?.status === "pass" &&
    digestOnly.checks.find((c) => c.id === "identity")?.status === "unknown" &&
    none.checks.find((c) => c.id === "identity")?.status === "unknown" &&
    dirty.ok === false &&
    hole.verdict === true &&
    caught.verdict === false &&
    verify(rp, oracleFor("digest", tile)).checks.find((c) => c.id === "digest")?.status === "pass";
  console.log(ok ? "PASS" : "FAIL", "verify");
  console.log("  identity  original=pass  digest=unknown  none=unknown");
  console.log("  tamper    caught by original, invisible without oracle");
  process.exit(ok ? 0 : 1);
}

if (cmd === "thermo") {
  let ok = true;
  for (const e of ENGINES) {
    const t = getTrace(e.id);
    const last = t.points.at(-1)!;
    console.log(
      `${e.id.padEnd(8)} D=${last.D.toFixed(1).padStart(6)}  A=${last.A.toFixed(2)}  D'=${last.accounted.toFixed(2)}`,
    );
    if (e.id === "koch" && !(last.D > 50 && last.accounted < 1)) ok = false;
    if (e.id === "rule90" && Math.abs(last.A - 1) > 1e-9) ok = false;
    if (e.id === "slp" && last.D <= 1) ok = false;
  }
  console.log(ok ? "PASS" : "FAIL", "thermo");
  process.exit(ok ? 0 : 1);
}

if (cmd === "floor") {
  let ok = true;
  for (const e of ENGINES) {
    const t = getFloorTrace(e.id);
    const last = t.points.at(-1)!;
    console.log(
      `${e.id.padEnd(8)} D=${last.D.toFixed(1).padStart(6)}  D'=${last.accounted.toFixed(2)}  D_L=${last.landauer.toFixed(2)}`,
    );
    if (!theoremL(t.points)) ok = false;
  }
  if (!theoremT("koch") || !theoremT("rule90") || !theoremS()) ok = false;
  const best = closestToCeiling();
  console.log(`closest ${best.id} D_L=${best.landauer.toFixed(2)}`);
  console.log(ok ? "PASS" : "FAIL", "floor");
  process.exit(ok ? 0 : 1);
}

if (cmd === "spec") {
  console.log(PHASE2_STATUS.toUpperCase(), PHASE2_FROZEN_ON);
  console.log(LAW_VERDICT);
  console.log("Phase B", PHASE_B_VERDICT);
  console.log(QUESTION);
  console.log("F1 not executed");
  process.exit(0);
}

if (cmd === "nine") {
  let ok = ninePass();
  for (const c of evaluateNine()) {
    console.log(`${c.ok ? "PASS" : "FAIL"}  ${c.id.padEnd(16)} ${c.detail}`);
    if (!c.ok) ok = false;
  }
  console.log(ok ? "PASS" : "FAIL", `nine v${AXIOM_VERSION}`);
  process.exit(ok ? 0 : 1);
}

if (cmd === "ratio") {
  let ok = ratioPass();
  for (const c of evaluateRatio()) {
    console.log(`${c.ok ? "PASS" : "FAIL"}  ${c.id.padEnd(24)} ${c.detail}`);
    if (!c.ok) ok = false;
  }
  console.log(ok ? "PASS" : "FAIL", "ratio");
  process.exit(ok ? 0 : 1);
}

if (cmd === "repair") {
  let ok = repairPass();
  for (const c of evaluateRepair()) {
    console.log(`${c.ok ? "PASS" : "FAIL"}  ${c.id.padEnd(22)} ${c.detail}`);
    if (!c.ok) ok = false;
  }
  console.log(ok ? "PASS" : "FAIL", "repair");
  process.exit(ok ? 0 : 1);
}

if (cmd === "predict") {
  let ok = predictPass();
  for (const c of evaluatePredict()) {
    console.log(`${c.ok ? "PASS" : "FAIL"}  ${c.id.padEnd(22)} ${c.detail}`);
    if (!c.ok) ok = false;
  }
  console.log(PREDICT_VERDICT);
  console.log(ok ? "PASS" : "FAIL", "predict");
  process.exit(ok ? 0 : 1);
}

console.error("usage: axiom [battery|limits|ca|verify|thermo|floor|spec|nine|ratio|repair|predict]");
process.exit(2);
