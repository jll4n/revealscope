# RevealScope Discord Rating Bot

Base de projet pour un bot Discord Node.js avec stockage centralisé des notes dans MySQL.

## Structure

- `src/` : code source du bot
  - `commands/` : commandes du bot
  - `database/` : connexion MySQL
  - `events/` : gestion des événements Discord
  - `utils/` : utilitaires et loader de commandes
- `db/` : scripts d'initialisation de la base de données
- `.github/workflows/` : pipeline CI
- `docker-compose.yml` : configuration Docker pour l'application et MySQL
- `Dockerfile` : image de l'application

## Installation

1. Copier `.env.example` en `.env`
2. Remplir `DISCORD_TOKEN`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
3. Lancer `npm install` et `npm start`
4. Utiliser `docker compose up -d`

## Utilisation

### Lancer une session de notation

Un administrateur ou gérant peut démarrer une session de notation :

```bash
!session start Qualité du travail|Communication|Respect
```

Les questions sont séparées par `|`.

### Fermer une session

```bash
!session close
```

### Noter un utilisateur

Les membres peuvent répondre au questionnaire et donner une note globale :

```bash
!rate @utilisateur 8 réponse1|réponse2|réponse3
```

### Afficher les statistiques

- `!stats` : affiche la note moyenne du serveur et le top 5 des utilisateurs
- `!stats @utilisateur` : affiche la note moyenne du membre

### Intents Discord

Le bot utilise un intent `Message Content` pour lire les commandes préfixées. Si ce n’est pas activé dans le Discord Developer Portal, le bot peut toujours démarrer mais ne verra pas le contenu des messages.

- active `Message Content Intent` dans l’onglet `Bot` de ton application Discord
- ou définis `ENABLE_MESSAGE_CONTENT_INTENT=false` si tu veux démarrer sans cette permission

## Interface de base de données

Un accès phpMyAdmin est disponible sur `http://localhost:8080` une fois que Docker est démarré.

- utilisateur : `root`
- mot de passe : `antoine`
- hôte : `mysql`

## CI/CD

Une pipeline GitHub Actions est fournie pour installer les dépendances et lancer `npm run lint`.
