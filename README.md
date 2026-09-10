# Axiom

CAPACITY / STATE. Un instrument, pas une app.

```
D = n / |G|
```

n est la chaîne reconstruite. |G| est la somme des membres droits de la grammaire. Le littéral vaut 1 par construction.

## Hypothèse (à tuer)

Sur toute chaîne **structurée**, il existe une grammaire G telle que D(G) > 1. Sur une chaîne **incompressible**, D retombe vers 1.

Si le contrôle négatif casse : le dépôt se ferme.

## Périmètre (strict)

| Inclus | Exclu |
|--------|--------|
| Neuf compresseurs, douze corpus | Produit, comptes, UI |
| Reconstruction vérifiée | Agents, modèles, bases |
| L-systems, treillis élémentaire | Life, spectacle |
| `npm test` · `npm run battery` | Phase 2 (systèmes vivants) |

Ce qui est démontré : des faits sur des **strings**. Ce qui n’est pas démontré : qu’un agent est une chaîne.

## Travail

```
npm test
npm run battery
```

Le protocole : [`experiments/PROTOCOL.md`](experiments/PROTOCOL.md).  
Comment on bosse : [`AGENTS.md`](AGENTS.md).

## Verdict (2026-09-10)

PASS — 330/330. 11/11 structurés battent le littéral. L’aléatoire reste près de 1.

## Les neuf

Literal · Run-length · LZ78 · LZW · BPE · Sequitur · Re-Pair · Bisection · Longest match.

Le plus petit problème de grammaire est NP-dur. Chaque algorithme est un témoin : K(x) ≤ |G| + O(1). Le D mesuré est un **minorant** de la densité grammaticale vraie.

## Primitive manquante

Un L-system et un automate cellulaire ont une primitive d’itération. Un SLP n’en a pas. Sur Rule 110, D_CA ≈ 800, D_Sequitur sur le raster aplati ≈ 8. L’écart est la primitive, pas la qualité du compresseur.

## Vérifier

D n’est un fait que si la reconstruction est vérifiée. Sans l’original, identité est indéterminée. Un digest est un témoin d’octets, pas de structure. Les invariants (utility, binaire, acyclicité) ne consultent pas la chaîne. Altérer un terminal sans oracle est invisible — c’est le trou entre Phase 1 et Phase 2.

```
npm test
npx tsx src/cli.ts verify
```

Le protocole : [`experiments/VERIFY.md`](experiments/VERIFY.md).

## Thermo

Si K est gratuit, Koch est un mouvement perpétuel. Convention K3 : le SLP paie dans |G|, Koch et Rule 90 paient en temps. D explose. D′ = n/(|G|+K) non.

```
npx tsx src/cli.ts thermo
```

[`experiments/THERMO.md`](experiments/THERMO.md).


