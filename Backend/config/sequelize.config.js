// backend/config/sequelize.config.js
require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'procedures_qualite',
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT, 10) || 3306,
    dialect:  'mysql',
    logging:  false,
    define: {
      freezeTableName: true,
      underscored:     true
    },
    pool: {
      max:     10,
      min:     0,
      acquire: 30000,
      idle:    10000
    }
  },
  // vous pouvez dupliquer la même config en `test` et `production` si besoin
};
