# RevealScope — Bot Discord de notation

Bot Discord permettant aux gérants d'un serveur de lancer des sessions de vote sur un produit/service via un questionnaire interactif, centralisé dans une base MySQL.

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
    stats.js            # /stats [utilisateur]
  handlers/
    vote.js             # Gestion bouton "Voter" + soumission modal
  database/
    mysql.js            # Pool de connexions, fonctions connectDatabase() / getPool()
  events/
    ready.js            # Événement ready
    interactionCreate.js # Routage slash commands, boutons et modals
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
| `DB_HOST` | Hôte MySQL (`mysql` en Docker, `127.0.0.1` en local) |
| `DB_USER` | Utilisateur MySQL |
| `DB_PASSWORD` | Mot de passe MySQL |
| `DB_NAME` | Nom de la base (`revealscope`) |

## Schéma BDD

**`rating_sessions`** — une session par serveur, une seule active à la fois (`active = 1`)
- `product_name` : nom du produit/service soumis au vote
- `questions` : JSON array de strings (max 4)
- `opened_by`, `channel_id` : IDs Discord (snowflakes, VARCHAR 64)

**`ratings`** — une ligne par vote, un seul vote par `author_id` par session
- `author_id` : utilisateur qui a voté
- `score` : note générale 1–10
- `answers` : JSON array d'entiers — note 1–10 par question, aligné sur `questions` de la session
- FK `session_id → rating_sessions.id ON DELETE CASCADE`

## Flux de vote

1. Gérant : `/session start produit:iPhone 15 questions:Note le design|Note la rapidité`
2. Le bot poste un **embed** dans le canal avec un bouton **"Voter"**
3. L'utilisateur clique → **modal** Discord avec un champ par question + note générale
4. L'utilisateur valide → vote enregistré (un seul vote par personne par session)
5. Gérant : `/session stop` pour clore

## Commandes Discord

| Commande | Permission | Description |
|---|---|---|
| `/session start produit:X questions:Q1\|Q2` | ManageGuild | Lance une session de vote (max 4 questions) |
| `/session stop` | ManageGuild | Clôture la session active |
| `/stats` | Tous | Moyenne globale + top 5 du serveur |
| `/stats utilisateur:@user` | Tous | Moyenne et nombre de notes d'un utilisateur |

## Lancer le projet en local

```bash
# Copier les variables d'environnement
cp .env.example .env
# Éditer .env avec les vraies valeurs (DB_HOST=127.0.0.1 en local)

# Démarrer MySQL via Docker
docker compose up -d mysql

# Installer les dépendances
npm install

# Lancer le bot
npm start
```

> Après toute modification du schéma SQL (`db/init.sql`), recréer le volume :
> `docker compose down -v && docker compose up -d mysql`

## CI/CD

- **Lint** : `npm run lint` (ESLint) déclenché sur chaque push/PR vers `main`
- Les secrets GitHub nécessaires : `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `DISCORD_GUILD_ID`, `DB_*`
- Le déploiement VPS n'est pas encore automatisé — prévu en phase finale

## Conventions impératives

- **Messages du bot en français** : toutes les `interaction.reply()`, embeds, descriptions d'options → français
- **Code en anglais** : noms de variables, fonctions, commentaires → anglais
- **Pas de TypeScript** : JavaScript pur uniquement
- Toujours utiliser `interaction.reply({ ephemeral: true })` pour les messages d'erreur utilisateur
- Toujours utiliser `pool.execute()` (paramètres préparés), jamais d'interpolation directe dans les requêtes SQL
- Ajouter une nouvelle commande = créer un fichier dans `src/commands/` et exporter `{ data, execute }` — le loader est automatique
- Les handlers de boutons/modals vont dans `src/handlers/`, pas dans `src/commands/`

## Ce qui reste à faire / axes d'évolution

- Automatiser le déploiement VPS dans le workflow GitHub Actions (SSH + Docker pull)
- Ajouter des tests d'intégration dans la CI
- Afficher les résultats détaillés par question dans `/stats`
