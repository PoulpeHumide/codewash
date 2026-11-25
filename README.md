# CodeWash — Level Up RPG

Jeu éducatif (lecture, écriture, calcul, mémoire, motifs, rangement) développé en **React 19 + Vite** et empaqueté pour Windows avec **Electron**. Ce dépôt contient la reprise du projet selon le protocole Code Wash : tests de caractérisation, CI, refactorings par petites étapes, documentation de transmission.

| Où | Quoi |
|---|---|
| `CodeWashGame/` | Application (code source reçu, tag `v0-original`) |
| `docs/DEBT.md` | Registre de dette technique, mesures de référence et plan d'attaque |
| `docs/NormeDeCommit.md` | Conventions de commit et de workflow Git |
| `.github/workflows/ci.yml` | Pipeline qualité exécuté sur chaque PR |

## Prérequis

- **Node.js ≥ 20.19** (exigé par Vite 7 ; testé avec Node 22 en CI et Node 24 en local) et **npm ≥ 10**
- Un navigateur basé sur Chromium (Chrome, Edge) pour la reconnaissance vocale du mini-jeu de lecture (`webkitSpeechRecognition`), voir `CodeWashGame/docs/MICROPHONE_FEATURE.md`
- Windows uniquement pour produire l'exécutable portable (`electron-builder`). Le jeu lui-même tourne sur Linux, macOS et Windows.

## Installer et lancer (navigateur)

```bash
cd CodeWashGame
npm ci          # installe exactement les versions du package-lock.json
npm run dev     # serveur de développement : http://localhost:5173
```

> Sans besoin d'Electron, `ELECTRON_SKIP_BINARY_DOWNLOAD=1 npm ci` évite de télécharger son binaire (~100 Mo).

Les sauvegardes sont dans le `localStorage` du navigateur. Pour repartir de zéro : outils de développement → Application → Local Storage → effacer.

## Lancer la version bureau (Electron)

```bash
cd CodeWashGame
npm ci                  # sans ELECTRON_SKIP_BINARY_DOWNLOAD
npm run electron:dev    # build Vite puis ouverture de la fenêtre Electron
npm run electron:build  # Windows : génère release/LevelUpRPG-Portable.exe
```

## Tester et mesurer

Toutes les commandes se lancent depuis `CodeWashGame/` :

| Commande | Rôle |
|---|---|
| `npm test` | Suite de tests (Vitest), une seule commande |
| `npm run test:watch` | Tests en continu pendant le développement |
| `npm run test:coverage` | Tests + rapport de couverture (`coverage/`), **échoue si les seuils ne sont pas atteints** |
| `npm run lint` | Analyse statique ESLint |
| `npm run format:check` | Vérifie le formatage (Prettier), **échoue si un fichier n'est pas formaté** |
| `npm run format` | Formate tout le code (à lancer avant de commiter) |
| `npm run build` | Build de production (`dist/`) |
| `npm run metrics:complexity` | Fonctions de complexité cyclomatique > 10 (ESLint `complexity`) |
| `npm run metrics:duplication` | Blocs dupliqués (jscpd, ≥ 50 tokens) |

Les tests actuels sont des **tests de caractérisation** : ils figent le comportement du code reçu, y compris ses bizarreries (marquées `QUIRK`). Un test qui casse signale un changement de comportement à justifier, pas forcément un bug. Les tests sont à côté du code testé (`src/**/*.test.js`). Le hasard et l'horloge sont contrôlés avec `vi.spyOn(Math, 'random')` et `vi.useFakeTimers()`.

## Intégration continue

`.github/workflows/ci.yml` s'exécute sur chaque pull request et sur `main` : `npm ci` → lint → formatage → tests avec seuils de couverture → build → rapport de complexité. Le résumé de couverture apparaît dans l'onglet *Summary* du run et le rapport complet est téléchargeable en artefact.

Le style du code est fixé par `CodeWashGame/.prettierrc.json`. Le commit de reformatage global est listé dans `.git-blame-ignore-revs` : lancer une fois `git config blame.ignoreRevsFile .git-blame-ignore-revs` pour que `git blame` l'ignore en local (GitHub le fait déjà).

Les seuils sont définis dans `CodeWashGame/vite.config.js` (section `test.coverage.thresholds`). Ils ne doivent que monter. En baisser un est une dette à inscrire dans `docs/DEBT.md`.

> **Note :** l'ancien workflow `CodeWashGame/.github/workflows/build-exe.yml` n'a jamais tourné, car GitHub ne lit que le dossier `.github/` à la racine du dépôt. Il est conservé tel quel pour l'instant (voir DEBT-01).

## Contribuer

1. Créer une branche depuis `main` et une issue liée à une entrée `DEBT-XX` du registre.
2. Écrire ou compléter les tests de caractérisation **avant** de modifier le code.
3. Petits commits atomiques au format Conventional Commits (`docs/NormeDeCommit.md`).
4. Ouvrir une PR : la CI doit être verte avant le merge.
