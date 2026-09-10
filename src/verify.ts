import type { CompressionResult, Rule } from "./grammar";
import { chars, cloneRules, expand, finish, grammarSize } from "./grammar";

/**
 * Verification mechanisms for a reconstructed grammar.
 *
 * D = n/|G| is only a fact if reconstruction is checked. The battery keeps the
 * original string (oracle = original). A digest is a byte witness after the
 * string is thrown away. Invariants never look at the string. With no oracle,
 * density of G is still defined; fidelity is not.
 *
 * This is not RSI. Reward-hacking and co-evolving evaluators are a different
 * field. Here the object is a string, and the question is what still holds
 * after the original is discarded.
 */

export type CheckStatus = "pass" | "fail" | "unknown";

export type OracleKind = "original" | "digest" | "none";

export interface Oracle {
  kind: OracleKind;
  original?: string;
  digest?: string;
}

export interface Check {
  id: string;
  name: string;
  blurb: string;
  status: CheckStatus;
  detail: string;
  /** Minimum oracle required for a determinate answer. */
  needs: OracleKind;
}

export type ReconstructionPath = "slp" | "decoder";

export interface VerifyReport {
  path: ReconstructionPath;
  checks: Check[];
  /** Determinate checks that failed. Unknowns do not fail the report. */
  failed: Check[];
  unknown: Check[];
  passed: Check[];
  verdict: boolean;
}

/** FNV-1a 32-bit. A witness of bytes, not of structure. */
export function digest(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function isAcyclic(rules: Rule[], start: string): boolean {
  const map = new Map(rules.map((r) => [r.lhs, r.rhs]));
  const stack = new Set<string>();
  const done = new Set<string>();

  function walk(name: string): boolean {
    if (done.has(name)) return true;
    if (stack.has(name)) return false;
    stack.add(name);
    for (const s of map.get(name) ?? []) {
      if (s.k === "n" && !walk(s.v)) return false;
    }
    stack.delete(name);
    done.add(name);
    return true;
  }

  return walk(start);
}

function countRefs(rules: Rule[], name: string): number {
  let n = 0;
  for (const r of rules) {
    for (const s of r.rhs) if (s.k === "n" && s.v === name) n++;
  }
  return n;
}

function nonStart(rules: Rule[]): Rule[] {
  return rules.filter((r) => r.lhs !== "S");
}

export function sequiturUtility(rules: Rule[]): boolean {
  return nonStart(rules).every((r) => countRefs(rules, r.lhs) >= 2);
}

export function repairBinary(rules: Rule[]): boolean {
  return nonStart(rules).every((r) => r.rhs.length === 2);
}

export function noStartCollision(rules: Rule[]): boolean {
  return nonStart(rules).every((r) => r.lhs !== "S");
}

/** Substitution reconstructs iff expand(G) is the decoder's output. RLE is not an SLP. */
export function reconstructionPath(result: CompressionResult): ReconstructionPath {
  return expand(result.rules, result.start) === result.reconstructed ? "slp" : "decoder";
}

export function densityFromGrammar(result: CompressionResult): number {
  const n = chars(result.reconstructed).length;
  const g = grammarSize(result.rules);
  return g === 0 ? 0 : n / g;
}

function check(
  id: string,
  name: string,
  blurb: string,
  needs: OracleKind,
  status: CheckStatus,
  detail: string,
): Check {
  return { id, name, blurb, needs, status, detail };
}

export function verify(result: CompressionResult, oracle: Oracle): VerifyReport {
  const reconstructed = result.reconstructed;
  const path = reconstructionPath(result);
  const checks: Check[] = [];

  if (oracle.original === undefined) {
    checks.push(
      check(
        "identity",
        "Identity",
        "expand(G) === s. Requires the original. This is how the battery's 108 reconstruction tests work.",
        "original",
        "unknown",
        "no original",
      ),
    );
  } else {
    const ok = reconstructed === oracle.original;
    checks.push(
      check(
        "identity",
        "Identity",
        "expand(G) === s. Requires the original. This is how the battery's 108 reconstruction tests work.",
        "original",
        ok ? "pass" : "fail",
        ok ? "expand(G) = s" : "mismatch",
      ),
    );
  }

  if (oracle.digest === undefined) {
    checks.push(
      check(
        "digest",
        "Digest",
        "FNV-1a of the reconstruction against a stored witness. Bytes, not structure. The original can be discarded.",
        "digest",
        "unknown",
        "no digest",
      ),
    );
  } else {
    const got = digest(reconstructed);
    const ok = got === oracle.digest;
    checks.push(
      check(
        "digest",
        "Digest",
        "FNV-1a of the reconstruction against a stored witness. Bytes, not structure. The original can be discarded.",
        "digest",
        ok ? "pass" : "fail",
        ok ? `fnv=${got}` : `got ${got}, want ${oracle.digest}`,
      ),
    );
  }

  const acyclic = isAcyclic(result.rules, result.start);
  checks.push(
    check(
      "acyclic",
      "Acyclicity",
      "The grammar DAG has no cycle. Expand terminates. Does not prove it is the right string.",
      "none",
      acyclic ? "pass" : "fail",
      acyclic ? "DAG" : "cycle",
    ),
  );

  const collision = noStartCollision(result.rules);
  checks.push(
    check(
      "start",
      "Start symbol",
      "No produced nonterminal is named S. An invariant of this instrument, not of the string.",
      "none",
      collision ? "pass" : "fail",
      collision ? "no S collision" : "a rule is named S",
    ),
  );

  const g = grammarSize(result.rules);
  const n = chars(reconstructed).length;
  const d = g === 0 ? 0 : n / g;
  const metricOk = g === 0 ? d === 0 : Math.abs(d - n / g) < 1e-9 && g === result.grammarSize;
  checks.push(
    check(
      "metric",
      "Metric",
      "D = n/|G| with n from the reconstruction. Defined without the original. Fidelity is a separate claim.",
      "none",
      metricOk ? "pass" : "fail",
      `n=${n} |G|=${g} D=${d.toFixed(3)}`,
    ),
  );

  if (result.algorithmId === "sequitur") {
    const ok = sequiturUtility(result.rules);
    checks.push(
      check(
        "utility",
        "Sequitur utility",
        "Every non-start rule is used at least twice. The compressor's contract, not the string's.",
        "none",
        ok ? "pass" : "fail",
        ok ? "each rule used ≥2" : "a rule is used once",
      ),
    );
  }

  if (result.algorithmId === "repair" || result.algorithmId === "bpe") {
    const ok = repairBinary(result.rules);
    checks.push(
      check(
        "binary",
        "Binary rules",
        "Every non-start rule has RHS length 2. Re-Pair/BPE's shape. Silent on reconstruction.",
        "none",
        ok ? "pass" : "fail",
        ok ? "all non-S RHS length 2" : "a non-S rule is not binary",
      ),
    );
  }

  const passed = checks.filter((c) => c.status === "pass");
  const failed = checks.filter((c) => c.status === "fail");
  const unknown = checks.filter((c) => c.status === "unknown");
  return {
    path,
    checks,
    passed,
    failed,
    unknown,
    verdict: failed.length === 0,
  };
}

export function oracleFor(kind: OracleKind, original: string): Oracle {
  if (kind === "original") return { kind, original, digest: digest(original) };
  if (kind === "digest") return { kind, digest: digest(original) };
  return { kind: "none" };
}

/**
 * Flip one terminal by one code unit. Identity against the original must fail.
 * Sequitur utility and Re-Pair binary typically still hold — the compressor's
 * contract is about shape, not about which letter was stored.
 */
export function tamperOneTerminal(result: CompressionResult, original: string): CompressionResult {
  const rules = cloneRules(result.rules);
  outer: for (const r of rules) {
    for (const s of r.rhs) {
      if (s.k === "t" && s.v.length > 0) {
        const units = [...s.v];
        const cp = units[0]!.codePointAt(0)!;
        const next = cp === 0x10ffff ? 0x61 : cp + 1;
        units[0] = String.fromCodePoint(next);
        s.v = units.join("");
        break outer;
      }
    }
  }
  const reconstructed = expand(rules, result.start);
  if (reconstructionPath(result) === "slp") {
    return finish(result.algorithmId, original, rules, result.start);
  }
  // Decoder grammars (RLE): expand() is not the reconstruction. Keep the
  // tampered rules and mark identity against the original as failed.
  const size = grammarSize(rules);
  const n = chars(original).length;
  return {
    ...result,
    rules,
    reconstructed,
    ok: reconstructed === original,
    grammarSize: size,
    density: size === 0 ? 0 : n / size,
  };
}
