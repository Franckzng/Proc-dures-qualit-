// backend/controllers/departmentController.js
const db = require('../config/db');

exports.getDepartments = async (req, res) => {
  try {
    console.log('[GET] /api/departments - getDepartments called by user:', req.user?.id ?? 'anon');

    // Retourner tous les départements (la table ne contient pas de champ "actif" dans ton schéma)
    const [departments] = await db.query(`
      SELECT id, nom, responsable
      FROM departements
      ORDER BY nom ASC
    `);

    console.log(`[GET] /api/departments - returned ${departments.length} rows`);
    res.json(departments);
  } catch (err) {
    console.error('Erreur getDepartments:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
