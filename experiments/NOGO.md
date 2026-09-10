# NO-GO — CAPACITY / STATE comme loi sur les fonctions

2026-09-10. Architecte. Synthèse de MARTEAU, ÉTAT DE L’ART, FORMALISTE, EXPÉRIMENTATEUR, ADVERSAIRE.

**Pas un runner. Pas un PASS. Pas une loi nouvelle. F1 = 0 %.**

```
QUESTION
Peut-on augmenter une capacité fonctionnelle sans augmenter
proportionnellement l'état persistant, sous un coût de reconstruction borné ?

max C/S     sous     K ≤ K_max
```

## Verdict

**NO-GO.**

Trois lectures. Chacune tue. Une seule suffirait.

| Lecture | Verdict | Pourquoi |
|---|---|---|
| A est un programme | **TAUTOLOGIE** | `reverse` a S = O(1), C croît avec \|Q_test\|. C’est la définition d’un algorithme. |
| A est un SLP Phase 1 sur la table I/O | **FAUX** | `expand(G)` rend une chaîne, pas f(x). C = 0 sur un x absent. C’est B1, pas B2. |
| A est induit d’exemples, sous budget K | **OCCUPÉ** | Levin Kt (1973/84), Shannon Size(f) (1949), MDL (1978), FlashFill (2011), speed prior (2002). |

## Cinq citations

1. **Levin 1973/84** — \(Kt(x)=\min(|p|+\log t)\). S + f(K). La question *est* cet objet.
2. **Shannon 1949** — Size(f) ≪ \|tt(f)\|. Parité : S = O(n), C = 2ⁿ. Superlinéaire, déjà.
3. **Rissanen 1978** — MDL à deux parts. Fit held-out par bit de description.
4. **Gulwani 2011** — FlashFill. F1, déjà dans Excel.
5. **Wolpert 1996** — NFL. Aucun gain de C/S n’est une loi sur toutes les f.

Zhang et al. 2017 : même S, labels aléatoires ou réels. C n’est pas une fonction de S. La compression n’est pas la capacité.

## Ce qui resterait après tous les cheats

Un programme court dans un langage L gelé, produit par `induce(Q_train)`, ≥ 90 % sur un Q_test de taille gelée, échec sur une fonction aléatoire, K ≤ K_max, S en bits.

C’est l’induction de programmes. FlashFill le fait. Levin search le fait si on attend. Kolmogorov l’a nommé en 1965.

Ce n’est pas une loi sur les systèmes. Ce n’est pas Phase 2. C’est L1-étalonnage : l’instrument voit-il un programme ? L’architecte refuse de vendre ça comme CAPACITY/STATE.

## Conflit qui interdit un run

Deux gels F1 existent et **ne s’accordent pas** :

| | F1.md (expérimentateur) | PHASE2.md (formaliste) |
|---|---|---|
| N | 64 / 64 | 128 / 128 |
| K_max | 640 | 10 000 |
| B0 | table train (C_B0 = 0) | table de Ω (voit le test) |

ADVERSAIRE : C/S > 1.02 × B0 est **vacuous** si C_B0 = 0, et **Exam II** si B0 contient Q_test. Le PASS de PHASE2.md n’est pas un critère. On ne choisit pas un gagnant pour « commencer Phase 2 ». On tue la prétention de loi.

## Ce qui survit

Axiom v1. Strings. D = n/\|G\|. 330/330. VERIFY. THERMO. FLOOR. Instrument fermé.

La vision (l’état n’a pas à contenir la capacité) reste une **direction**. Elle n’est pas un théorème v1 sur les fonctions.

L0 (Koch, Rule 90) étalonne. Ne peut pas gagner. Inchangé.

## Interdit

Runner F1. Vue de plus. Agent. RSI. SaaS. Changer C, S, K après un chiffre. Présenter L0 ou FlashFill comme une découverte Axiom.

## Prochaine unité

Théorie des neuf + tag `v1.0`. Pas F1. Pas L2–L5.
