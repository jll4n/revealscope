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
3. Lancer `npm install`
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

## CI/CD

Une pipeline GitHub Actions est fournie pour installer les dépendances et lancer `npm run lint`.
