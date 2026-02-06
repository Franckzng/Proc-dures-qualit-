#!/bin/bash

echo "🚀 Installation des nouvelles fonctionnalités..."

# Installation des dépendances
echo "📦 Installation des dépendances..."
npm install

# Exécution des migrations
echo "🗄️  Exécution des migrations..."
npm run migrate

echo "✅ Installation terminée!"
echo ""
echo "📚 Documentation API disponible sur: http://localhost:5000/api-docs"
echo ""
echo "🎯 Nouvelles fonctionnalités:"
echo "  - Audit complet (logs + rapports)"
echo "  - Versioning des procédures"
echo "  - Notifications in-app"
echo "  - Recherche avancée"
echo "  - Rapports statistiques"
echo ""
echo "Pour démarrer le serveur: npm run dev"
