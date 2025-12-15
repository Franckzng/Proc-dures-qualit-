// migrations/20250724-create-workflow-module.js
'use strict';

/**
 * Migration Sequelize : Création des tables workflows_approbation et etapes_workflow
 * Sans clés étrangères automatiques (dev rapide)
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Table workflows_approbation
    await queryInterface.createTable('workflows_approbation', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      procedure_id: { type: Sequelize.INTEGER, allowNull: false },
      initiateur_id: { type: Sequelize.INTEGER, allowNull: false },
      type_workflow: { type: Sequelize.STRING(50), allowNull: false, defaultValue: 'validation' },
      statut: {
        type: Sequelize.ENUM('EN_COURS', 'APPROUVE', 'REJETE', 'ANNULE'),
        allowNull: false,
        defaultValue: 'EN_COURS'
      },
      commentaire: { type: Sequelize.TEXT, allowNull: true },
      date_initiation: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      date_finalisation: { type: Sequelize.DATE, allowNull: true }
    });
    await queryInterface.addIndex('workflows_approbation', ['statut']);
    await queryInterface.addIndex('workflows_approbation', ['date_initiation']);

    // 2. Table etapes_workflow
    await queryInterface.createTable('etapes_workflow', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      workflow_id: { type: Sequelize.INTEGER, allowNull: false },
      role_id: { type: Sequelize.INTEGER, allowNull: true },
      utilisateur_id: { type: Sequelize.INTEGER, allowNull: true },
      ordre: { type: Sequelize.INTEGER, allowNull: false },
      statut: {
        type: Sequelize.ENUM('EN_ATTENTE', 'VALIDE', 'REJETE', 'ANNULE'),
        allowNull: false,
        defaultValue: 'EN_ATTENTE'
      },
      commentaire: { type: Sequelize.TEXT, allowNull: true },
      date_traitement: { type: Sequelize.DATE, allowNull: true },
      deadline: { type: Sequelize.DATE, allowNull: true },
      date_creation: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addConstraint('etapes_workflow', {
      fields: ['workflow_id', 'ordre'],
      type: 'unique',
      name: 'unique_etape_per_workflow'
    });
    await queryInterface.addIndex('etapes_workflow', ['statut']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('etapes_workflow');
    await queryInterface.dropTable('workflows_approbation');
  }
};
