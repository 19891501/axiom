import { runCompleteProtocol } from "./battery";
import { getSweep, REGIMES } from "./limits";
import { evolve, pointSeed, caDensity, caStateSize } from "./ca/elementary";

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

console.error("usage: axiom [battery|limits|ca]");
process.exit(2);
