# Registre de dette technique — CodeWash

**État de référence :** 16 novembre 2026 (mesures complétées le 24 novembre 2026)
**Périmètre observé :** application React/Vite et son lanceur Electron, dans `CodeWashGame/`.
**État des travaux :** aucun refactoring applicatif n’a été effectué. Le filet de sécurité est en cours de construction (DEBT-01) : tests de caractérisation des règles pures, CI sur PR et contrôle du formatage. Le code a été reformaté une fois avec Prettier (formatage seul, aucun changement de comportement).

## 0. Provenance du code de référence

| Élément | Valeur |
|---|---|
| Archive reçue | `CodeWashGame.tgz` (267 332 096 octets) |
| Format réel | archive **tar POSIX non compressée** créée sur macOS, malgré l’extension `.tgz` (`file CodeWashGame.tgz`) |
| SHA-256 | `a6eee7a148b8a3e084944cc84c51b72ec2fa2d39edc2425505cbb13b56b8af30` (`sha256sum CodeWashGame.tgz`) |
| Contenu importé | 286 fichiers sous `CodeWashGame/`, commités sans modification et tagués `v0-original` |
| Exclusions | 375 entrées `._*` (métadonnées AppleDouble macOS : attributs étendus, pas des fichiers du projet), volontairement non versionnées |
| Vérification | `tar df CodeWashGame.tgz` ne signale aucune différence de contenu sur les fichiers importés |
| Archive | non versionnée (`*.tgz` dans `.gitignore`); à joindre à la GitHub Release `v0-original` si on veut la conserver |
| Git LFS | non nécessaire : aucun fichier ne dépasse 50 Mo |

Ce registre décrit les dettes visibles dans le code et les écarts par rapport au protocole du sujet CodeWash. Les risques et estimations sont des évaluations initiales à confirmer avec l’équipe. Les mesures non exécutées sont signalées comme telles plutôt que supposées.

## 1. Cartographie de l’application

```mermaid
flowchart TD
    Entry["src/main.jsx"] --> App["src/App.jsx<br/>orchestration et état global"]
    App --> Cards["components/skills/SkillCard.jsx<br/>cartes et mini-jeux"]
    App --> Drawers["components/drawers/*<br/>menu, réglages, cosmétiques"]
    App --> Modals["components/modals/*"]
    App --> UI["components/ui/*"]
    App --> Data["constants/gameData.jsx<br/>thèmes, compétences et données"]
    App --> Ach["constants/achievements.js"]
    App --> Utils["utils/*<br/>règles, succès, sons, affichage"]
    App --> Storage["localStorage"]
    App --> Speech["Web Speech API"]
    Utils --> Audio["Audio / fichiers sons"]
    Cards --> Audio
    Entry --> GlobalCSS["index.css"]
    App --> GlobalStyles["components/ui/GlobalStyles.jsx"]
    Electron["electron/main.cjs"] --> Dist["dist/index.html<br/>application compilée"]
```

### Responsabilités et frontières observées

| Zone | Responsabilité actuelle |
|---|---|
| `src/App.jsx` | État du joueur et des profils, chargement/sauvegarde, progression, combats, succès, thèmes, événements, reconnaissance vocale et composition de l’interface. |
| `src/components/skills/SkillCard.jsx` | Présentation des compétences et logique interactive des jeux de mémoire, Simon, lecture, écriture, mathématiques et nettoyage. |
| `src/constants/gameData.jsx`, `src/constants/achievements.js` | Données des compétences, thèmes, contenus, ennemis, objets et succès. |
| `src/utils/gameUtils.js`, `achievementUtils.js`, `mobDisplayUtils.js` | Règles de jeu, progression et présentation de données. |
| `src/utils/soundManager.js` | Création et lecture des sons et gestion de la musique de fond. |
| `src/components/ui/GlobalStyles.jsx`, `src/index.css` | Styles globaux et animations. |
| `electron/main.cjs` | Création de la fenêtre Electron et chargement du build Vite. |

### État et entrées/sorties

- **État React partagé :** principalement dans `App.jsx` (profil courant, statistiques, compétences, thème, combat, challenge, volumes, état du micro et des panneaux). L’état temporaire des mini-jeux est dans `SkillCard.jsx`.
- **Stockage persistant :** `localStorage`, chargé et écrit directement par `App.jsx`; `PhantomEvent.jsx` y stocke aussi son délai de réapparition. Les clés de sauvegarde sont versionnées dans leur nom, mais aucun schéma de sauvegarde central n’est défini.
- **Audio :** API `Audio` directement appelée par le gestionnaire de sons et les mini-jeux.
- **Reconnaissance vocale :** `window.webkitSpeechRecognition` directement utilisée par `App.jsx`.
- **Navigateur/OS :** API plein écran du DOM et autorisation d’accès au microphone.
- **Réseau :** aucun transport de rapport de bogue n’est configuré dans le flux observé; la fenêtre de rapport est actuellement une simple présentation.

## 2. Registre des dettes

Les priorités sont définies ainsi : **P0** = prérequis bloquant avant refactoring, **P1** = risque élevé ou fonctionnalité importante, **P2** = amélioration à planifier. Les efforts sont des tailles indicatives : **S** (≤ 1 jour), **M** (2–5 jours), **L** (> 5 jours), à valider après découpage en tâches.

| ID | Emplacement | Problème / odeur | Impact et risque | Effort | Priorité | Statut |
|---|---|---|---|---|---|---|
| DEBT-01 | `CodeWashGame/package.json`; `CodeWashGame/.github/workflows/build-exe.yml` | Pas de suite de tests ni de commande de test/coverage. Le seul workflow reçu est dans `CodeWashGame/.github/`, un dossier que GitHub **ne lit pas** (seul le `.github/` racine est pris en compte) : il n’a donc jamais tourné. Même déplacé, il ne ferait que compiler l’exécutable Windows sur `push` vers `main`, sans vérifier les PR, les tests, le formatage, la couverture ni l’analyse statique. | **Critique.** Les régressions de progression, sauvegardes et mini-jeux peuvent être livrées sans détection automatisée. Écart direct avec le filet de sécurité demandé par le sujet. | M | P0 | **En cours** : Vitest + 43 tests de caractérisation sur `src/utils/*`; `.github/workflows/ci.yml` (lint, tests, seuils de couverture, build) sur chaque PR. Contrôle du formatage (Prettier, `npm run format:check`) ajouté à la CI. Restent : caractérisation des sauvegardes et de `App.jsx`, protection de branche, sort de `build-exe.yml`. |
| DEBT-02 | [`src/App.jsx`](../CodeWashGame/src/App.jsx), notamment initialisation et chargement (l. 49–221), effets de sauvegarde (l. 285–294) et orchestration (l. 422–1108) | Composant de 1 492 lignes qui regroupe état global, logique métier, persistance, audio, parole, timers et rendu. | **Élevé.** Les changements locaux peuvent affecter des parcours sans lien apparent; tests unitaires difficiles et régressions difficiles à isoler. | L | P1 | Ouverte |
| DEBT-03 | [`src/components/skills/SkillCard.jsx`](../CodeWashGame/src/components/skills/SkillCard.jsx), notamment états/hooks (l. 67–280), mini-jeux et rendu (l. 297–778) | Un seul composant de 778 lignes mélange plusieurs mini-jeux, leur état, leurs règles et le rendu. Plusieurs transitions sont pilotées par des `setTimeout` imbriqués. | **Élevé.** Les règles et effets de bord sont difficiles à tester séparément; le changement d’un mini-jeu peut dégrader les autres. Les callbacks différés compliquent l’annulation à la fin d’une partie. | L | P1 | Ouverte |
| DEBT-04 | [`src/App.jsx`](../CodeWashGame/src/App.jsx), chargement (l. 50–221) et sauvegarde (l. 285–294) | L’accès au stockage et les conversions JSON sont distribués dans le composant. Le chargement des compétences contient des adaptations de compatibilité inline; certains `JSON.parse` d’initialisation et les écritures synchrones ne sont pas protégés contre des données ou un stockage indisponibles. | **Élevé.** Une sauvegarde invalide, un quota dépassé ou un contexte sans stockage peut faire échouer le démarrage ou la sauvegarde; la migration et la validation des profils sont difficiles à vérifier. | M | P1 | Ouverte |
| DEBT-05 | [`src/App.jsx`](../CodeWashGame/src/App.jsx) (combat, l. 444–706; micro, l. 985–1100); [`src/components/skills/SkillCard.jsx`](../CodeWashGame/src/components/skills/SkillCard.jsx); [`src/utils/soundManager.js`](../CodeWashGame/src/utils/soundManager.js) | L’horloge, l’aléatoire, l’audio et la reconnaissance vocale sont appelés directement depuis l’interface et les règles. Les erreurs de lecture audio sont souvent absorbées par `.catch(() => {})`. | **Élevé.** Les tests de caractérisation sont non déterministes ou nécessitent de vrais périphériques; les erreurs audio ne sont pas observables et les effets retardés sont difficiles à contrôler. | M | P1 | Ouverte |
| DEBT-06 | [`src/components/modals/BugReportModal.jsx`](../CodeWashGame/src/components/modals/BugReportModal.jsx) | La fenêtre affiche un message, mais ne permet ni de saisir ni d’envoyer un rapport. Aucun destinataire ou transport de rapport n’est configuré. | **Moyen à élevé.** Le bouton ne fournit pas la fonctionnalité de signalement attendue dans le sujet; les erreurs de production ne peuvent pas être transmises par ce parcours. | M | P1 | Ouverte |
| DEBT-07 | [`src/components/ui/GlobalStyles.jsx`](../CodeWashGame/src/components/ui/GlobalStyles.jsx) et [`src/constants/gameData.jsx`](../CodeWashGame/src/constants/gameData.jsx) | Styles/animations globaux et données de jeu volumineux concentrés dans de grands modules; les frontières entre données de thème, présentation et comportement ne sont pas matérialisées par des interfaces explicites. | **Moyen.** Les changements de thème ou d’interface demandent de parcourir de gros fichiers et augmentent le risque d’incohérences visuelles. | M | P2 | Ouverte |
| DEBT-08 | [`src/components/drawers/MenuDrawer_old.jsx`](../CodeWashGame/src/components/drawers/MenuDrawer_old.jsx) | Fichier de drawer historique présent; aucune référence d’import n’a été trouvée dans `src/`. jscpd le signale comme copie de `MenuDrawer.jsx` (4 clones, dont un de 133 lignes) : il représente la majorité de la duplication mesurée. | **Faible.** Peut induire l’équipe en erreur sur le composant réellement utilisé et encombrer les recherches. Vérifier l’absence de dépendance externe avant suppression. | S | P2 | À confirmer |
| DEBT-09 | [`src/utils/gameUtils.js`](../CodeWashGame/src/utils/gameUtils.js), `generateMathProblem`, cas `'-'` | Le commentaire annonce « Ensure positive result », mais avec `range: [0, 20]` le premier opérande peut valoir 0 et `b` vaut alors au moins 1 : la question `0 - 1 = ?` attend `-1`. Comportement figé par un test `QUIRK`. | **Moyen.** Contenu pédagogique incohérent pour de jeunes joueurs (nombre négatif à un niveau qui n’en enseigne pas). | S | P2 | Ouverte (découverte par les tests de caractérisation) |
| DEBT-10 | `CodeWashGame/package-lock.json` | `npm audit` : 36 vulnérabilités dans les dépendances de développement et d’empaquetage (4 critiques, 20 élevées, 11 modérées, 1 faible), notamment `electron`, `electron-builder`/`app-builder-lib`, `@babel/core`. `npm audit --omit=dev` : 0. | **Moyen.** Pas d’impact sur le bundle web, mais l’exécutable Electron embarque une version vulnérable de Chromium. | M | P1 | Ouverte |

## 3. Mesures de référence

Mesures relevées avant tout refactoring applicatif, sur le code du tag `v0-original`.

### 3.1 Tailles de fichiers

Sept fichiers source ciblés. Les tailles sont des lignes et octets de fichier, pas des mesures de complexité ou de duplication.

| Fichier | Lignes | Octets |
|---|---:|---:|
| `src/App.jsx` | 1 492 | 71 572 |
| `src/components/skills/SkillCard.jsx` | 778 | 50 431 |
| `src/components/ui/GlobalStyles.jsx` | 1 302 | 44 354 |
| `src/constants/gameData.jsx` | 416 | 27 466 |
| `src/utils/gameUtils.js` | 363 | 16 368 |
| `src/utils/achievementUtils.js` | 217 | 7 199 |
| `src/utils/soundManager.js` | 287 | 7 632 |
| **Total des sept fichiers** | **4 855** | **225 022** |

Outil : GNU `wc -l -c` exécuté sur les sept chemins ci-dessus.

### 3.2 Environnement de mesure

Node.js v24.22.2, npm 11.19.1, ESLint 9.39, Vitest 3.2.4 + `@vitest/coverage-v8`, jscpd 4.0.5 (versions exactes dans `package-lock.json`). Toutes les commandes se lancent depuis `CodeWashGame/`.

| Vérification | Commande | Résultat de référence |
|---|---|---|
| Installation | `npm ci` | OK |
| Build | `npm run build` | OK : JS 362,79 kB (gzip 102,62 kB), CSS 61,77 kB (gzip 11,07 kB) |
| Lint | `npm run lint` | 0 erreur, 0 avertissement |

### 3.3 Couverture de tests

- **Avant (code reçu) :** aucun test, aucun runner. Couverture non mesurable, donc 0 ligne exécutée par des tests.
- **Après le premier lot de caractérisation :** `npm run test:coverage`, 43 tests sur `src/utils/*`.

| Périmètre | Lignes | Branches | Fonctions |
|---|---:|---:|---:|
| Tout `src/` (hors tests et `main.jsx`) | 24,46 % (955/3 903) | 67,82 % | 41,37 % |
| `utils/achievementUtils.js` | 100 % | 100 % | 100 % |
| `utils/gameUtils.js` | 98,19 % | 66,66 % | 100 % |
| `utils/mobDisplayUtils.js` | 95,83 % | 0 % | 100 % |
| `App.jsx`, composants, `soundManager.js` | 0 % | 0 % | 0 % |

Le pourcentage global est gonflé par les fichiers de données (`constants/*`), exécutés à l’import. **Les flux critiques de l’interface (`App.jsx`, `SkillCard.jsx`, sauvegardes) ne sont pas encore couverts.** Les seuils de `vite.config.js` sont un cliquet posé juste sous ces valeurs.

### 3.4 Complexité cyclomatique

Outil : règle ESLint `complexity` (seuil 10), `npm run metrics:complexity`. **14 fonctions** dépassent 10. Les plus complexes :

| Complexité | Emplacement |
|---:|---|
| 107 | `src/components/skills/SkillCard.jsx:65` (composant `SkillCard`) |
| 31 | `src/App.jsx:94` |
| 27 | `src/components/drawers/MenuDrawer.jsx:142` |
| 24 | `src/App.jsx:569` |
| 21 | `src/components/drawers/CosmeticsDrawer.jsx:108` |
| 17 | `src/App.jsx:444` |
| 16 | `src/App.jsx:49` et `src/App.jsx:1387` |
| 15 | `src/components/drawers/CosmeticsDrawer.jsx:227`, `src/utils/gameUtils.js:33` (`getMobForSkill`) |

### 3.5 Duplication

Outil : jscpd 4.0.5, clones ≥ 50 tokens, tests exclus, `npm run metrics:duplication`.

| Format | Fichiers | Clones | Lignes dupliquées |
|---|---:|---:|---:|
| JavaScript | 20 | 2 | 161 (6,47 %) |
| JSX | 16 | 7 | 163 (5,69 %) |
| CSS | 1 | 0 | 0 |
| **Total** | **37** | **9** | **324 (5,99 %)** |

Sources principales : `MenuDrawer_old.jsx` ↔ `MenuDrawer.jsx` (DEBT-08), trois blocs répétés dans `CosmeticsDrawer.jsx`, `ResetModal.jsx` ↔ `ParentalVerificationModal.jsx`, deux blocs dans `SkillCard.jsx`.

Comparer les mêmes périmètres avec les mêmes commandes avant/après chaque refactoring majeur.

## 4. Matrice de risque

Échelle qualitative : impact et probabilité de 1 (faible) à 3 (fort). Le niveau est une appréciation initiale, pas une fréquence observée.

| Dette | Impact | Probabilité | Niveau initial | Justification |
|---|---:|---:|---|---|
| DEBT-01 — absence de filet de tests/CI PR | 3 | 3 | **Critique** | Aucun test n’empêche une régression et aucun contrôle n’est exécuté sur les PR. |
| DEBT-02 — orchestration concentrée dans `App.jsx` | 3 | 3 | **Élevé** | De nombreuses fonctions métier et entrées/sorties partagent le même cycle de vie. |
| DEBT-03 — mini-jeux concentrés dans `SkillCard.jsx` | 3 | 2 | **Élevé** | Logique asynchrone et interactions de plusieurs jeux sont couplées dans le même composant. |
| DEBT-04 — persistance et migrations inline | 3 | 2 | **Élevé** | Les sauvegardes sont des données joueur persistantes et leur validation est dispersée. |
| DEBT-05 — effets système non isolés | 2 | 3 | **Élevé** | Aléatoire, timers, audio et microphone varient selon le navigateur et les périphériques. |
| DEBT-06 — rapport de bogue inactif | 2 | 2 | **Modéré** | Le parcours visible ne collecte ni ne transmet les informations de diagnostic. |
| DEBT-07 — styles et données volumineux | 2 | 2 | **Modéré** | Les évolutions de thèmes et d’interface sont plus risquées et coûteuses à relire. |
| DEBT-08 — ancien drawer non référencé | 1 | 2 | **Faible** | Dette de lisibilité, sans impact fonctionnel confirmé. |
| DEBT-09 — soustraction pouvant donner un négatif | 2 | 2 | **Modéré** | Se produit dès que le tirage donne 0 comme premier opérande (1 chance sur 21 par soustraction). |
| DEBT-10 — dépendances de dev/empaquetage vulnérables | 2 | 2 | **Modéré** | Touche l’exécutable Electron distribué, pas le bundle web. |

## 5. Plan d’attaque proposé

1. **Établir le filet de sécurité avant les refactorings (DEBT-01).** Installer et documenter le projet, choisir un runner, ajouter des tests de caractérisation des parcours critiques (chargement/sauvegarde, progression et combat, changement de profil, fin de partie et succès), puis faire exécuter build, tests, lint, formatage, analyse statique et rapport de couverture sur chaque PR. Appliquer la cible du sujet : 100 % du nouveau code et au moins 80 % des lignes modifiées couvertes.
2. **Isoler les effets de bord et sécuriser les sauvegardes (DEBT-04, DEBT-05).** Caractériser d’abord le format `localStorage` existant; centraliser validation, versionnement et migrations sans perdre les anciennes données. Injecter/encapsuler horloge, aléatoire, audio et reconnaissance vocale afin que les règles critiques soient testables sans navigateur ni microphone.
3. **Séparer les responsabilités sans changer les contrats (DEBT-02, DEBT-03).** Extraire d’abord les règles métier pures et les services de persistance, puis les flux de combat/compétences et les mini-jeux. Garder les signatures et le format des sauvegardes compatibles; procéder par petits commits réversibles avec les tests au vert.
4. **Livrer les fonctionnalités et la maintenance visibles (DEBT-06 à DEBT-08).** Décider du canal de signalement et de ses exigences de confidentialité avant d’implémenter l’envoi; découper les styles/données si cela facilite les changements prévus; confirmer que l’ancien drawer n’est pas utilisé puis le retirer dans un changement isolé.
5. **Mesurer, documenter et transmettre.** Reprendre les mesures avec les mêmes outils après chaque étape majeure, mettre à jour ce registre avec résultats avant/après et statuts, et documenter installation, lancement, tests et décisions d’architecture.

**Contrats à préserver pendant les travaux :** progression, difficulté et récompenses des compétences; comportement des profils et compatibilité des sauvegardes; parcours et commandes clavier/souris des mini-jeux; prise en charge vocale lorsqu’elle existe et comportement de repli lorsqu’elle n’existe pas; rendu des thèmes et lancement browser/Electron.
