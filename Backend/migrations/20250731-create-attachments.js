//migrations/20250731-create-attachments.js
'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // attachments table
    await queryInterface.createTable('attachments', {
      id:           { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      original_name:{ type: Sequelize.STRING(255), allowNull: false },
      stored_name:  { type: Sequelize.STRING(255), allowNull: false },
      mime_type:    { type: Sequelize.STRING(100), allowNull: false },
      size:         { type: Sequelize.BIGINT, allowNull: false },
      path:         { type: Sequelize.STRING(500), allowNull: false },
      uploader_id:  { type: Sequelize.INTEGER, allowNull: false, references: { model: 'utilisateurs', key: 'id' } },
      uploaded_at:  { type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') }
    });
    // join table
    await queryInterface.createTable('procedure_attachments', {
      procedure_id: { type: Sequelize.INTEGER, primaryKey: true, references: { model: 'procedures', key: 'id' } },
      attachment_id:{ type: Sequelize.INTEGER, primaryKey: true, references: { model: 'attachments', key: 'id' } }
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('procedure_attachments');
    await queryInterface.dropTable('attachments');
  }
};