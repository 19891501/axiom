export type Term = { k: "t"; v: string };
export type Nonterm = { k: "n"; v: string };
export type Sym = Term | Nonterm;

export interface Rule {
  lhs: string;
  rhs: Sym[];
}

export interface AlgorithmStep {
  label: string;
  rules: Rule[];
}

export interface CompressionResult {
  algorithmId: string;
  rules: Rule[];
  start: string;
  inputLength: number;
  grammarSize: number;
  ruleCount: number;
  depth: number;
  reconstructed: string;
  ok: boolean;
  density: number;
  steps: AlgorithmStep[];
}

export function term(v: string): Term {
  return { k: "t", v };
}

export function nonterm(v: string): Nonterm {
  return { k: "n", v };
}

export function isTerm(s: Sym): s is Term {
  return s.k === "t";
}

export function symKey(s: Sym): string {
  return s.k === "t" ? `t:${s.v}` : `n:${s.v}`;
}

export function chars(input: string): string[] {
  return [...input];
}

export function ntName(i: number): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRTUVWXYZ";
  if (i < alphabet.length) return alphabet[i]!;
  return `R${i - alphabet.length + 1}`;
}

export function fmtSym(s: Sym): string {
  if (s.k === "t") {
    if (s.v === " ") return "·";
    if (s.v === "\n") return "↵";
    if (s.v === "\t") return "→";
    return s.v;
  }
  return s.v;
}

export function fmtRhs(rhs: Sym[]): string {
  return rhs.map(fmtSym).join(" ");
}

export function grammarSize(rules: Rule[]): number {
  return rules.reduce((n, r) => n + r.rhs.length, 0);
}

export function grammarDepth(rules: Rule[], start: string): number {
  const map = new Map(rules.map((r) => [r.lhs, r.rhs]));
  const memo = new Map<string, number>();
  const walking = new Set<string>();

  function depthOf(sym: Sym): number {
    if (sym.k === "t") return 0;
    if (memo.has(sym.v)) return memo.get(sym.v)!;
    if (walking.has(sym.v)) return 0;
    walking.add(sym.v);
    const rhs = map.get(sym.v) ?? [];
    const d = rhs.length === 0 ? 0 : 1 + Math.max(0, ...rhs.map(depthOf));
    walking.delete(sym.v);
    memo.set(sym.v, d);
    return d;
  }

  return depthOf(nonterm(start));
}

export function expand(rules: Rule[], start: string): string {
  const map = new Map(rules.map((r) => [r.lhs, r.rhs]));
  const memo = new Map<string, string>();
  const walking = new Set<string>();

  function ex(sym: Sym): string {
    if (sym.k === "t") return sym.v;
    if (memo.has(sym.v)) return memo.get(sym.v)!;
    if (walking.has(sym.v)) return "";
    walking.add(sym.v);
    const rhs = map.get(sym.v) ?? [];
    const out = rhs.map(ex).join("");
    walking.delete(sym.v);
    memo.set(sym.v, out);
    return out;
  }

  return ex(nonterm(start));
}

export function expandOnce(rules: Rule[], start: string): Sym[] {
  const map = new Map(rules.map((r) => [r.lhs, r.rhs]));
  const rhs = map.get(start) ?? [];
  return rhs.flatMap((s) => (s.k === "n" ? (map.get(s.v) ?? [s]) : [s]));
}

export function cloneRules(rules: Rule[]): Rule[] {
  return rules.map((r) => ({ lhs: r.lhs, rhs: r.rhs.map((s) => ({ ...s })) }));
}

export function finish(
  algorithmId: string,
  input: string,
  rules: Rule[],
  start: string,
  steps: AlgorithmStep[] = [],
): CompressionResult {
  const reconstructed = expand(rules, start);
  const size = grammarSize(rules);
  const n = chars(input).length;
  return {
    algorithmId,
    rules,
    start,
    inputLength: n,
    grammarSize: size,
    ruleCount: rules.length,
    depth: grammarDepth(rules, start),
    reconstructed,
    ok: reconstructed === input,
    density: size === 0 ? 0 : n / size,
    steps,
  };
}

export function literalGrammar(input: string): Rule[] {
  return [{ lhs: "S", rhs: chars(input).map(term) }];
}
