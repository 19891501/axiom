# Run 2026-09-10 — feuille métrique F1 gelée

- Affaire : figer A, S, C, K, N, les 4 décisions, avant tout runner
- Commande : `npx tsx --test src/phase2.test.ts` · `npx tsx src/cli.ts spec`
- Protocole : `experiments/PHASE2.md`

## Décisions

| | Gelé | Refusé (tautologie) |
|--|------|---------------------|
| A | M(Q_train) → table\|slp\|prog | programme humain de f |
| B1 | compresseur Phase 1 = B1 | le scorer comme B2 |
| C | fini, N=128, Ω={0,1}^8 | C=∞, C=n |
| N | 128 avant M ; ĉ=C/N | N manette de C/S |

## Batterie

PASS 13/13 (complétude de la feuille, pas un système). F1 non exécuté.

## Verdict

**METRIC FROZEN.** Pas un PASS sur reverse. Phase 1 intacte.

Prochaine unité sous ce protocole : F1, ou kill de F1.
