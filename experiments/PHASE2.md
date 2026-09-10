# Phase 2 — feuille métrique gelée (2026-09-10)

**Loi : NO-GO.** Voir [`NOGO.md`](NOGO.md). F1 n’est pas exécuté. Pas un runner.

Pas une UI. On ne change pas un critère après un chiffre.
Phase 1 survit (strings, D = n/|G|, 330/330).

## Question

```
max C/S     sous     K ≤ K_max
```

C n’est pas une longueur. C est un succès fonctionnel tenu à l’écart.

## Décisions (le reste est tautologie — REFUSÉ)

| # | Choix gelé | L’autre tue l’examen |
|---|------------|----------------------|
| 1 | **A n’est pas un programme écrit à la main.** A := M(Q_train). L’humain écrit M, pas A. | **TAUTOLOGIE.** S = \|source de f\|, C = N, C/S → ∞. On mesure l’auteur, pas l’induction. |
| 2 | Un compresseur Phase 1 sur les paires concaténées est **B1**, jamais B2. | **TAUTOLOGIE de catégorie.** On recycle D = n/\|G\| en capacité. B1 sur le train a C ≈ 0 hors paires. |
| 3 | **C est fini.** C ≤ N = \|Q_test\| = 128. Totality sur {0,1}* est une conjecture, pas un score F1. | L’infini n’est pas mesurable. C/S devient un bouton (grossir le test). |
| 4 | **N est gelé avant M.** N = 128, Ω = {0,1}^8, split disjoint qui **couvre** Ω. ĉ = C/N obligatoire. | N petit : 3/3 chanceux. N gros : C/S linéaire en N à S fixé. Les deux sont des manettes. |

## Objet A

Type (un des trois, déclaré) :

| Type | Quoi | S primaire |
|------|------|------------|
| `table` | lignes canoniques `x TAB y LF`, x triés | nombre de code points |
| `slp` | grammaire Phase 1 | \|G\| = Σ\|rhs\| |
| `prog` | programme **induit** | code points de la source **+** décodeur spécialisé |

Production : M : Q_train → A, déterministe, sans identifiant de f, sans Q_test.
Rejouer M(Q_train) reproduit A. Si M(Q_train_struct) et M(Q_train_rand) ont le même hash(A) : M ignore les données → **kill**.

**Programme humain de f comme A : TAUTOLOGIE. REFUSÉ.**

## Quantités

Toute quantité a une unité et un adversaire.

| | Unité | Formule | Adversaire |
|--|-------|---------|------------|
| **Ω** | ensemble | {0,1}^8, \|Ω\| = 256 | changer L après coup |
| **f** | fonction totale sur Ω | reverse (structuré) ; y ⫫ x (contrôle) | choisir f après le chiffre |
| **N** | requête | \|Q_train\| = \|Q_test\| = 128 | N manette de C/S |
| **Q** | paires | shuffle(Ω, seed) ; 128 premiers train ; 128 derniers test ; disjoints sur x ; union = Ω | recouvrement, fuite, cherry-pick |
| **seed** | uint32 | déclaré **avant** M, dans le certificat | seed secret pour M, ou seed choisi après A |
| **A** | artefact fini | voir types | programme humain ; bits dans un 4e poche |
| **S** | symboles (primaire) ; octets UTF-8 (secondaire) | slp : \|G\| ; table/prog : code points (+ décodeur spécialisé) | gain qui disparaît en octets → kill |
| **C** | requêtes (0…128) | \|{ x ∈ Q_test : reconstruct(A,x) = f(x) ∧ K(A,x) ≤ K_max }\| | C := n, hash, note de modèle, ∞ |
| **ĉ** | 1 | C/N | vanité 3/3 ou 80/128 vendue comme PASS |
| **K** | symbol-steps, K3 | slp : \|G\| ; itératif : Σ\|w_i\| ; décodeur : pas pour émettre ŷ(x) ; lookup : \|ŷ\| | K gratuit ; cache non compté |
| **K_max** | symbol-steps / requête | **10 000**, gelé ici, avant tout run | le fixer après avoir vu K |

Identité : reconstruct(A,x) === f(x) comme chaînes. Pas de juge, pas de digest comme C.

C/S ≤ N/S = 128/S. Comparable seulement à ce N. Un autre N = autre certificat.

## Comptabilité

Toute information pour une requête est **état**, **coût**, ou **infrastructure**. Pas de quatrième poche.

| | Compte comme |
|--|----------------|
| poids, table, grammaire, programme, prompt gelé, seed, cache, faits d’environnement relus | **état** |
| décodeur / interpréteur **spécialisé** à f ou à la tâche | **état** (ajouter à S) |
| eval, rewrites, générations, écriture de ŷ (plancher Landauer) | **coût** (K) |
| expander général Phase 1, runtime JS **partagé par toutes les méthodes** | **infrastructure** |
| `eval` JS d’un `prog` induit | runtime = infrastructure ; source = état |

Si on peut sortir un bit du mot `state`, le projet s’écroule.

## Protocole de requêtes

```
Gen : f × seed → shuffle de Ω
Q_train = 128 premières clés    (seule entrée de M)
Q_test  = 128 dernières clés    (scoring ; public après production de A)
Q_train ∩ Q_test = ∅ sur x
Q_train ∪ Q_test = Ω
```

M ne reçoit pas Q_test. Que Q_test soit ensuite public ne l’autorise pas : M(Q_train) doit reproduire A sans lui.

Contrôle négatif : même Ω, mêmes N, y tiré indépendant de x (paires incompressibles). Même M.

## Adversaires (avant le candidat)

Un run qui n’affiche pas B0–B3 n’est pas un run.

| | | S | C attendu (structuré) | C attendu (rand) |
|--|--|--|------------------------|------------------|
| **B0** | Table littérale de **Ω entier** (train∪test). Lookup. | \|table\| ≈ 4608 | 128 | 128 |
| **B1** | Sequitur/RePair sur une table. Décompresser, lookup. Sur **Ω** comme adversaire ; sur Q_train comme candidat. | \|G\| | 128 si table=Ω et K≤K_max ; ≈0 si table=train | idem |
| **B2** | Grammaire / `prog` **induit** qui calcule ŷ(x). | \|G\| ou \|source\| | à mesurer | ≈0 |
| **B3** | Comme B2, mais K ne paie que ŷ(x), pas la clôture de Ω. | min état | à mesurer | ≈0 |

**B0 store Q_train seul : TAUTOLOGIE (C_B0 = 0 sur test disjoint, tout le monde « gagne »). REFUSÉ comme référence PASS.**
B0 voit Ω parce que c’est l’adversaire « écrire toutes les réponses », pas un candidat.

B1-sur-paires-concaténées présenté comme B2 : **REFUSÉ.**

## Ligne de verdict (binaire, pas de vanité)

**PASS** ssi tout ceci, sur f = reverse, unités \|G\| **et** UTF-8 :

1. une méthode : C/S > 1.02 × (C/S)_B0
2. ĉ = C/N ≥ 0.9
3. chaque succès : reconstruct === f(x) (identité, pas un hash)
4. K_max = 10 000 respecté (sinon la requête vaut 0 dans C)
5. contrôle négatif **sain** : C/N ≤ 0.05 et C/S ≤ (C/S)_B0
6. A = M(Q_train) rejoué ; hash(A_struct) ≠ hash(A_rand)
7. B0–B3 publiés ; décodeur spécialisé dans S

**MIXED** : protocole intact, identité tenue, contrôle sain, ĉ ≥ 0.9, et le gain contre B0 tient dans **une seule** des deux unités.

**FAIL** : protocole intact, et (personne ne bat B0, ou ĉ < 0.9, ou contrôle C/N > 0.05 sans fuite).

**kill** : crime de protocole — le chiffre n’est pas une preuve. Voir ci-dessous.

## Interdit (kill)

- Fuite de Q_test dans A (y compris « c’est public »)
- Critère changé après le chiffre (N, K_max, f, marge 1.02, ĉ_min)
- C défini comme n, comme un hash, comme une note de modèle, comme ∞
- Programme humain de f passé pour induit
- Compresseur Phase 1 (paires concaténées) score comme B2
- Décodeur spécialisé non compté dans S
- Un bit nécessaire ni S, ni K, ni infrastructure
- B0 = table train seul comme référence PASS
- Grossir / réduire N ou Ω pour soigner C/S
- Niveau 0 (Koch, carreaux, Rule 90) présenté comme une victoire
- Juge humain ou modèle à la place de ===

Contrôle négatif avec C/S > 1.02 × (C/S)_B0 → **kill** (fuite), pas FAIL.

## Échelle (inchangée)

| L | Objet | |
|---|--------|--|
| 0 | Traces génératives | Koch, carreaux, Rule 90. Étalonnage. **Ne peut pas gagner.** |
| 1 | Fonctions | **F1.** reverse sur {0,1}^8. Premier examen. |
| 2 | Familles | Un état, plusieurs fonctions. Partage à montrer. |
| 3 | Tâches composables | Une partie, pas la clôture. |
| 4 | Capacité nouvelle | Encore un Q_test **fini**, hors du train. Pas ∞. |
| 5 | Système vivant | Annexe. Pas ce fichier. |

## Certificat

hash(A) · hash(M) · version (cette date) · f · seed · N=128 · L=8 · K_max=10000 · S_sym · S_bytes · C · ĉ · K par requête · B0–B3 · ligne négative · test A_struct≠A_rand · verdict PASS \| MIXED \| FAIL \| kill

Q_train et Q_test sont publiés. Quelqu’un doit pouvoir reprendre un chiffre et demander s’il est réel.

## Ce que ça n’est pas

Un runner. Un agent. RSI. Une thermodynamique. Phase 1 n’est pas révoquée. F1 n’a pas été couru.

Prochaine unité qui écrit du **code d’implémentation** sous ce protocole : F1, ou un kill de F1.
