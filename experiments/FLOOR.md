# Floor — Landauer, Phase 1

Pré-enregistré. Distinct de THERMO (compter K) et de PROTOCOL (330/330).

## Question

Si émettre la chaîne coûte sa longueur, existe-t-il encore un miracle ?

```
D   = C/S
D′  = C/(S+K)         K3
D_L = C/(S+K+C)       Landauer
```

## Théorèmes

| | | |
|--|--|--|
| **L** | D_L < 1 dès que S+K > 0 | identité |
| **T** | si K ≥ C (pas de partage), D′ < 1 | Koch, Rule 90 |
| **S** | un SLP peut avoir D′ > 1 ; D_L < 1 quand même | partage dans le DAG |

Carnot, ici, est |G_min| — incalculable. On ne le trace pas. On trace l’écriture qu’on ne peut pas refuser.

## Mesure

PASS si :

- L tient sur les trois moteurs, toutes échelles
- T tient sur Koch et Rule 90
- S : SLP D′ > 1 et D_L < 1
- le plus proche du mur est le SLP (partage)

Sinon FAIL.

## Ce que ça ne prouve pas

Une thermodynamique. Pas de T. C est encore une longueur. Phase 2 n’est pas courue.
