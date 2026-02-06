module.exports = (sequelize, DataTypes) => {
  const ProcedureVersion = sequelize.define('ProcedureVersion', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    procedure_id: { type: DataTypes.INTEGER, allowNull: false },
    version: { type: DataTypes.STRING(20), allowNull: false },
    titre: { type: DataTypes.STRING(200), allowNull: false },
    description: DataTypes.TEXT,
    content_snapshot: DataTypes.JSON,
    statut: { type: DataTypes.STRING(50), allowNull: false },
    created_by: DataTypes.INTEGER,
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'procedure_versions',
    timestamps: false
  });

  ProcedureVersion.associate = (models) => {
    ProcedureVersion.belongsTo(models.Procedure, { foreignKey: 'procedure_id' });
  };

  return ProcedureVersion;
};
