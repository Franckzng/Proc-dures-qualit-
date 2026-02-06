# Système de Gestion des Procédures Qualité

Application web pour la gestion centralisée des procédures qualité avec workflow d'approbation.

## Technologies

**Backend:**
- Node.js + Express
- MySQL
- JWT Authentication
- Sequelize ORM

**Frontend:**
- Angular 20
- Bootstrap 5
- Bootstrap Icons

## Installation

### Backend
```bash
cd Backend
npm install
npm run migrate
node app.js
```

### Frontend
```bash
cd Frontend
npm install
ng serve
```

## Accès
- Frontend: http://localhost:4200
- Backend API: http://localhost:5000
- API Docs: http://localhost:5000/api-docs

## Comptes de test
- Admin: admin@qualite.com
- Rédacteur: redacteur@test.com
- Vérificateur: verif@test.com
- Approbateur: approbateur@test.com
- Utilisateur: user@test.com

## Fonctionnalités
- Gestion des procédures (CRUD)
- Workflow d'approbation (Vérificateur → Approbateur)
- Notifications en temps réel
- Recherche avancée avec filtres
- Rapports et statistiques
- Versioning des procédures
- Logs d'audit complets
- Gestion des pièces jointes
