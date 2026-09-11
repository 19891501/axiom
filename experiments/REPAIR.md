# Re-Pair — audit d’optimalité (2026-09-11)

Mieno, Inenaga, Horiyama, CPM 2022 : les grammaires Re-Pair de F_n **sont** les plus petites, et g*(F_n) = n **productions** (SLP en forme normale de Chomsky).

Le `runRepair` d’Axiom n’est pas cet objet.

## Deux tailles

| Mesure | Objet |
|--------|--------|
| \|G\|_rhs | somme des membres droits (Axiom v1) |
| productions | nombre de règles CNF (Mieno) |

Sur F_14 : lab 27 > Sequitur 23 en \|G\|_rhs. Canonical : 14 productions = g*. Pas de contradiction.

## Arbitre

Re-Pair à trois étages, **hors des neuf** :

1. une production unaire par lettre
2. paires non-chevauchantes, la plus fréquente
3. binarisation du reste

## PASS ssi

- productions canoniques = n sur F_6…F_14
- reconstruction (canonical, lab, Sequitur)
- F_14 : lab \|G\|_rhs > Sequitur, canonical = 14
- lab ruleCount ≠ 14
- canonical \|G\|_rhs ≤ lab

Sinon FAIL.

## Interdit

Remplacer le témoin gelé. Un dixième algorithme. Phase 2.
