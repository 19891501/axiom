# Vérifier — ce qui survit sans l’original

Pré-enregistré. On ne mélange pas ça avec le protocole densité 2026-09-10.

## Question

D = n / |G| n’est un **fait** que si la reconstruction est vérifiée. Quels contrôles restent déterminés si on jette la chaîne ?

1. Identité `expand(G) === s` exige s.
2. Un digest (FNV-1a 32) exige un témoin d’octets, pas s.
3. Les invariants (acyclicité, utility Sequitur, Re-Pair binaire, pas de collision sur S) n’exigent rien.
4. Sans oracle, D(G) est encore un nombre. La fidélité ne l’est pas.
5. Altérer un terminal casse identité et digest. Les invariants de forme tiennent. Sans oracle, l’altération est **invisible**.

## Inclus

- Les grammaires déjà produites par les neuf algorithmes.
- RLE comme **décodeur** (expand() ≠ reconstruction). C’est un fait, pas un FAIL.
- Un digest non cryptographique. C’est un témoin, pas une preuve de structure.

## Exclu

- RSI, reward-hacking, évaluateurs co-évolutifs.
- Un oracle-tâche (Phase 2). Ce n’est pas ce protocole.

## Mesure (binaire)

PASS si :

- identité PASS avec s, UNKNOWN sans s
- digest PASS après discard de s, FAIL sur un témoin faux
- invariants PASS sans s
- tamper + original → identité FAIL, utility Sequitur encore PASS
- tamper + aucun oracle → verdict encore PASS (le trou)

Sinon : FAIL.

## Mort

- Identité déterminée sans s (on a triché).
- Un invariant qui « voit » la lettre (alors ce n’est plus un invariant de forme).
- Confondre digest et grammaire.
