# Ratio — approximation contre une construction (2026-09-11)

Pas |G_min|. Une construction nommée, expansible, vérifiée.

```
ρ = |G_alg| / |G_ref|
```

## Arbitres

| id | Chaîne | Construction |
|----|--------|----------------|
| hierarchy | (abc)^k | copies binaires du motif |
| doubling | a^n | méthode binaire (SLP) |
| morphism | F_k | F_k → F_{k-1} F_{k-2} |
| literal | LCG | la chaîne elle-même |

## PASS ssi

1. Chaque construction se reconstruit.
2. Sequitur saturé la hiérarchie (ρ ≤ 1.02) sur k=64.
3. Re-Pair ρ ≤ 1.15 sur le même carreau.
4. RLE sur a^n a |G|=2 — ce n’est pas un SLP.
5. Sequitur et Re-Pair battent ou égalent le doubling (ρ ≤ 1).
6. Le Re-Pair du lab **n’est pas** l’optimum de Mieno 2022 : Sequitur ou BPE plus petit.
7. Sequitur ρ ≤ 1.05 contre le morphisme.
8. Sur LCG, personne ne bat le littéral de 15 %.

Sinon FAIL.

## Ce que ça n’est pas

Une loi. Un |G_min|. Un dixième algorithme. Phase 2.
