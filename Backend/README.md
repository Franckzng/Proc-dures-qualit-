# Application de Gestion des Procédures Qualité

## Nouvelles Fonctionnalités Intégrées

### ✅ Fonctionnalités Prioritaires Implémentées

1. **Système d'Audit Complet**
   - Traçabilité de toutes les actions (CREATE, UPDATE, DELETE, APPROVE, REJECT)
   - Logs avec utilisateur, IP, détails de l'action
   - Rapports d'audit par période

2. **Versioning des Procédures**
   - Archivage automatique avant modification
   - Historique complet des versions
   - Restauration de versions antérieures
   - Snapshot JSON du contenu

3. **Notifications**
   - Notifications in-app pour les workflows
   - Notifications d'assignation de tâches
   - Notifications d'approbation/rejet
   - Marquage lu/non-lu

4. **Recherche Avancée**
   - Recherche full-text dans titre, description, contenu
   - Filtres multiples (statut, département, processus, norme, dates)
   - Recherche dans les pièces jointes

5. **Rapports et Statistiques**
   - Taux d'approbation par période
   - Temps moyen d'approbation
   - Taux de rejet par utilisateur
   - Procédures par département/norme
   - Procédures obsolètes (> X mois)
   - Performance des workflows

6. **Documentation API**
   - Swagger UI disponible sur `/api-docs`
   - Documentation OpenAPI 3.0

## Installation

### 1. Installer les dépendances
```bash
cd Backend
npm install
```

### 2. Exécuter les migrations
```bash
npm run migrate
```

### 3. Démarrer le serveur
```bash
npm run dev
```

## Nouveaux Endpoints

### Audit
- `GET /api/audit/logs` - Liste des logs d'audit
- `GET /api/audit/report` - Rapport d'audit par période

### Notifications
- `GET /api/notifications` - Notifications de l'utilisateur
- `PUT /api/notifications/:id/read` - Marquer comme lu
- `PUT /api/notifications/read-all` - Tout marquer comme lu

### Recherche
- `GET /api/search/advanced` - Recherche avancée avec filtres
- `GET /api/search/attachments` - Recherche dans les pièces jointes

### Rapports
- `GET /api/reports/approval-rate` - Taux d'approbation
- `GET /api/reports/approval-time` - Temps moyen d'approbation
- `GET /api/reports/rejection-by-user` - Rejets par utilisateur
- `GET /api/reports/by-department` - Procédures par département
- `GET /api/reports/by-norme` - Procédures par norme
- `GET /api/reports/obsolete` - Procédures obsolètes
- `GET /api/reports/workflow-performance` - Performance workflows

### Versions
- `GET /api/versions/procedure/:procedureId` - Historique des versions
- `GET /api/versions/:versionId` - Détail d'une version
- `POST /api/versions/procedure/:procedureId` - Créer une version
- `POST /api/versions/:versionId/restore` - Restaurer une version

## Documentation API

Accédez à la documentation Swagger : `http://localhost:5000/api-docs`

## Exemples d'utilisation

### Recherche avancée
```bash
GET /api/search/advanced?keyword=qualité&statut=APPROUVEE,PUBLIEE&departement_id=1&dateDebut=2024-01-01
```

### Rapport d'audit
```bash
GET /api/audit/report?startDate=2024-01-01&endDate=2024-12-31
```

### Procédures obsolètes
```bash
GET /api/reports/obsolete?months=12
```

## Architecture

### Services
- `auditService.js` - Gestion des logs d'audit
- `versionService.js` - Gestion du versioning
- `notificationService.js` - Gestion des notifications
- `searchService.js` - Recherche avancée
- `reportService.js` - Génération de rapports

### Middlewares
- `auditMiddleware.js` - Logging automatique des actions

### Modèles
- `auditLog.model.js` - Logs d'audit
- `procedureVersion.model.js` - Versions de procédures
- `notification.model.js` - Notifications

## Prochaines Étapes (Optionnel)

### Priorité Moyenne
- Chiffrement des données sensibles
- Conformité RGPD (export/suppression)
- Gestion des révisions périodiques
- Tests unitaires et d'intégration

### Priorité Basse
- Intégration ERP
- Signature électronique
- CI/CD et Docker
- Monitoring (Prometheus/Grafana)
