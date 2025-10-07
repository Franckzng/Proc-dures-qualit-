// backend/models/stepVersion.model.js
module.exports = (sequelize, DataTypes) => {
  const StepVersion = sequelize.define('StepVersion', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    step_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    procedure_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    numero_version: {
      type: DataTypes.STRING(50),
      defaultValue: '1.0'
    },
    contenu: {
      type: DataTypes.TEXT('long'),
      allowNull: true
    },
    titre: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    },
    utilisateur_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    action: {
      type: DataTypes.ENUM('CREATE', 'UPDATE', 'DELETE'),
      defaultValue: 'UPDATE'
    },
    changed_fields: {
      type: DataTypes.JSON,
      allowNull: true
    },
    date_creation: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'step_versions',
    timestamps: false
  });

  StepVersion.associate = (models) => {
    StepVersion.belongsTo(models.Step, { foreignKey: 'step_id' });
    StepVersion.belongsTo(models.Procedure, { foreignKey: 'procedure_id' });
  };

  return StepVersion;
};
