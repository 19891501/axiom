# Predict — Ĉ d’abord, k hors échantillon ensuite (2026-09-11)

Pas un dixième algo. Pas un treizième corpus. Pas une nouvelle métrique.

## Ĉ enregistré (avant le run)

| Famille | Ĉ | Mesure | k vus (v1.1/v1.2) | k tenus |
|---------|---|--------|-------------------|---------|
| (abc)^k | hiérarchie | \|G\|_rhs | 2,4,8,16,32,64 | 3,5,7,12,24,48,96,128 |
| a^n | doubling SLP | \|G\|_rhs | 8…128 | 12,24,48,96,192 |
| F_n | n | productions | 6…14 | 15,16 |
| LCG | n | \|G\|_rhs | 24,48,96 | 36,72,144 |

RLE |G|=2 est un autre objet, verrouillé à part.

## PASS ssi

1. Sequitur ≤ Ĉ sur tout k tenu du carreau
2. k=128 (puissance de deux inédite) : ρ = 1
3. l’écart relatif Ĉ−Sequitur **ne croît pas** de k=3 à k=96
4. sur les k non dyadiques, Sequitur < Ĉ (donc Ĉ n’est pas une égalité)
5. RLE=2 et Sequitur ≤ doubling, n tenus
6. productions = n sur F_15, F_16
7. min ρ ≥ 0.85 sur LCG tenus

Sinon FAIL.

## Verdict attendu

**INVARIANT**, pas LAW. Un plafond nommé, serré sur le dyadique et sur Fibonacci. Pas une égalité sur les copies impaires. Le résidu n’est pas nommé : donc pas une loi.

Loi fonctionnelle : toujours NO-GO.
