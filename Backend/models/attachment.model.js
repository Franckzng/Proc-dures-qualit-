// backend/models/attachment.model.js
module.exports = (sequelize, DataTypes) => {
  const Attachment = sequelize.define('Attachment', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    original_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    stored_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    mime_type: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    size: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    path: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    uploader_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'attachments',
    timestamps: true,
    createdAt: 'uploaded_at',
    updatedAt: false
  });

  Attachment.associate = (models) => {
    // many-to-many with Procedure
    if (models.Procedure) {
      Attachment.belongsToMany(models.Procedure, {
        through: 'procedure_attachments',
        foreignKey: 'attachment_id',
        otherKey: 'procedure_id',
        timestamps: false
      });
    }

    // optionnel : si tu as un modèle Utilisateur (par ex. 'Utilisateur' ou 'User')
    // tu peux créer la relation uploader -> user ici :
    // if (models.Utilisateur) {
    //   Attachment.belongsTo(models.Utilisateur, { foreignKey: 'uploader_id', as: 'uploader' });
    // }
  };

  return Attachment;
};
