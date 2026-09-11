/**
 * Phase 2 protocol — frozen 2026-09-10.
 *
 * Not a runner. A metric sheet. C is no longer string length.
 * No experiment has been executed under this protocol.
 *
 * Hard decisions (the other choice is tautology — refused):
 *   1. A is not a human-written program of f. A := M(Q_train).
 *   2. Phase-1 compressor on concatenated pairs is B1, never B2.
 *   3. C is finite. |Q_test| = 128. Totality is not an F1 score.
 *   4. N is frozen before M. Tiny or huge Q_test is a knob, not an exam.
 */

export const PHASE2_STATUS = "frozen" as const;
export const PHASE2_FROZEN_ON = "2026-09-10";
export const LAW_VERDICT = "NO-GO" as const;
export const PHASE_B_VERDICT = "STOP" as const;
export const PHASE_B_FROZEN_ON = "2026-09-11";
export const PHASE_B_QUESTION =
  "min M  subject to  K(M,S) ≥ K₀   — state for a capacity, not for reconstruction";

/** Occupied priors. One would suffice. */
export const PHASE_B_PRIORS = [
  {
    id: "succinct",
    year: 1989,
    who: "Jacobson",
    what: "Rank/select in n + o(n). Exact queries, M < naive store. Test 3, already.",
  },
  {
    id: "functional",
    year: 2010,
    who: "Doshi, Shah, Médard, Effros",
    what: "Functional compression: recover f(X), not X. The question, named.",
  },
  {
    id: "epsilon",
    year: 1994,
    who: "Crutchfield / computational mechanics",
    what: "ε-machine: minimal state consistent with a predictive capacity.",
  },
  {
    id: "ib",
    year: 1999,
    who: "Tishby, Pereira, Bialek",
    what: "Information bottleneck: min I(X;M) under I(M;Y) ≥ K₀.",
  },
  {
    id: "sketch",
    year: 2002,
    who: "Alon–Matias–Szegedy; Cormode–Muthukrishnan",
    what: "Sketches / coresets: M ≪ |S|, K approximate by design.",
  },
] as const;

export const QUESTION =
  "How much capability can a system reconstruct per persistent bit, at what reconstruction cost?";

export const OBJECTIVE = {
  maximize: "C / S",
  subjectTo: "K ≤ K_max",
} as const;

/** Frozen F1 exam size. Split of Ω = {0,1}^8. Not a knob. */
export const F1_L = 8;
export const F1_OMEGA = 256;
export const F1_N = 128;
export const F1_K_MAX = 10_000;
export const F1_MARGIN = 1.02;
export const F1_C_HAT_MIN = 0.9;
export const F1_NEG_C_HAT_MAX = 0.05;
export const F1_FAMILY = "reverse" as const;
export const F1_ALPHABET = "01";

export const AXES = [
  {
    id: "S",
    name: "State",
    def: "Persistent symbols after reconstruction. Primary |G| / code-point count. Secondary UTF-8 bytes. Not the runtime. Not the output.",
  },
  {
    id: "K",
    name: "Reconstruction",
    def: "Work to produce the capability from state, on this query, under convention K3 (Thermo). Unit: symbol-steps. Budget F1_K_MAX = 10000, frozen before any run.",
  },
  {
    id: "C",
    name: "Capability",
    def: "Held-out functional success: count of Q_test keys with reconstruct(A,x)===f(x) and K≤K_max. Not length. Not |expand(G)|. Finite: C ≤ 128.",
  },
] as const;

/**
 * A is a finite persistent artifact of declared type, produced by M.
 * Human-written program of f: TAUTOLOGY. Refused.
 */
export const ARTIFACT = {
  types: "table | slp | prog",
  producedBy: "M(Q_train)",
  humanWrittenProgram: "refused — tautology: measures the author, not induction",
  phase1CompressorOnConcatenatedPairs: "B1, never B2",
  constantA: "kill if hash(M(Q_train_struct)) === hash(M(Q_train_rand))",
} as const;

export const QUERY = {
  alphabet: F1_ALPHABET,
  L: F1_L,
  omega: "{0,1}^8",
  omegaSize: F1_OMEGA,
  fStructured: F1_FAMILY,
  fNegative: "independent random labels on the same Ω",
  nTrain: F1_N,
  nTest: F1_N,
  split:
    "shuffle(Ω, seed); first 128 train; last 128 test; disjoint on x; union = Ω",
  seed: "uint32 declared before M runs; in the certificate",
  mSignature: "M : Q_train → A  (no f id, no Q_test)",
  disjointness: "Q_train ∩ Q_test = ∅ on x",
} as const;

export const C_FORMULA =
  "|{ x ∈ Q_test : reconstruct(A, x) === f(x) && K(A, x) ≤ K_max }|";

export const ACCOUNTING: { where: string; countsAs: "state" | "cost" | "infrastructure" }[] = [
  { where: "weights, parameters, stored tables", countsAs: "state" },
  { where: "the persistent grammar or program", countsAs: "state" },
  { where: "a frozen prompt, seed, or cache kept between queries", countsAs: "state" },
  { where: "environment facts the method is allowed to reread", countsAs: "state" },
  { where: "a task-specific interpreter or decoder", countsAs: "state" },
  { where: "source of an induced prog (JS eval of that source)", countsAs: "state" },
  { where: "eval steps, rewrites, lattice generations", countsAs: "cost" },
  { where: "writing the answer (Landauer floor)", countsAs: "cost" },
  { where: "a general expander / JS runtime shared by every method", countsAs: "infrastructure" },
];

export const BASELINES = [
  {
    id: "B0",
    name: "Direct store",
    how: "Literal table of all of Ω (train∪test), lookup. S = code-point count of canonical x TAB y LF rows. K = |y|. C = 128 on both exams. Train-only B0 is tautology (C=0 on disjoint test) — refused as PASS reference.",
  },
  {
    id: "B1",
    name: "Compress the table",
    how: "Phase-1 Sequitur/RePair on a table, decompress then lookup. Adversary: table = Ω. Candidate: table = Q_train (then C≈0 on unseen keys). Concatenated-pairs compressor is this, never B2.",
  },
  {
    id: "B2",
    name: "Generate",
    how: "A grammar or induced program that computes ŷ(x). S = |G| or |source|. Human-written f is not B2 — tautology, refused. This is Law, scored on C not length.",
  },
  {
    id: "B3",
    name: "Targeted reconstruction",
    how: "From minimal state and the request, rebuild only ŷ(x). K pays this query, not the closure of Ω. Not the whole table.",
  },
] as const;

export const LADDER = [
  { level: 0, name: "Generative traces", exam: "Koch, tiles, Rule 90. Instrument calibration. Cannot win." },
  { level: 1, name: "Functions", exam: "F1. reverse on {0,1}^8, N=128 held-out. First real exam." },
  { level: 2, name: "Function families", exam: "One state, many related functions. Sharing must be shown, not assumed." },
  { level: 3, name: "Composable tasks", exam: "Answers that chain. Reconstruction of a part, not the closure." },
  { level: 4, name: "Novel capability", exam: "A finite held-out set outside the training pairs, still correct, still accounted. Not infinity." },
  { level: 5, name: "A living system", exam: "Agent, model, or store. Own annex. Not this file." },
] as const;

export const F1 = {
  id: "F1",
  name: "Reconstruct a function",
  object:
    "A total function f on Ω={0,1}^8. Artifact A has type table|slp|prog and is produced by M(Q_train) only. Human-written program of f is refused (tautology).",
  S: "Primary: slp |G|=Σ|rhs| (Phase 1 unit); table/prog = code-point count of canonical serialization plus any task-specific decoder. Secondary: UTF-8 bytes. Adversary: a win that vanishes in bytes is kill.",
  C: "|{ x ∈ Q_test : reconstruct(A, x) === f(x) && K(A, x) ≤ K_max }|. Unit: query count, 0..128. Held-out identity, not length, not a hash, not a model grade, not totality.",
  K: "K3. SLP: |G|. Iterative generator: Σ rewrite lengths. Decoder: steps to emit the answer. Lookup: |y|. Unit: symbol-steps.",
  kMax: "10000 symbol-steps per query. Frozen here, before any run. A query over budget scores 0 on that query.",
  negativeControl:
    "Same Ω and N; labels independent of keys (incompressible random pairs). Sane: C/N ≤ 0.05 and C/S ≤ (C/S)_B0. C/S > 1.02 × B0 on random is leak → kill.",
  pass: "On reverse: some method has C/S > 1.02 × (C/S)_B0 in |G| and in bytes, C ≥ 0.9 |Q_test|, identity held, K ≤ K_max, B0–B3 reported, A reproduced from Q_train, A_struct ≠ A_rand, negative control sane.",
  mixed:
    "Protocol intact, identity held, negative sane, C ≥ 0.9 |Q_test|, and the beat of B0 holds in exactly one unit (|G| XOR bytes).",
  fail: "Protocol intact and not PASS/MIXED: no method beats B0, or C < 0.9 |Q_test|, or negative C/N > 0.05 without leak.",
  kill: "Q_test leaked into A. Interpreter specialized to f and not counted. Win vanishes when bytes are the unit. Identity of answers unchecked. Human-written f as A. Phase-1 compressor scored as B2. N or K_max changed after the number.",
} as const;

export const TAUTOLOGIES_REFUSED = [
  "human-written program of f as A (C/S measures the author)",
  "B0 = store Q_train only (C_B0=0 on disjoint Q_test; beating it is tautological)",
  "C defined as length, or as a hash, or as a model grade",
  "C = infinity / totality on all strings (not measurable in a run)",
  "Phase-1 compressor on concatenated pairs scored as B2 (it is B1)",
  "growing or shrinking |Q_test| to set C/S (N=128 is the exam)",
] as const;

export const CERTIFICATE = [
  "hash of artifact A",
  "hash of method M",
  "protocol version (this file's date)",
  "function family / generator seed",
  "Q_train size, Q_test size (the tests themselves are public)",
  "S symbols, S bytes, C, ĉ=C/N, K_max, K per query",
  "baseline scores B0–B3",
  "negative-control row",
  "constant-A check (struct hash ≠ rand hash)",
  "verdict PASS | MIXED | FAIL | kill",
] as const;

export const KILL = [
  "C defined as n, or as a hash, or as a model grade.",
  "A bit of information needed for a query is not in S, not in K, not in infrastructure.",
  "The method reads Q_test.",
  "Criteria changed after seeing the number.",
  "Level 0 (Koch, Sierpiński) offered as a win.",
  "Human-written program of f passed off as induced A.",
  "Phase-1 compressor on concatenated pairs scored as B2.",
  "N or K_max or f chosen after the number.",
] as const;

export function specIsFrozen(): boolean {
  return PHASE2_STATUS === "frozen";
}

export function cIsNotLength(): boolean {
  return !F1.C.includes("|expand") && F1.C.includes("Q_test");
}

export function aIsInduced(): boolean {
  return ARTIFACT.producedBy === "M(Q_train)" && ARTIFACT.humanWrittenProgram.startsWith("refused");
}

export function compressorIsB1(): boolean {
  return ARTIFACT.phase1CompressorOnConcatenatedPairs.startsWith("B1");
}

export function cIsFinite(): boolean {
  return F1_N === 128 && F1_OMEGA === 256 && F1.C.includes("0..128");
}
