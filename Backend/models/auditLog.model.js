module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define('AuditLog', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: DataTypes.INTEGER,
    action: { type: DataTypes.STRING(50), allowNull: false },
    entity_type: { type: DataTypes.STRING(50), allowNull: false },
    entity_id: DataTypes.INTEGER,
    details: DataTypes.JSON,
    ip_address: DataTypes.STRING(45),
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'audit_logs',
    timestamps: false
  });

  return AuditLog;
};
