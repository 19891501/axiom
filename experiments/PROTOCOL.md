# Protocole — CAPACITY / STATE Phase 1

Pré-enregistré. On ne change pas les critères après le run.

## Question

Pour des chaînes, D = n / |G| (n = longueur reconstruite, |G| = somme des RHS) est-il

1. strictement supérieur à 1 dès qu’il y a de la structure,
2. voisin de 1 sur un incompressible,
3. obtenu par une grammaire qui **reconstruit** la chaîne (pas un hash, pas une perte).

## Inclus

- Neuf algorithmes, y compris le littéral (D ≡ 1).
- Douze corpus, un seul aléatoire (contrôle négatif).
- Reconstruction : `expand(G) === input` pour chaque cellule.
- Invariants : Re-Pair binaire, Sequitur utility ≥ 2, pas de collision sur S.
- L-systems : |G| invariant en l’itération, n croît.
- Limites : D(tile, k) croît pour Sequitur ; RLE = ½ sur un motif de période > 1 ; D(random) < 1.15 à toute longueur testée.

## Mesure (binaire)

PASS si et seulement si :

- reconstruction 100 %
- 11/11 structurés : max_alg D > 1.02 × D_literal
- aléatoire : max_alg D < 1.15
- les invariants et L-systems ci-dessus tiennent

Sinon : MIXED ou FAIL. Une phrase de preuve. Pas un score vanity.

## Mort

- Un corpus structuré où tout le monde est ≤ littéral.
- D ≫ 1 sur l’aléatoire (surapprentissage).
- Une reconstruction fausse.
- On a dû changer le critère après le run.

Alors `kill`. Le format reste dans git comme cadavre daté.

## Ce que ça ne prouve pas

Un agent, un modèle, une base. Le pont strings → systèmes est Phase 2. Il a son propre protocole, pas celui-ci.
