# RevealScope — Bot Discord de notation

Bot Discord permettant aux gérants d'un serveur de lancer des sessions de notation d'un service/produit via un questionnaire, centralisé dans une base MySQL.

## Stack technique

- **Runtime** : Node.js 20, ESModules (`"type": "module"`)
- **Bot** : discord.js v14 (slash commands uniquement, pas de prefix)
- **BDD** : MySQL 8 via mysql2/promise, conteneurisé avec Docker
- **CI/CD** : GitHub Actions (lint sur push/PR vers `main`)
- **Package manager** : npm

## Architecture

```
src/
  index.js              # Point d'entrée : DB → register slash commands → login
  commands/
    session.js          # /session start|stop  (réservé ManageGuild)
    rate.js             # /rate <utilisateur> <note> [réponses]
    stats.js            # /stats [utilisateur]
  database/
    mysql.js            # Pool de connexions, fonctions connectDatabase() / getPool()
  events/
    ready.js            # Événement ready
    interactionCreate.js # Routage des slash commands
  utils/
    commandLoader.js    # Chargement dynamique des fichiers de commands/
db/
  init.sql              # Schéma initial (rating_sessions + ratings)
.github/workflows/
  ci.yml                # Lint ESLint sur Node 20
Dockerfile
docker-compose.yml
.env.example
```

## Variables d'environnement (`.env`)

| Variable | Description |
|---|---|
| `DISCORD_TOKEN` | Token du bot Discord |
| `DISCORD_CLIENT_ID` | Application ID Discord |
| `DISCORD_GUILD_ID` | ID du serveur (si vide → commandes globales, délai 1h) |
| `DB_HOST` | Hôte MySQL (ex: `mysql` en Docker, `localhost` en local) |
| `DB_USER` | Utilisateur MySQL |
| `DB_PASSWORD` | Mot de passe MySQL |
| `DB_NAME` | Nom de la base (`revealscope`) |

## Schéma BDD

**`rating_sessions`** — une session par serveur, une seule active à la fois (`active = 1`)
- `questions` : JSON array de strings
- `opened_by`, `channel_id` : IDs Discord (snowflakes, VARCHAR 64)

**`ratings`** — une ligne par vote
- `user_id` : la personne notée ; `author_id` : celle qui note
- `score` : entier 1–10
- `answers` : JSON array aligné sur `questions` de la session
- FK `session_id → rating_sessions.id ON DELETE CASCADE`

## Commandes Discord

| Commande | Permission | Description |
|---|---|---|
| `/session start questions:Q1\|Q2` | ManageGuild | Lance une session avec les questions données |
| `/session stop` | ManageGuild | Clôture la session active |
| `/rate utilisateur:@user note:8 réponses:R1\|R2` | Tous | Note un utilisateur dans la session active |
| `/stats` | Tous | Moyenne globale + top 5 du serveur |
| `/stats utilisateur:@user` | Tous | Moyenne et nombre de notes d'un utilisateur |

## Lancer le projet en local

```bash
# Copier les variables d'environnement
cp .env.example .env
# Éditer .env avec les vraies valeurs

# Démarrer MySQL via Docker
docker-compose up -d

# Installer les dépendances
npm install

# Lancer le bot (mode dev avec rechargement auto)
npm run dev
```

## CI/CD

- **Lint** : `npm run lint` (ESLint) déclenché sur chaque push/PR vers `main`
- Les secrets GitHub nécessaires : `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `DB_*` (pour d'éventuels tests futurs)
- Le déploiement VPS n'est pas encore automatisé — prévu en phase finale

## Conventions impératives

- **Messages du bot en français** : toutes les `interaction.reply()`, embeds, descriptions d'options → français
- **Code en anglais** : noms de variables, fonctions, commentaires → anglais
- **Pas de TypeScript** : JavaScript pur uniquement
- Toujours utiliser `interaction.reply({ ephemeral: true })` pour les messages d'erreur utilisateur
- Toujours utiliser `pool.execute()` (paramètres préparés), jamais d'interpolation directe dans les requêtes SQL
- Ajouter une nouvelle commande = créer un fichier dans `src/commands/` et exporter `{ data, execute }` — le loader est automatique

## Ce qui reste à faire / axes d'évolution

- Automatiser le déploiement VPS dans le workflow GitHub Actions (SSH + Docker pull)
- Améliorer l'UX du questionnaire (modal Discord plutôt que le paramètre `réponses` séparé par `|`)
- Ajouter des tests d'intégration dans la CI
