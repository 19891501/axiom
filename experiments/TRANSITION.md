# Transition State — T1 (2026-09-12)

Instrument. Pas une loi. Pas une fusion Axiom × AION.

Arbitre : **bisimulation branching** (van Glabbeek & Weijland 1996). Théorie : **NO-GO**.

## Question

À quelle capacité emboîtée K une représentation nommée cesse-t-elle d’être branching-bisimilaire à la chaîne pleine ?

## Gelé

- S = (abc)^8. Contrôle négatif : LCG de même longueur.
- K0 = {export} · K1 = {export, index0} · K2 = {export, index0, emit}
- M ∈ {full, hier, meta, flag, digest, empty}
- τ = travail interne. Visibles : requête, verdict {EXECUTER, NO_ACTION, ASK}, menu.

Pas de dixième algorithme. Pas de treizième corpus.

## PASS ssi

1. hier et meta ↔ᵇ full sur K2 (étalonnage : reconstruire implique le gate)
2. digest ↮ᵇ full
3. flag ↔ᵇ full sur K0, sans reconstruire
4. flag ↮ᵇ full sur K2
5. M*(K0) < M*(K2)
6. sur LCG, flag = NO_ACTION, digest = ASK
7. THEORY = NO-GO

Sinon FAIL.

## Verdict

**INSTRUMENT PASS. THEORY NO-GO.**

Le bit de périodicité est une statistique suffisante pour K0. Occupé. Le plateau est mesuré, pas baptisé. Pas de T2.
