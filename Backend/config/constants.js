// backend/config/constants.js
module.exports = {
  ROLE_ADMIN:        1,
  ROLE_APPROBATEUR:  2,
  ROLE_VERIFICATEUR: 3,
  ROLE_REDACTEUR:    4,
  ROLE_UTILISATEUR:  5,
  // statuts pour la table workflows_approbation
  STATUT_EN_COURS:       'EN_COURS',
  STATUT_EN_REVISION:    'EN_REVISION',
  STATUT_EN_APPROBATION: 'EN_APPROBATION',
  STATUT_APPROUVE:       'APPROUVE',   // pour workflows_approbation
  STATUT_REJETE:         'REJETE',

  // statuts pour la table procedures
  STATUT_BROUILLON:      'BROUILLON',
  STATUT_EN_REVISION:    'EN_REVISION',   // déjà là
  STATUT_EN_APPROBATION: 'EN_APPROBATION',// déjà là
  STATUT_APPROUVEE:      'APPROUVEE',     // <-- notez les deux "E"
  STATUT_REJETEE:        'REJETEE',
  STATUT_PUBLIEE:        'PUBLIEE'
}