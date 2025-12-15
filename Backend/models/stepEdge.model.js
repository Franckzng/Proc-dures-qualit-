// backend/models/stepEdge.model.js
module.exports = (sequelize, DataTypes) => {
  const StepEdge = sequelize.define('StepEdge', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    procedure_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    from_step_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    to_step_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    condition_text: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    ordre: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'step_edges',
    timestamps: false
  });

  StepEdge.associate = (models) => {
    StepEdge.belongsTo(models.Procedure, { foreignKey: 'procedure_id' });
    StepEdge.belongsTo(models.Step, { as: 'FromStep', foreignKey: 'from_step_id' });
    StepEdge.belongsTo(models.Step, { as: 'ToStep', foreignKey: 'to_step_id' });
  };

  return StepEdge;
};
