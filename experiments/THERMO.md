# Thermo — compter K, tuer le mouvement perpétuel

Pré-enregistré. On ne mélange pas ça avec le 330/330 ni avec VERIFY.

## Question

D = n / |G| ignore le travail de reconstruction. Si ce travail est gratuit, un L-system est un mouvement perpétuel. En comptant K, le miracle est-il un trade-off ?

Convention **K3** (gelée ici) :

| Moteur | S | C | K |
|--------|---|---|---|
| SLP · Sequitur sur abc^k | \|G\| | n | \|G\| (DAG mémoïsé) |
| Koch | \|G\| invariant | \|w_t\| | Σ \|w_i\| |
| Rule 90 | 8+1 | t × w | t × w |

A = C/K. D′ = C/(S+K).

## Mesure

PASS si :

- SLP : D croît avec k, et A = D (K = |G|)
- Koch : D explose, A < 1, D′ < 1 (pas de miracle comptable)
- Rule 90 : A ≡ 1, D croît avec t, S = 9

Sinon FAIL.

## Ce que ça ne prouve pas

Une thermodynamique. Pas de T, pas de k_B, pas de 2e principe. C n’est pas une capacité fonctionnelle. Phase 2 a son propre protocole.
