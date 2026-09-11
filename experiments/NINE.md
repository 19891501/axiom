# Théorie des neuf — Axiom v1.0

Pré-enregistré. Distinct du 330/330. On ne change pas un critère après le chiffre.

## Question

Les neuf algorithmes sont-ils des **témoins** (K(x) ≤ |G| + O(1)), pas des records ? Les familles voient-elles des régimes différents ?

Le plus petit problème de grammaire est NP-dur (Charikar et al., 2005). D mesuré est un **minorant** de n / |G_min|.

## Familles

| Famille | Voit | Membres |
|---------|------|---------|
| baseline | la chaîne | Literal |
| run | les streaks | RLE |
| dictionary | phrases préfixe-closes | LZ78, LZW |
| tokenizer | Re-Pair à budget | BPE (40 merges) |
| grammar | hiérarchie, paires, milieux, blocs | Sequitur, Re-Pair, Bisection, Longest |

## Mesure

PASS ssi :

- 9 algorithmes, 5 familles
- tile : une grammaire gagne, Sequitur grimpe, RLE = ½
- unary : le run gagne, D = n/2
- nested : Sequitur > 2 × Bisection (la structure n’est pas au milieu)
- fibonacci : D_Sequitur croît (le tokenizer **peut** gagner : un budget n’est pas une grammaire plus faible)
- aléatoire : tout D < 1.15
- BPE ≤ Re-Pair sur le carreau (là, plus de merges paient)

Sinon FAIL.

## Ce que ça ne prouve pas

Qu’un des neuf est |G_min|. Qu’une fonction est une chaîne. Phase 2 est NO-GO.

## Verdict

v1.0. Instrument fermé. Plus d’algorithme, plus de corpus.
