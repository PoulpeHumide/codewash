# CodeWash — Level Up RPG

Jeu éducatif (lecture, écriture, calcul, mémoire, motifs, rangement) développé en **React 19 + Vite** et empaqueté pour Windows avec **Electron**. Ce dépôt contient la reprise du projet selon le protocole Code Wash : tests de caractérisation, CI, refactorings par petites étapes, documentation de transmission.

| Où | Quoi |
|---|---|
| `CodeWashGame/` | Application (code source reçu, tag `v0-original`) |
| `docs/DEBT.md` | Registre de dette technique, mesures de référence et plan d'attaque |
| `docs/NormeDeCommit.md` | Conventions de commit et de workflow Git |
| `.github/workflows/ci.yml` | Pipeline qualité exécuté sur chaque PR |

## Prérequis

- **Node.js ≥ 22.12** (requis par Electron 45) et **npm ≥ 11.4** (requis pour la liste `allowScripts`; les workflows CI épinglent npm 11.4.2)
- Un navigateur basé sur Chromium (Chrome, Edge) pour la reconnaissance vocale du mini-jeu de lecture (`webkitSpeechRecognition`), voir `CodeWashGame/docs/MICROPHONE_FEATURE.md`
- Windows uniquement pour produire l'exécutable portable (`electron-builder`). Le jeu lui-même tourne sur Linux, macOS et Windows.

## Installer et lancer (navigateur)

```bash
cd CodeWashGame
npm ci          # installe exactement les versions du package-lock.json
npm run dev     # serveur de développement : http://localhost:5173
```

`npm ci` approuve les scripts tiers uniquement pour `electron` et `electron-winstaller` (voir `allowScripts` dans `CodeWashGame/package.json`) et télécharge le binaire Electron 45.5.0 via son installateur officiel. Le job de qualité définit `ELECTRON_SKIP_BINARY_DOWNLOAD=1` pour éviter ce téléchargement inutile; le workflow de packaging ne le définit pas. Ne contournez pas l'approbation des scripts avec `--ignore-scripts`.

Les sauvegardes sont dans le `localStorage` du navigateur. Pour repartir de zéro : outils de développement → Application → Local Storage → effacer.

## Lancer la version bureau (Electron)

```bash
cd CodeWashGame
npm ci                  # installe les dépendances
npm run electron:dev    # build Vite puis ouverture d'Electron
npm run electron:build  # Windows : génère release/LevelUpRPG-Portable.exe
```

## Signaler un bogue

Ouvrez le menu de signalement avec le bouton rouge en bas à droite, décrivez le problème, puis vérifiez l'aperçu avant de créer le rapport. Les captures d'écran et fichiers complémentaires sont facultatifs; le jeu limite les pièces jointes à 10 fichiers, 5 Mo par fichier et 15 Mo au total. L'état de progression et les diagnostics récents sont exclus par défaut et ne sont ajoutés qu'après activation de leurs cases. Le collecteur de diagnostics borne le buffer à 50 entrées, exclut les piles d'appel et masque les valeurs courantes de type mot de passe/jeton ainsi que les paramètres de requête dans les URL.

Configurez le contact et, facultativement, un serveur HTTPS dans `CodeWashGame/.env.local` avant de lancer Vite ou de produire le build :

```dotenv
VITE_BUG_REPORT_CONTACT=bugs@example.org
VITE_BUG_REPORT_ENDPOINT=https://reports.example.org/api/reports
# Facultatif; par défaut, la version de CodeWashGame/package.json est utilisée.
VITE_APP_VERSION=1.2.3
```

Ces variables `VITE_*` sont intégrées au client et ne sont pas des secrets : n'y placez ni mot de passe ni jeton. Sans endpoint, le jeu télécharge un bundle JSON local contenant le rapport et les pièces jointes; si un contact est configuré, l'interface indique de lui envoyer le bundle. En cas d'échec réseau, le même export local est proposé. Aucun serveur de réception n'est fourni dans ce dépôt.

Un endpoint doit accepter une requête `POST` `multipart/form-data` avec le champ texte `report` (JSON) et zéro ou plusieurs champs `attachments`. Il doit répondre avec un statut 2xx et, facultativement, un JSON `{ "id": "..." }` (ou `204 No Content`). Le navigateur n'envoie pas de cookies d'authentification avec ce transport; le serveur doit autoriser l'origine de l'application par CORS.

## Tester et mesurer

Toutes les commandes se lancent depuis `CodeWashGame/` :

| Commande | Rôle |
|---|---|
| `npm run test:coverage` | **Commande unique CI** : suite Vitest complète + rapport de couverture; échoue si un seuil n'est pas atteint |
| `npm test` | Suite de tests (Vitest), sans rapport de couverture |
| `npm run test:watch` | Tests en continu pendant le développement |
| `npm run lint` | Analyse statique ESLint |
| `npm run format:check` | Vérifie le formatage (Prettier), **échoue si un fichier n'est pas formaté** |
| `npm run format` | Formate tout le code (à lancer avant de commiter) |
| `npm run build` | Build de production (`dist/`) |
| `npm run metrics:complexity` | Fonctions de complexité cyclomatique > 10 (ESLint `complexity`) |
| `npm run metrics:duplication` | Blocs dupliqués (jscpd, ≥ 50 tokens) |

Les tests actuels sont des **tests de caractérisation** : ils figent le comportement du code reçu, y compris ses bizarreries (marquées `QUIRK`). Un test qui casse signale un changement de comportement à justifier, pas forcément un bug. Les tests sont à côté du code testé (`src/**/*.test.{js,jsx}`). Le hasard et les timers sont contrôlés avec `vi.spyOn(Math, 'random')` et `vi.useFakeTimers()`.

## Intégration continue

`.github/workflows/ci.yml` s'exécute sur chaque pull request et sur les pushs vers `main` : npm 11.4.2 → `npm ci` → lint → formatage → tests avec seuils de couverture → build → rapport de complexité. `develop` n'est pas une branche distante recensée. Le workflow de packaging Windows est `.github/workflows/build-exe.yml` (push vers `main` ou lancement manuel); son ancien emplacement sous `CodeWashGame/.github/workflows/` n'était pas reconnu par GitHub Actions. Le résumé de couverture apparaît dans l'onglet *Summary* du run et le rapport complet est téléchargeable en artefact.

La branche `main` est signalée comme protégée par GitHub. Vérifiez néanmoins manuellement dans **Settings > Branches > Branch protection rules** que le check `quality-gate` est sélectionné comme requis : l'API consultée confirme la protection, mais ne permet pas de confirmer la liste des checks obligatoires. Tant que ce réglage n'est pas vérifié, un job rouge ne garantit pas à lui seul le blocage du merge.

Le style du code est fixé par `CodeWashGame/.prettierrc.json`. Le commit de reformatage global est listé dans `.git-blame-ignore-revs` : lancer une fois `git config blame.ignoreRevsFile .git-blame-ignore-revs` pour que `git blame` l'ignore en local (GitHub le fait déjà).

Les seuils sont définis dans `CodeWashGame/vite.config.js` (section `test.coverage.thresholds`). Ils ne doivent que monter. En baisser un est une dette à inscrire dans `docs/DEBT.md`.

## Contribuer

1. Créer une branche depuis `main` et une issue liée à une entrée `DEBT-XX` du registre.
2. Écrire ou compléter les tests de caractérisation **avant** de modifier le code.
3. Petits commits atomiques au format Conventional Commits (`docs/NormeDeCommit.md`).
4. Ouvrir une PR : la CI doit être verte avant le merge.
