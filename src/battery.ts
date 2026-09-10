import { ALGORITHMS, runAll, runLiteral, runRle, runRepair, runSequitur, runBpe, runLz78, runLzw, runBisection, runLongest } from "./algorithms";
import { CORPORA, type Corpus } from "./corpora";
import { type CompressionResult, type Rule, fmtRhs, grammarSize, expand, chars } from "./grammar";
import { LSYSTEMS, expandLSystem, grammarStateSize } from "./lsystem";

export interface TestResult {
  id: string;
  suite: string;
  name: string;
  ok: boolean;
  detail: string;
}

export interface SuiteSummary {
  id: string;
  name: string;
  blurb: string;
  passed: number;
  total: number;
  failed: TestResult[];
}

export interface MatrixRow {
  corpus: Corpus;
  results: CompressionResult[];
}

export interface ProtocolReport {
  results: TestResult[];
  suites: SuiteSummary[];
  passed: number;
  total: number;
  verdict: boolean;
  matrix: MatrixRow[];
  elapsedMs: number;
  density: {
    structuredPass: number;
    structuredTotal: number;
    randomSane: boolean;
    randomBest: number;
  };
}

const SUITES: { id: string; name: string; blurb: string }[] = [
  {
    id: "reconstruction",
    name: "Reconstruction",
    blurb: "Every algorithm must emit a grammar that expands to the original string.",
  },
  {
    id: "metric",
    name: "Metric identity",
    blurb: "D = n / |G|. |G| is the sum of right-hand-side lengths. No silent drift.",
  },
  {
    id: "baseline",
    name: "Baseline & edges",
    blurb: "Literal density is 1. Empty and singleton strings reconstruct. Unicode runs compress.",
  },
  {
    id: "classic",
    name: "Classic examples",
    blurb: "Published running examples: Sequitur on abcab, Re-Pair’s wiki string, RLE on a run.",
  },
  {
    id: "invariants",
    name: "Grammar invariants",
    blurb: "Re-Pair rules are binary. Sequitur rules are used at least twice. No start-symbol collision.",
  },
  {
    id: "density",
    name: "CAPACITY / STATE",
    blurb: "Structured corpora: some G with D > 1. Random control: D stays near 1.",
  },
  {
    id: "lsystem",
    name: "L-systems",
    blurb: "Finite grammar, unbounded trace. State size is invariant in the iteration count.",
  },
];

function nowMs(): number {
  return Date.now();
}

function countRefs(rules: Rule[], name: string): number {
  let n = 0;
  for (const r of rules) {
    for (const s of r.rhs) if (s.k === "n" && s.v === name) n++;
  }
  return n;
}

function nonStartRules(rules: Rule[]): Rule[] {
  return rules.filter((r) => r.lhs !== "S");
}

function repairBinary(rules: Rule[]): boolean {
  return nonStartRules(rules).every((r) => r.rhs.length === 2);
}

function sequiturUtility(rules: Rule[]): boolean {
  return nonStartRules(rules).every((r) => countRefs(rules, r.lhs) >= 2);
}

function noStartCollision(rules: Rule[]): boolean {
  return nonStartRules(rules).every((r) => r.lhs !== "S");
}

function push(
  out: TestResult[],
  suite: string,
  id: string,
  name: string,
  ok: boolean,
  detail: string,
) {
  out.push({ id, suite, name, ok, detail });
}

let cachedReport: ProtocolReport | null = null;

export function runCompleteProtocol(): ProtocolReport {
  if (cachedReport) return cachedReport;
  const t0 = nowMs();
  const results: TestResult[] = [];
  const matrix: MatrixRow[] = CORPORA.map((corpus) => ({
    corpus,
    results: runAll(corpus.text),
  }));

  for (const row of matrix) {
    for (const r of row.results) {
      const alg = ALGORITHMS.find((a) => a.id === r.algorithmId)?.name ?? r.algorithmId;
      push(
        results,
        "reconstruction",
        `recon:${row.corpus.id}:${r.algorithmId}`,
        `${alg} · ${row.corpus.name}`,
        r.ok && r.reconstructed === row.corpus.text,
        r.ok
          ? `n=${r.inputLength} |G|=${r.grammarSize} D=${r.density.toFixed(3)}`
          : `mismatch: got ${JSON.stringify(r.reconstructed.slice(0, 48))}`,
      );

      const sizeOk = r.grammarSize === grammarSize(r.rules);
      const nOk = r.inputLength === chars(row.corpus.text).length;
      const dOk =
        r.grammarSize === 0
          ? r.density === 0
          : Math.abs(r.density - r.inputLength / r.grammarSize) < 1e-9;
      push(
        results,
        "metric",
        `metric:${row.corpus.id}:${r.algorithmId}`,
        `${alg} · ${row.corpus.name}`,
        sizeOk && nOk && dOk,
        sizeOk && nOk && dOk
          ? `D=${r.density.toFixed(4)} = ${r.inputLength}/${r.grammarSize}`
          : `sizeOk=${sizeOk} nOk=${nOk} dOk=${dOk}`,
      );
    }
  }

  for (const alg of ALGORITHMS) {
    const empty = alg.run("");
    push(
      results,
      "baseline",
      `empty:${alg.id}`,
      `${alg.name} · empty`,
      empty.ok && empty.reconstructed === "",
      empty.ok ? "ε" : "failed empty",
    );
    const one = alg.run("a");
    push(
      results,
      "baseline",
      `unit:${alg.id}`,
      `${alg.name} · singleton`,
      one.ok && one.reconstructed === "a",
      one.ok ? `D=${one.density.toFixed(2)}` : "failed singleton",
    );
  }

  for (const c of CORPORA) {
    const lit = runLiteral(c.text);
    push(
      results,
      "baseline",
      `literal-d:${c.id}`,
      `Literal D=1 · ${c.name}`,
      lit.ok && Math.abs(lit.density - 1) < 1e-9,
      `D=${lit.density}`,
    );
  }

  const rleUni = runRle("ééé");
  push(
    results,
    "baseline",
    "rle:unicode",
    "RLE · unicode run",
    rleUni.ok && rleUni.reconstructed === "ééé" && rleUni.grammarSize === 2,
    rleUni.ok ? `|G|=${rleUni.grammarSize}` : "failed",
  );

  const rle = runRle("aaaabbc");
  push(
    results,
    "classic",
    "rle:runs",
    "RLE · aaaabbc",
    rle.ok && rle.reconstructed === "aaaabbc" && rle.grammarSize === 6,
    `S → ${fmtRhs(rle.rules[0]?.rhs ?? [])}`,
  );

  const seqWiki = runSequitur("abcab");
  const seqRhs = seqWiki.rules.map((r) => `${r.lhs} → ${fmtRhs(r.rhs)}`).join(" · ");
  const hasA = seqWiki.rules.some((r) => r.lhs !== "S" && r.rhs.length === 2);
  push(
    results,
    "classic",
    "sequitur:abcab",
    "Sequitur · abcab",
    seqWiki.ok && seqWiki.rules.length === 2 && hasA,
    seqRhs,
  );

  const seqTile = runSequitur("abcabcabc");
  push(
    results,
    "classic",
    "sequitur:tile",
    "Sequitur · abcabcabc",
    seqTile.ok && seqTile.density > 1,
    `D=${seqTile.density.toFixed(3)} |G|=${seqTile.grammarSize}`,
  );

  const rpWiki = runRepair("xabcabcy123123zabcabc");
  push(
    results,
    "classic",
    "repair:wiki",
    "Re-Pair · wiki string",
    rpWiki.ok && rpWiki.density > 1 && repairBinary(rpWiki.rules),
    `D=${rpWiki.density.toFixed(3)} rules=${rpWiki.ruleCount}`,
  );

  const bpe = runBpe("abcabcabcabc");
  push(
    results,
    "classic",
    "bpe:tile",
    "BPE · 40 merges on a tile",
    bpe.ok && bpe.density > 1,
    `D=${bpe.density.toFixed(3)}`,
  );

  push(results, "classic", "lz78:abab", "LZ78 · abababab", runLz78("abababab").ok, "reconstruct");
  push(results, "classic", "lzw:abab", "LZW · abababab", runLzw("abababab").ok, "reconstruct");
  push(results, "classic", "bisect:aaaa", "Bisection · aaaa", runBisection("aaaa").ok, "reconstruct");
  push(
    results,
    "classic",
    "longest:tile",
    "Longest match · abcabcabcabc",
    runLongest("abcabcabcabc").ok,
    "reconstruct",
  );

  for (const row of matrix) {
    const seq = row.results.find((r) => r.algorithmId === "sequitur")!;
    const rp = row.results.find((r) => r.algorithmId === "repair")!;
    const bpeRow = row.results.find((r) => r.algorithmId === "bpe")!;
    push(
      results,
      "invariants",
      `seq-util:${row.corpus.id}`,
      `Sequitur utility · ${row.corpus.name}`,
      sequiturUtility(seq.rules),
      sequiturUtility(seq.rules)
        ? `${nonStartRules(seq.rules).length} rules, each used ≥2`
        : "a rule is used fewer than twice",
    );
    push(
      results,
      "invariants",
      `seq-start:${row.corpus.id}`,
      `Sequitur start · ${row.corpus.name}`,
      noStartCollision(seq.rules),
      noStartCollision(seq.rules) ? "no S collision" : "nonterminal named S",
    );
    push(
      results,
      "invariants",
      `repair-bin:${row.corpus.id}`,
      `Re-Pair binary · ${row.corpus.name}`,
      repairBinary(rp.rules),
      repairBinary(rp.rules) ? "all non-S RHS length 2" : "a non-S rule is not binary",
    );
    push(
      results,
      "invariants",
      `bpe-bin:${row.corpus.id}`,
      `BPE binary · ${row.corpus.name}`,
      repairBinary(bpeRow.rules),
      repairBinary(bpeRow.rules) ? "all non-S RHS length 2" : "a non-S rule is not binary",
    );
  }

  let structuredPass = 0;
  let structuredTotal = 0;
  let randomBest = 1;
  let randomSane = true;

  for (const row of matrix) {
    const lit = row.results.find((r) => r.algorithmId === "literal")!;
    const rest = row.results.filter((r) => r.algorithmId !== "literal");
    const best = rest.reduce((a, b) => (a.density > b.density ? a : b));
    if (row.corpus.klass === "random") {
      randomBest = best.density;
      randomSane = best.density < 1.15;
      push(
        results,
        "density",
        "density:random",
        "Negative control · incompressible",
        randomSane,
        `best D=${best.density.toFixed(3)} (${best.algorithmId})`,
      );
    } else {
      structuredTotal += 1;
      const ok = best.density > lit.density * 1.02;
      if (ok) structuredPass += 1;
      push(
        results,
        "density",
        `density:${row.corpus.id}`,
        `D > 1 · ${row.corpus.name}`,
        ok,
        `best ${best.algorithmId} D=${best.density.toFixed(3)}`,
      );
    }
  }

  push(
    results,
    "density",
    "density:verdict",
    "CAPACITY/STATE verdict",
    structuredPass === structuredTotal && randomSane,
    `${structuredPass}/${structuredTotal} structured · random ${randomSane ? "sane" : "overfit"}`,
  );

  for (const sys of LSYSTEMS) {
    const s0 = grammarStateSize(sys);
    const w0 = expandLSystem(sys, 0);
    const w1 = expandLSystem(sys, 1);
    const w2 = expandLSystem(sys, 2);
    const s2 = grammarStateSize(sys);
    push(
      results,
      "lsystem",
      `ls:state:${sys.id}`,
      `${sys.name} · state invariant`,
      s0 === s2 && s0 > 0,
      `|G|=${s0} at iter 0 and 2`,
    );
    push(
      results,
      "lsystem",
      `ls:grow:${sys.id}`,
      `${sys.name} · capacity grows`,
      w2.length > w1.length && w1.length >= w0.length,
      `n = ${w0.length} → ${w1.length} → ${w2.length}`,
    );
  }

  const fib = LSYSTEMS.find((s) => s.id === "fibonacci")!;
  const fibLens = [0, 1, 2, 3, 4, 5].map((i) => expandLSystem(fib, i).length);
  const fibOk = [1, 2, 3, 5, 8, 13].every((v, i) => fibLens[i] === v);
  push(
    results,
    "lsystem",
    "ls:fibonacci-len",
    "Algae · Fibonacci lengths",
    fibOk,
    fibLens.join(", "),
  );

  const koch = LSYSTEMS.find((s) => s.id === "koch")!;
  const k1 = expandLSystem(koch, 1);
  push(
    results,
    "lsystem",
    "ls:koch-prod",
    "Koch · one rewrite",
    k1 === "F+F--F+F",
    k1,
  );

  const expandCheck = expand(seqWiki.rules, seqWiki.start) === "abcab";
  push(
    results,
    "classic",
    "expand:sequitur",
    "expand() · Sequitur abcab",
    expandCheck,
    expandCheck ? "round-trip" : "expand drifted",
  );

  const suites: SuiteSummary[] = SUITES.map((s) => {
    const items = results.filter((r) => r.suite === s.id);
    const failed = items.filter((r) => !r.ok);
    return {
      id: s.id,
      name: s.name,
      blurb: s.blurb,
      passed: items.length - failed.length,
      total: items.length,
      failed,
    };
  });

  const passed = results.filter((r) => r.ok).length;
  const total = results.length;
  const verdict = passed === total;

  cachedReport = {
    results,
    suites,
    passed,
    total,
    verdict,
    matrix,
    elapsedMs: nowMs() - t0,
    density: { structuredPass, structuredTotal, randomSane, randomBest },
  };
  return cachedReport;
}
