// backend/models/index.js
const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(path.resolve(__dirname, '../config/sequelize.config.js'))[env];

// Initialise Sequelize
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

const db = {};

// Charger toutes les factories (models/*.js)
fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js'
    );
  })
  .forEach(file => {
    const modelFactory = require(path.join(__dirname, file));
    if (typeof modelFactory === 'function') {
      const model = modelFactory(sequelize, DataTypes);
      db[model.name] = model;
    }
  });

// Appeler associate() si disponible (permet aux modèles de définir leurs relations)
Object.keys(db).forEach(modelName => {
  if (db[modelName] && typeof db[modelName].associate === 'function') {
    db[modelName].associate(db);
  }
});

// Fallback / sécurité : si les associations many-to-many n'ont pas été définies dans les fichiers,
// on les ajoute ici de manière idempotente (safe).
if (db.Procedure && db.Attachment) {
  // Si association déjà définie, Sequelize ignore la duplication.
  db.Procedure.belongsToMany(db.Attachment, {
    through: 'procedure_attachments',
    foreignKey: 'procedure_id',
    otherKey: 'attachment_id',
    timestamps: false
  });
  db.Attachment.belongsToMany(db.Procedure, {
    through: 'procedure_attachments',
    foreignKey: 'attachment_id',
    otherKey: 'procedure_id',
    timestamps: false
  });
}

// Export utile
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
