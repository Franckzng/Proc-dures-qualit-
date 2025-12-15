// backend/models/procedure.model.js
module.exports = (sequelize, DataTypes) => {
  const Procedure = sequelize.define('Procedure', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    titre: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true
    },
    description: DataTypes.TEXT,
    // contenu supprimé - géré par steps
    version: {
      type: DataTypes.STRING(20),
      defaultValue: '1.0'
    },
    statut: {
      type: DataTypes.ENUM(
        'BROUILLON',
        'EN_REVISION',
        'EN_APPROBATION',
        'APPROUVEE',
        'PUBLIEE',
        'ARCHIVEE',
        'REJETEE'
      ),
      defaultValue: 'BROUILLON'
    },
    departement_id: DataTypes.INTEGER,
    processus: DataTypes.STRING(100),
    norme: DataTypes.STRING(100),
    redacteur_id: DataTypes.INTEGER,
    date_creation: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    date_modification: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    date_archivage: DataTypes.DATE,
    date_publication: DataTypes.DATE
  }, {
    tableName: 'procedures',
    timestamps: false
  });

  Procedure.associate = (models) => {
    if (models.Step) {
      Procedure.hasMany(models.Step, { foreignKey: 'procedure_id' });
    }

    if (models.Attachment) {
      Procedure.belongsToMany(models.Attachment, {
        through: 'procedure_attachments',
        foreignKey: 'procedure_id',
        otherKey: 'attachment_id',
        timestamps: false
      });
    }
  };

  return Procedure;
};
