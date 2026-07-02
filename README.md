# RevealScope Discord Rating Bot

Recueillez l'avis de votre communauté Discord sur un produit ou service : une session de vote guidée (boutons + modal), des résultats agrégés par question, historisés en base MySQL et centralisés.

## Structure

- `src/` : code source du bot
  - `commands/` : slash commands (`/session`, `/stats`)
  - `handlers/` : gestion des boutons/modals de vote
  - `database/` : connexion MySQL (pool de connexions)
  - `events/` : gestion des événements Discord (ready, interactionCreate)
  - `utils/` : utilitaires et loader de commandes
- `test/` : tests (`node --test`) — commandes/handlers appelés avec une interaction et un pool MySQL mockés
- `db/` : scripts d'initialisation de la base de données
- `.github/workflows/` : pipeline CI (lint, vérification syntaxique, tests)
- `docker-compose.yml` : configuration Docker pour l'application, MySQL et phpMyAdmin
- `Dockerfile` : image de l'application

## Installation

1. Copier `.env.example` en `.env`
2. Remplir `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `DISCORD_GUILD_ID`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, et éventuellement `ALLOWED_USER_IDS`
3. Lancer `docker compose up -d mysql` pour démarrer la base
4. Lancer `npm install` puis `npm start` (ou `npm run dev` avec nodemon)

Voir `CLAUDE.md` pour le détail des variables d'environnement et du schéma de base de données.

## Utilisation

Toutes les commandes sont des **slash commands** Discord (pas de préfixe).

### Lancer une session de vote

Réservé aux membres avec la permission `Gérer le serveur` **et** dont l'ID Discord figure dans `ALLOWED_USER_IDS` (`.env`) — si cette variable est vide, seule la permission Discord s'applique :

```
/session start produit:iPhone 15 questions:Note le design|Note la rapidité
```

Les questions sont séparées par `|` (3 maximum). Le bot poste un embed avec un bouton **Voter**.

### Voter

1. Cliquer sur **Voter**
2. Noter chaque critère et la note générale via les menus déroulants
3. Cliquer sur **Valider**, puis renseigner un commentaire optionnel dans le modal

Un seul vote par utilisateur et par session.

### Fermer une session

```
/session stop
```

### Afficher les résultats

```
/stats canal:#nom-du-canal
```

Affiche les moyennes par question et la note générale, ainsi que le détail des votes de la dernière session du canal.

## Interface de base de données

Un accès phpMyAdmin est disponible sur `http://localhost:8080` une fois Docker démarré.

- utilisateur : `root`
- mot de passe : `antoine`
- hôte : `mysql`

## Tests

```bash
npm test
```

Exécute `node --test test/` : les commandes et handlers sont appelés directement avec une interaction Discord et un pool MySQL mockés (`test/helpers/mockInteraction.js`), sans connexion réseau réelle, pour vérifier qu'aucune commande ne plante.

## CI/CD

La pipeline GitHub Actions (`.github/workflows/ci.yml`) exécute à chaque push/PR vers `main` :

- `npm run lint` (ESLint)
- une vérification syntaxique de tous les fichiers `src/*.js`
- `npm test`

Le déploiement VPS n'est pas encore automatisé.
