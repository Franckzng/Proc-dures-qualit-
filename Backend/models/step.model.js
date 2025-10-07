// backend/models/step.model.js
module.exports = (sequelize, DataTypes) => {
  const Step = sequelize.define('Step', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    procedure_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    ordre: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    titre: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    contenu: {
      type: DataTypes.TEXT('long'),
      allowNull: true
    },
    type: {
      type: DataTypes.STRING(50),
      defaultValue: 'ETAPE'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    },
    pos_x: {
      type: DataTypes.DOUBLE,
      allowNull: true
    },
    pos_y: {
      type: DataTypes.DOUBLE,
      allowNull: true
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    date_creation: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    date_modification: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'steps',
    timestamps: false
  });

  Step.associate = (models) => {
    Step.belongsTo(models.Procedure, { foreignKey: 'procedure_id' });
    // Parent/Children via models.Step
    Step.belongsTo(models.Step, { as: 'Parent', foreignKey: 'parent_id' });
    Step.hasMany(models.Step, { as: 'Children', foreignKey: 'parent_id' });

    Step.hasMany(models.StepVersion, { foreignKey: 'step_id' });
  };

  return Step;
};
