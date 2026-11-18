# Normes de Commit & Workflow Git — CodeWash Inc.

Ce document définit les règles de gestion de version et de rédaction des messages de commit pour le projet **CodeWash**. Conformément à la **Règle du Boy Scout** exigée par le sujet, notre historique Git doit être propre, lisible, réversible et permettre à l'équipe suivante de comprendre chaque décision sans avoir à nous poser de questions.

## 1. Les Règles d'Or

1. **Un commit = Une intention (Atomicité) :** Ne mélangez jamais un refactoring, une correction de bug et un ajout de fonctionnalité dans le même commit. Chaque commit doit être petit et facilement réversible (`git revert`).

2. **Premier push brut :** Le tout premier commit du dépôt doit contenir le code source original exact, sans aucune modification.

3. **Jamais de commit cassé :** Le code poussé doit compiler et passer les tests locaux. Sur les branches protégées (`main`/`develop`), **aucun merge n'est autorisé si la CI est rouge**.

4. **Traçabilité obligatoire :** Tout commit de refactoring doit être lié à une entrée du registre de dette technique (`docs/DEBT.md`) et/ou à une issue GitHub.

## 2. Format des messages de commit

Nous suivons la norme **Conventional Commits**. Chaque message doit respecter la structure suivante :

```
<type>(<scope>): <description courte à l'impératif>

[corps optionnel : explique le POURQUOI du changement et non le COMMENT]

[pied de page optionnel : références DEBT-XX, Issues, Breaking Changes]

```

### Règles de syntaxe :

* **`<type>`** : Obligatoire, en minuscules (voir liste ci-dessous).

* **`(<scope>)`** : Fortement recommandé, en minuscules, indique la partie du projet impactée.

* **`<description>`** : Obligatoire, concise (**72 caractères maximum**), écrite à l'impératif présent (ex. *add*, *fix*, *extract*), sans point final.

* **Langue :** Utilisez l'**anglais** pour les mots-clés et descriptions (standard professionnel compatible avec les outils de CI/linting), ou restez strictement cohérents sur l'ensemble du dépôt.

## 3. Types de commits autorisés

| Type | Rôle | Exemple d'usage dans CodeWash | 
| ----- | ----- | ----- | 
| **`feat`** | Ajout d'une nouvelle fonctionnalité (missions) | Ajout du mini-jeu Trivia, sélecteur de langue, rapport de bug | 
| **`fix`** | Correction d'un bug existant | Correction d'une image déformée dans un thème, crash au lancement | 
| **`refactor`** | Réécriture/nettoyage du code sans changer son comportement | Extraction de la logique métier hors de l'UI, suppression d'une globale | 
| **`test`** | Ajout ou modification de tests | Ajout des tests de caractérisation (*Pre-wash*), tests unitaires | 
| **`docs`** | Ajout ou mise à jour de la documentation | Création du `README.md`, mise à jour de `docs/DEBT.md`, ajout d'un ADR | 
| **`perf`** | Amélioration des performances et de l'UX | Écran de chargement au démarrage, optimisation du menu principal | 
| **`ci`** | Configuration de l'intégration continue et des scripts | Ajout du workflow GitHub Actions, configuration du linter/coverage | 
| **`style`** | Formatage du code uniquement (espaces, indentation, linter) | Passage du formateur automatique sans changement de logique | 
| **`chore`** | Tâches de maintenance, dépendances, configuration | Ajout d'un script de lancement Windows, mise à jour du `.gitignore` | 
| **`revert`** | Annulation d'un commit précédent | Retour en arrière suite à une régression détectée | 

## 4. Traçabilité avec le Registre de Dette (`docs/DEBT.md`)

Lors de la soutenance, chaque refactoring doit être justifiable par une entrée dans `docs/DEBT.md`. Utilisez le pied de page de vos commits pour référencer l'identifiant de la dette traitée :

```
refactor(core): decouple game clock from main loop

Inject an IClock interface instead of calling system time directly
to make game state transitions deterministic during unit tests.

Refs: DEBT-03, #14

```

Si un commit met à jour le statut d'une dette ou ajoute une mesure de couverture avant/après, mentionnez-le également :

```
docs(debt): update DEBT-03 status to resolved and log coverage metrics

```

## 5. Exemples concrets

### Bien

* `chore(setup): add windows launch script and installation guide`

* `test(core): add characterization tests for crafting table scoring`

* `refactor(io): isolate audio playback behind an IAudioService interface`

* `perf(ui): add startup loading screen with progress percentage`

* `feat(i18n): add language selector button in main menu`

* `docs(adr): add ADR-002 explaining choice of bug reporting transport`

### Pas Bien

* `fix stuff` *(trop vague, aucun contexte)*

* `WIP` *(ne pas pousser de travail inachevé sur les branches partagées)*

* `refactor menu, add translation and fix audio bug` *(3 intentions différentes dans un seul commit : impossible à revert proprement)*

* `feat: ajout des thèmes et aussi j'ai changé les tailles des images et mis à jour le readme` *(trop long, mélange plusieurs types)*

## 7. Workflow Git & Pull Requests

1. **Nommage des branches :**

   * `feat/<nom-court>` (ex. `feat/trivia-game`, `feat/bug-reporting`)

   * `refactor/<id-dette>-<nom-court>` (ex. `refactor/debt-02-remove-globals`)

   * `fix/<nom-court>` (ex. `fix/theme-image-scaling`)

   * `docs/<nom-court>` (ex. `docs/runbook-and-adr`)

2. **Pull Requests (PR) :**

   * Chaque PR doit cibler une tâche précise.

   * La description de la PR doit indiquer : **l'objectif**, **le lien vers `DEBT-XX` ou l'issue**, et **l'évolution de la couverture de tests**.

   * Vérifiez que tous les contrôles de la CI (build, tests, linter, analyse statique, seuils de couverture) sont au vert avant de demander une revue de code.