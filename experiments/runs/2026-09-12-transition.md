# Run 2026-09-12 — transition T1

- Affaire : plateau M*(K) sous branching bisimulation, (abc)^8
- Commande : `npx tsx --test src/transition.test.ts` · `npx tsx src/cli.ts transition`
- Protocole : `experiments/TRANSITION.md`

## Verdict

INSTRUMENT **PASS**. THEORY **NO-GO**.

M*(K0)=1 bit (flag, pas de reconstruction). M*(K2)≤32 bits (tile+k, reconstruit). Digest collapse. LCG : flag refuse.

Pas de T2. Pas de fusion. Occupé : statistique suffisante, quotient branching.
