import {
  type AlgorithmStep,
  type CompressionResult,
  type Nonterm,
  type Rule,
  type Sym,
  chars,
  cloneRules,
  finish,
  literalGrammar,
  ntName,
  nonterm,
  symKey,
  term,
} from "./grammar";



export type AlgorithmFamily =
  | "baseline"
  | "run"
  | "dictionary"
  | "grammar"
  | "tokenizer";

export interface AlgorithmDef {
  id: string;
  name: string;
  year: number;
  authors: string;
  family: AlgorithmFamily;
  blurb: string;
  how: string;
  invariants: string[];
  complexity: string;
  approximation: string;
  run: (input: string) => CompressionResult;
}

function snapshotFrom(start: Sym[], rules: Map<string, Sym[]>, label: string): AlgorithmStep {
  const list: Rule[] = [{ lhs: "S", rhs: [...start] }];
  for (const [lhs, rhs] of rules) list.push({ lhs, rhs: [...rhs] });
  return { label, rules: cloneRules(list) };
}

function pack(
  id: string,
  input: string,
  start: Sym[],
  produced: Map<string, Sym[]>,
  steps: AlgorithmStep[],
): CompressionResult {
  const rules: Rule[] = [{ lhs: "S", rhs: [...start] }];
  for (const [lhs, rhs] of produced) rules.push({ lhs, rhs: [...rhs] });
  return finish(id, input, rules, "S", steps);
}

/** Baseline: the string is the state. Density is always 1. */
export function runLiteral(input: string): CompressionResult {
  return finish("literal", input, literalGrammar(input), "S");
}

/**
 * Run-length encoding as an RLCFG: each run is a pair (symbol, count),
 * encoded as a rule whose size is 2 — the literature's run-length production.
 */
export function runRle(input: string): CompressionResult {
  const c = chars(input);
  if (c.length === 0) return finish("rle", input, [{ lhs: "S", rhs: [] }], "S");

  const rhs: Sym[] = [];
  let i = 0;
  while (i < c.length) {
    let j = i + 1;
    while (j < c.length && c[j] === c[i]) j++;
    rhs.push(term(c[i]!));
    rhs.push(term(String(j - i)));
    i = j;
  }

  const reconstructed = (() => {
    let out = "";
    for (let k = 0; k < rhs.length; k += 2) {
      const ch = rhs[k]!.v;
      const n = Number(rhs[k + 1]!.v);
      out += ch.repeat(Number.isFinite(n) ? n : 0);
    }
    return out;
  })();

  const rules: Rule[] = [{ lhs: "S", rhs }];
  const size = rhs.length;
  const n = c.length;
  return {
    algorithmId: "rle",
    rules,
    start: "S",
    inputLength: n,
    grammarSize: size,
    ruleCount: 1,
    depth: 1,
    reconstructed,
    ok: reconstructed === input,
    density: size === 0 ? 0 : n / size,
    steps: [],
  };
}


/**
 * Re-Pair (Larsson & Moffat, 1999). Recursively replace a most-frequent
 * adjacent pair until no pair repeats. Output is a straight-line program.
 */
export function runRepair(input: string): CompressionResult {
  let seq: Sym[] = chars(input).map(term);
  const produced = new Map<string, Sym[]>();
  const steps: AlgorithmStep[] = [];
  let nti = 0;

  function pairKey(a: Sym, b: Sym): string {
    return `${symKey(a)}\0${symKey(b)}`;
  }

  function mostFrequent(): { a: Sym; b: Sym; count: number } | null {
    const freq = new Map<string, { a: Sym; b: Sym; count: number }>();
    let i = 0;
    while (i < seq.length - 1) {
      const a = seq[i]!;
      const b = seq[i + 1]!;
      const k = pairKey(a, b);
      const cur = freq.get(k);
      if (cur) cur.count += 1;
      else freq.set(k, { a, b, count: 1 });
      // Non-overlapping count for identical symbols (aaaa → two aa pairs).
      if (symKey(a) === symKey(b)) i += 2;
      else i += 1;
    }
    let best: { a: Sym; b: Sym; count: number } | null = null;
    for (const v of freq.values()) {
      if (!best || v.count > best.count) best = v;
    }
    return best && best.count >= 2 ? best : null;
  }

  let guard = 0;
  while (guard++ < 4000) {
    const best = mostFrequent();
    if (!best) break;
    const name = ntName(nti++);
    const nt: Nonterm = nonterm(name);
    produced.set(name, [best.a, best.b]);
    const next: Sym[] = [];
    for (let i = 0; i < seq.length; ) {
      if (
        i < seq.length - 1 &&
        symKey(seq[i]!) === symKey(best.a) &&
        symKey(seq[i + 1]!) === symKey(best.b)
      ) {
        next.push(nt);
        i += 2;
      } else {
        next.push(seq[i]!);
        i += 1;
      }
    }
    seq = next;
    if (steps.length < 48) {
      steps.push(
        snapshotFrom(seq, produced, `${name} → ${fmtPair(best.a, best.b)}  (${best.count}×)`),
      );
    }
    if (seq.length === 0) break;

  }

  return pack("repair", input, seq, produced, steps);
}

function fmtPair(a: Sym, b: Sym): string {
  const show = (s: Sym) => (s.k === "t" ? (s.v === " " ? "·" : s.v) : s.v);
  return `${show(a)} ${show(b)}`;
}

/**
 * Byte-pair encoding as used by tokenizers: Re-Pair stopped after a
 * fixed number of merges. Same mechanism, different stopping rule.
 */
export function runBpe(input: string, merges = 40): CompressionResult {
  let seq: Sym[] = chars(input).map(term);
  const produced = new Map<string, Sym[]>();
  const steps: AlgorithmStep[] = [];
  let nti = 0;

  function pairKey(a: Sym, b: Sym): string {
    return `${symKey(a)}\0${symKey(b)}`;
  }

  function mostFrequent(): { a: Sym; b: Sym; count: number } | null {
    const freq = new Map<string, { a: Sym; b: Sym; count: number }>();
    for (let i = 0; i < seq.length - 1; i++) {
      const a = seq[i]!;
      const b = seq[i + 1]!;
      const k = pairKey(a, b);
      const cur = freq.get(k);
      if (cur) cur.count += 1;
      else freq.set(k, { a, b, count: 1 });
    }
    let best: { a: Sym; b: Sym; count: number } | null = null;
    for (const v of freq.values()) {
      if (!best || v.count > best.count) best = v;
    }
    return best && best.count >= 2 ? best : null;
  }

  for (let m = 0; m < merges; m++) {
    const best = mostFrequent();
    if (!best) break;
    const name = ntName(nti++);
    const nt = nonterm(name);
    produced.set(name, [best.a, best.b]);
    const next: Sym[] = [];
    for (let i = 0; i < seq.length; ) {
      if (
        i < seq.length - 1 &&
        symKey(seq[i]!) === symKey(best.a) &&
        symKey(seq[i + 1]!) === symKey(best.b)
      ) {
        next.push(nt);
        i += 2;
      } else {
        next.push(seq[i]!);
        i += 1;
      }
    }
    seq = next;
    if (steps.length < 48) {
      steps.push(snapshotFrom(seq, produced, `merge ${m + 1}: ${name} → ${fmtPair(best.a, best.b)}`));
    }
  }

  return pack("bpe", input, seq, produced, steps);
}

/**
 * Sequitur (Nevill-Manning & Witten, 1997). Online grammar inference
 * maintaining digram uniqueness and rule utility.
 */
export function runSequitur(input: string): CompressionResult {
  const start: Sym[] = [];
  const produced = new Map<string, Sym[]>();
  const steps: AlgorithmStep[] = [];
  let nti = 0;

  const seqOf = (owner: string): Sym[] => (owner === "S" ? start : produced.get(owner)!);

  const owners = (): string[] => ["S", ...produced.keys()];

  function nonOverlap(occs: { owner: string; i: number }[]): { owner: string; i: number }[] {
    const by = new Map<string, { owner: string; i: number }[]>();
    for (const o of occs) {
      const arr = by.get(o.owner) ?? [];
      arr.push(o);
      by.set(o.owner, arr);
    }
    const kept: { owner: string; i: number }[] = [];
    for (const arr of by.values()) {
      arr.sort((a, b) => a.i - b.i);
      let lastEnd = -1;
      for (const o of arr) {
        if (o.i >= lastEnd) {
          kept.push(o);
          lastEnd = o.i + 2;
        }
      }
    }
    return kept;
  }

  function findDigrams(): Map<string, { owner: string; i: number }[]> {
    const m = new Map<string, { owner: string; i: number }[]>();
    for (const owner of owners()) {
      const seq = seqOf(owner);
      if (!seq) continue;
      for (let i = 0; i < seq.length - 1; i++) {
        const key = `${symKey(seq[i]!)}|${symKey(seq[i + 1]!)}`;
        const arr = m.get(key) ?? [];
        arr.push({ owner, i });
        m.set(key, arr);
      }
    }
    return m;
  }

  function writeSeq(owner: string, next: Sym[]) {
    if (owner === "S") {
      start.length = 0;
      start.push(...next);
    } else {
      produced.set(owner, next);
    }
  }

  function replaceDigram(a: Sym, b: Sym, nt: Nonterm, skipOwner?: string) {
    for (const owner of owners()) {
      if (owner === skipOwner) continue;
      const seq = seqOf(owner);
      if (!seq) continue;
      const next: Sym[] = [];
      for (let i = 0; i < seq.length; ) {
        if (
          i < seq.length - 1 &&
          symKey(seq[i]!) === symKey(a) &&
          symKey(seq[i + 1]!) === symKey(b)
        ) {
          next.push(nt);
          i += 2;
        } else {
          next.push(seq[i]!);
          i += 1;
        }
      }
      writeSeq(owner, next);
    }
  }

  function countRefs(name: string): number {
    let c = 0;
    for (const owner of owners()) {
      const seq = seqOf(owner);
      if (!seq) continue;
      for (const s of seq) if (s.k === "n" && s.v === name) c++;
    }
    return c;
  }

  function inlineRule(name: string) {
    const body = produced.get(name);
    if (!body) return;
    for (const owner of owners()) {
      if (owner === name) continue;
      const seq = seqOf(owner);
      if (!seq) continue;
      const next: Sym[] = [];
      for (const s of seq) {
        if (s.k === "n" && s.v === name) next.push(...body);
        else next.push(s);
      }
      writeSeq(owner, next);
    }
    produced.delete(name);
  }

  function enforce() {
    let guard = 0;
    while (guard++ < 8000) {
      let progressed = false;
      const digrams = findDigrams();
      for (const occsRaw of digrams.values()) {
        const occs = nonOverlap(occsRaw);
        if (occs.length < 2) continue;
        const head = occs[0]!;
        const seq = seqOf(head.owner);
        const a = seq[head.i]!;
        const b = seq[head.i + 1]!;
        let existing: string | undefined;
        for (const [name, rhs] of produced) {
          if (
            rhs.length === 2 &&
            symKey(rhs[0]!) === symKey(a) &&
            symKey(rhs[1]!) === symKey(b)
          ) {
            existing = name;
            break;
          }
        }
        if (existing) {
          replaceDigram(a, b, nonterm(existing), existing);
        } else {
          const name = ntName(nti++);
          produced.set(name, [a, b]);
          replaceDigram(a, b, nonterm(name), name);
          if (steps.length < 48) {
            steps.push(snapshotFrom(start, produced, `${name} → ${fmtPair(a, b)}`));
          }
        }
        progressed = true;
        break;
      }
      if (progressed) continue;

      let inlined = false;
      for (const name of [...produced.keys()]) {
        if (countRefs(name) < 2) {
          inlineRule(name);
          inlined = true;
          break;
        }
      }
      if (inlined) continue;
      break;
    }
  }

  for (const ch of chars(input)) {
    start.push(term(ch));
    enforce();
  }

  return pack("sequitur", input, start, produced, steps);
}

/**
 * LZ78 (Ziv & Lempel, 1978) as a grammar: each new phrase is a binary
 * rule X_i → X_j a, and S is the concatenation of emitted phrases.
 */
export function runLz78(input: string): CompressionResult {
  const c = chars(input);
  const dict = new Map<string, number>([[ "", 0 ]]);
  let next = 1;
  const phrases: { prefix: number; ch: string }[] = [];
  let i = 0;
  while (i < c.length) {
    let cur = "";
    let last = 0;
    let j = i;
    while (j < c.length && dict.has(cur + c[j])) {
      cur += c[j];
      last = dict.get(cur)!;
      j++;
    }
    if (j < c.length) {
      const ch = c[j]!;
      phrases.push({ prefix: last, ch });
      dict.set(cur + ch, next++);
      i = j + 1;
    } else {
      if (cur.length) phrases.push({ prefix: last, ch: "" });
      break;
    }
  }

  const produced = new Map<string, Sym[]>();
  const start: Sym[] = [];
  for (let p = 0; p < phrases.length; p++) {
    const name = `P${p + 1}`;
    const ph = phrases[p]!;
    const rhs: Sym[] = [];
    if (ph.prefix > 0) rhs.push(nonterm(`P${ph.prefix}`));
    if (ph.ch) rhs.push(term(ph.ch));
    if (rhs.length === 0) rhs.push(term(""));
    produced.set(name, rhs);
    start.push(nonterm(name));
  }

  return pack("lz78", input, start, produced, []);
}

/**
 * LZW (Welch, 1984). Dictionary preloaded with the alphabet; output is
 * a stream of dictionary indices, each index a reference to a phrase.
 */
export function runLzw(input: string): CompressionResult {
  const c = chars(input);
  if (c.length === 0) return pack("lzw", input, [], new Map(), []);

  const alphabet: string[] = [];
  const seen = new Set<string>();
  for (const ch of c) {
    if (!seen.has(ch)) {
      seen.add(ch);
      alphabet.push(ch);
    }
  }

  const dict = new Map<string, number>();
  alphabet.forEach((ch, i) => dict.set(ch, i));
  let next = alphabet.length;
  const codes: number[] = [];
  const entries: string[] = [...alphabet];

  let w = c[0]!;
  for (let i = 1; i < c.length; i++) {
    const ch = c[i]!;
    const wc = w + ch;
    if (dict.has(wc)) {
      w = wc;
    } else {
      codes.push(dict.get(w)!);
      dict.set(wc, next++);
      entries.push(wc);
      w = ch;
    }
  }
  codes.push(dict.get(w)!);

  const produced = new Map<string, Sym[]>();
  alphabet.forEach((ch, i) => {
    produced.set(`P${i}`, [term(ch)]);
  });
  for (let i = alphabet.length; i < entries.length; i++) {
    const phrase = entries[i]!;
    // phrase = some previous entry + one char. Recover by scan.
    let prefixIdx = -1;
    for (let k = i - 1; k >= 0; k--) {
      const e = entries[k]!;
      if (phrase.startsWith(e) && phrase.length === e.length + 1) {
        prefixIdx = k;
        break;
      }
    }
    const rhs: Sym[] = [];
    if (prefixIdx >= 0) {
      rhs.push(nonterm(`P${prefixIdx}`));
      rhs.push(term(phrase.slice(-1)));
    } else {
      for (const ch of chars(phrase)) rhs.push(term(ch));
    }
    produced.set(`P${i}`, rhs);
  }

  const start = codes.map((code) => nonterm(`P${code}`));
  return pack("lzw", input, start, produced, []);
}

/**
 * Bisection (Kieffer & Yang). Balanced split; share a nonterminal when
 * the two halves of a node are equal. Yields a balanced SLP.
 */
export function runBisection(input: string): CompressionResult {
  const c = chars(input);
  const produced = new Map<string, Sym[]>();
  const memo = new Map<string, string>();
  let nti = 0;

  function build(slice: string[]): Sym {
    if (slice.length === 0) return term("");
    if (slice.length === 1) return term(slice[0]!);
    const key = slice.join("\0");
    const hit = memo.get(key);
    if (hit) return nonterm(hit);

    const mid = Math.ceil(slice.length / 2);
    const left = slice.slice(0, mid);
    const right = slice.slice(mid);
    const name = ntName(nti++);
    memo.set(key, name);

    const L = build(left);
    const same =
      left.length === right.length && left.every((ch, i) => ch === right[i]);
    const R = same ? L : build(right);
    produced.set(name, [L, R]);
    return nonterm(name);
  }

  const root = c.length === 0 ? null : build(c);
  const start: Sym[] = root ? [root] : [];
  return pack("bisection", input, start, produced, []);
}

/**
 * Longest-match heuristic: repeatedly replace a longest non-overlapping
 * repeated substring of length ≥ 2. Contrasts with Re-Pair (most frequent pair).
 */
export function runLongest(input: string): CompressionResult {
  let seq: Sym[] = chars(input).map(term);
  const produced = new Map<string, Sym[]>();
  const steps: AlgorithmStep[] = [];
  let nti = 0;

  function asKey(s: Sym): string {
    return symKey(s);
  }

  function findLongest(): { span: Sym[]; count: number } | null {
    const n = seq.length;
    const maxLen = Math.min(96, Math.floor(n / 2));
    for (let len = maxLen; len >= 2; len--) {
      const pos = new Map<string, number[]>();
      for (let i = 0; i + len <= n; i++) {
        let k = "";
        for (let j = 0; j < len; j++) k += asKey(seq[i + j]!) + "|";
        const arr = pos.get(k) ?? [];
        arr.push(i);
        pos.set(k, arr);
      }
      let best: { span: Sym[]; count: number } | null = null;
      for (const indexes of pos.values()) {
        if (indexes.length < 2) continue;
        // Greedy non-overlapping.
        let count = 0;
        let lastEnd = -1;
        const kept: number[] = [];
        for (const i of indexes) {
          if (i >= lastEnd) {
            kept.push(i);
            lastEnd = i + len;
            count++;
          }
        }
        if (count >= 2 && (!best || count > best.count)) {
          best = { span: seq.slice(kept[0], kept[0]! + len), count };
        }
      }
      if (best) return best;
    }
    return null;
  }

  let guard = 0;
  while (guard++ < 400) {
    const hit = findLongest();
    if (!hit) break;
    const name = ntName(nti++);
    const nt = nonterm(name);
    produced.set(name, [...hit.span]);
    const len = hit.span.length;
    const needle = hit.span.map((s) => asKey(s) + "|").join("");
    const next: Sym[] = [];
    for (let i = 0; i < seq.length; ) {
      if (i + len <= seq.length) {
        let k = "";
        for (let j = 0; j < len; j++) k += asKey(seq[i + j]!) + "|";
        if (k === needle) {
          next.push(nt);
          i += len;
          continue;
        }
      }
      next.push(seq[i]!);
      i++;
    }
    if (next.length >= seq.length) break;
    seq = next;
    if (steps.length < 36) {
      steps.push(
        snapshotFrom(seq, produced, `${name} ← longest ×${hit.count} (len ${len})`),
      );
    }
  }

  return pack("longest", input, seq, produced, steps);
}

export const ALGORITHMS: AlgorithmDef[] = [
  {
    id: "literal",
    name: "Literal",
    year: 0,
    authors: "baseline",
    family: "baseline",
    blurb: "Store the string as-is. Capacity equals state. Density is 1 by definition.",
    how: "S → every character of the input. No inference, no sharing. This is D_baseline.",
    invariants: ["State size = n", "Reconstruction is identity"],
    complexity: "O(n) time and space",
    approximation: "D = 1 always",
    run: runLiteral,
  },
  {
    id: "rle",
    name: "Run-length",
    year: 1967,
    authors: "IEEE / early tape formats",
    family: "run",
    blurb: "The smallest structural move: a run becomes a pair (symbol, count) instead of a wall of copies.",
    how: "Emit (a, k) for each maximal run a^k. Encoded as an RLCFG production of size 2.",
    invariants: ["Loses when there are no runs", "Wins on streaks, scans, silence"],
    complexity: "O(n)",
    approximation: "Optimal for unary runs; blind to every other repetition",
    run: runRle,
  },
  {
    id: "lz78",
    name: "LZ78",
    year: 1978,
    authors: "Ziv & Lempel",
    family: "dictionary",
    blurb: "Grow a dictionary of phrases while scanning. Each new phrase is an old phrase plus one symbol.",
    how: "Greedy longest prefix already in the dictionary; emit (index, next char); insert the extension.",
    invariants: ["Online, one pass", "Phrases are prefix-closed"],
    complexity: "O(n) with a trie",
    approximation: "Charikar et al.: polynomial-factor away from the smallest grammar",
    run: runLz78,
  },
  {
    id: "lzw",
    name: "LZW",
    year: 1984,
    authors: "Terry Welch",
    family: "dictionary",
    blurb: "LZ78 with the alphabet preloaded. GIF, Unix compress, and early PDF all speak this dialect.",
    how: "Initialize the dictionary with every terminal. Emit only indices; the decoder rebuilds the same table.",
    invariants: ["Encoder and decoder stay in lockstep", "No explicit characters after init"],
    complexity: "O(n)",
    approximation: "Same family as LZ78; still not a small-grammar approximation",
    run: runLzw,
  },
  {
    id: "bpe",
    name: "BPE",
    year: 1994,
    authors: "Gage; Sennrich et al. 2016",
    family: "tokenizer",
    blurb: "Re-Pair stopped early. The algorithm behind modern tokenizers — a grammar cut at a vocab budget.",
    how: "Replace the most frequent adjacent pair, 40 times. Same engine as Re-Pair, different halt.",
    invariants: ["Fixed merge budget", "Character-level start"],
    complexity: "O(m n) for m merges",
    approximation: "A truncated Re-Pair; density grows with the budget until pairs die out",
    run: (input) => runBpe(input, 40),
  },
  {
    id: "sequitur",
    name: "Sequitur",
    year: 1997,
    authors: "Nevill-Manning & Witten",
    family: "grammar",
    blurb: "Infer a hierarchical grammar in one left-to-right pass. Hierarchy is the point, not just size.",
    how: "Maintain two constraints: no digram appears twice, every rule is used at least twice.",
    invariants: ["Digram uniqueness", "Rule utility"],
    complexity: "O(n) with linked symbols + a digram index",
    approximation: "Ω(n^{1/3}) in the worst case vs. the smallest grammar",
    run: runSequitur,
  },
  {
    id: "repair",
    name: "Re-Pair",
    year: 1999,
    authors: "Larsson & Moffat",
    family: "grammar",
    blurb: "The practical champion of grammar compression. Recursively pair the most frequent bigram.",
    how: "While some pair occurs twice: replace every non-overlapping occurrence with a fresh nonterminal.",
    invariants: ["Every rule but the axiom has RHS length 2", "Straight-line program"],
    complexity: "O(n) expected with the original arrays; O(n²) in this lab",
    approximation: "O((n / log n)^{2/3}) vs. smallest grammar — best among the classical heuristics",
    run: runRepair,
  },
  {
    id: "bisection",
    name: "Bisection",
    year: 2000,
    authors: "Kieffer & Yang",
    family: "grammar",
    blurb: "A balanced straight-line program. Split in half; share a node only when the two halves match.",
    how: "Recursive midpoint split. Identical halves reuse one nonterminal — a balanced sharing DAG.",
    invariants: ["Depth O(log n)", "Fast random access on the SLP"],
    complexity: "O(n)",
    approximation: "O(√n) — weak as a compressor, strong as a data structure",
    run: runBisection,
  },
  {
    id: "longest",
    name: "Longest match",
    year: 2002,
    authors: "Charikar et al. (heuristic)",
    family: "grammar",
    blurb: "Greedy on length instead of frequency. Pulls out the longest repeated block first.",
    how: "While a substring of length ≥ 2 repeats: replace all non-overlapping copies with one rule.",
    invariants: ["Prefers long motifs over frequent pairs", "Offline"],
    complexity: "O(n²) in this implementation",
    approximation: "Polynomial; complementary to Re-Pair on nested vs. tiled structure",
    run: runLongest,
  },
];

export const ALGORITHM_BY_ID: Record<string, AlgorithmDef> = Object.fromEntries(
  ALGORITHMS.map((a) => [a.id, a]),
);

export function runAlgorithm(id: string, input: string): CompressionResult {
  const def = ALGORITHM_BY_ID[id];
  if (!def) return runLiteral(input);
  return def.run(input);
}

export function runAll(input: string): CompressionResult[] {
  return ALGORITHMS.map((a) => a.run(input));
}
