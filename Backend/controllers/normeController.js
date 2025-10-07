// backend/controllers/normeController.js
const db = require('../config/db');

/**
 * Lister les normes pour l'utilisateur connecté
 */
exports.listByUser = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.query(
      `SELECT id, titre, description, date_creation
         FROM normes
        WHERE utilisateur_id = ?
        ORDER BY date_creation DESC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

/**
 * Créer une norme (rédacteur uniquement)
 */
exports.create = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { titre, description } = req.body;
    if (!titre) return res.status(400).json({ message: 'Titre requis' });

    const [result] = await db.query(
      `INSERT INTO normes (titre, description, utilisateur_id)
       VALUES (?, ?, ?)`,
      [titre, description || null, userId]
    );
    const insertedId = result.insertId;
    const [[norme]] = await db.query('SELECT id, titre, description, date_creation FROM normes WHERE id = ?', [insertedId]);
    res.status(201).json(norme);
  } catch (err) {
    next(err);
  }
};
