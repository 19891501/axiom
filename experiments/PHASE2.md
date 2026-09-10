# Phase 2 — protocole gelé (2026-09-10)

Pas un runner. Une spécification. On ne change pas les critères après un run.

Phase 1 survit (strings, D = n/|G|, 330/330). Ce fichier n’ouvre pas un système vivant. Il dit ce que serait un fait sur une **capacité**.

## Question

Combien de capacité fonctionnelle un système peut-il reconstruire par bit d’état persistant, à quel coût de reconstruction ?

```
max C/S     sous     K ≤ K_max
```

C n’est pas n. n est une longueur. C est un succès tenu sur des requêtes tenues à l’écart.

## Axes

| | |
|--|--|
| **S** | Bits persistants après la reconstruction. Pas le runtime. Pas la sortie. |
| **K** | Travail pour produire la capacité, sur cette requête. Convention K3 (Thermo). |
| **C** | Nombre de requêtes held-out correctes. Pas |expand(G)|. |

## Comptabilité (brutale)

Toute information nécessaire à une requête est **état**, **coût**, ou **infrastructure**.

- Poids, tables, grammaire persistante, prompt gelé, seed, cache, faits d’environnement relus → **état**
- Pas d’eval, rewrites, générations, écriture de la réponse → **coût**
- Expander général / runtime JS partagé par toutes les méthodes → **infrastructure**
- Interpréteur *spécialisé* à la tâche → **état**

Si on peut déplacer une information hors du mot `state`, le projet s’écroule.

## Adversaires (avant le candidat)

| | |
|--|--|
| **B0** | Stockage direct. La capacité est la table. |
| **B1** | Compresser la table, décompresser à la requête. |
| **B2** | Grammaire / programme qui engendre les réponses. |
| **B3** | Reconstruction ciblée : seulement la capacité demandée. |

Un run qui n’affiche pas B0–B3 n’est pas un run.

## Échelle

| L | Objet | |
|---|--------|--|
| 0 | Traces génératives | Koch, carreaux, Rule 90. Étalonnage. **Ne peut pas gagner.** |
| 1 | Fonctions | **F1.** Premier examen. |
| 2 | Familles de fonctions | Un état, plusieurs fonctions. |
| 3 | Tâches composables | Reconstruire une partie, pas la clôture. |
| 4 | Capacité nouvelle | Hors des paires d’entraînement, encore juste, encore comptée. |
| 5 | Système vivant | Agent, modèle, base. Annexe à part. |

## F1 — reconstruire une fonction (non exécuté)

- Objet : une fonction totale f, des paires Q_train, un Q_test disjoint engendré par la même règle.
- S = |G| (unité Phase 1). On rapporte aussi les octets UTF-8.
- C = |{ x ∈ Q_test : reconstruct(A, x) = f(x) }|
- K = K3. K_max fixé **avant** le run. Une requête hors budget marque 0.
- Contrôle négatif : Q_test aléatoire. C/S ne bat pas B0 par chance.

**PASS** si, sur un f structuré : une méthode a C/S > 1.02 × (C/S)_B0, K ≤ K_max partout, C ≥ 0.9 |Q_test|, reconstruction vérifiée, contrôle négatif sain.

**kill** si Q_test a fuité dans A ; si l’interpréteur est spécialisé et non compté ; si le gain disparaît en octets ; si les réponses ne sont pas vérifiées.

## Mort du protocole

- C défini comme n, comme un hash, comme une note de modèle.
- Un bit nécessaire n’est ni S, ni K, ni infrastructure.
- La méthode lit Q_test.
- On a changé le critère après le chiffre.
- Le niveau 0 présenté comme une victoire.

## Certificat

hash de A · version (cette date) · générateur / seed · |Q_train| |Q_test| · S, C, K_max, K par requête · B0–B3 · ligne négative · verdict PASS | MIXED | FAIL | kill

Quelqu’un doit pouvoir prendre un chiffre et demander s’il est réel.

## Ce que ça n’est pas

Un runner. Un agent. RSI. Une thermodynamique. Phase 1 n’est pas révoquée.

Prochaine unité qui écrit du code sous ce protocole : F1, ou un kill de F1.
