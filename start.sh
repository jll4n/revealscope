#!/usr/bin/env bash
set -e

echo "Démarrage de MySQL et phpMyAdmin..."
docker compose up -d mysql phpmyadmin

echo "Attente que MySQL soit prêt..."
until docker compose exec mysql mysqladmin ping -h localhost --silent 2>/dev/null; do
  sleep 2
done
echo "MySQL prêt."

echo "Installation des dépendances..."
npm install

echo "Lancement du bot..."
npm start
