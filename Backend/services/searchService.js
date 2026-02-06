const db = require('../config/db');

class SearchService {
  static async advancedSearch(filters = {}) {
    let sql = `
      SELECT DISTINCT p.*, d.nom AS departement_nom,
             u.nom AS redacteur_nom, u.prenom AS redacteur_prenom
      FROM procedures p
      LEFT JOIN departements d ON p.departement_id = d.id
      LEFT JOIN utilisateurs u ON p.redacteur_id = u.id
      LEFT JOIN steps s ON s.procedure_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.keyword) {
      sql += ` AND (p.titre LIKE ? OR p.description LIKE ? OR p.code LIKE ? OR s.contenu LIKE ?)`;
      const kw = `%${filters.keyword}%`;
      params.push(kw, kw, kw, kw);
    }

    if (filters.statut && filters.statut.length > 0) {
      const placeholders = filters.statut.map(() => '?').join(',');
      sql += ` AND p.statut IN (${placeholders})`;
      params.push(...filters.statut);
    }

    if (filters.departement_id) {
      sql += ` AND p.departement_id = ?`;
      params.push(filters.departement_id);
    }

    if (filters.processus) {
      sql += ` AND p.processus = ?`;
      params.push(filters.processus);
    }

    if (filters.norme) {
      sql += ` AND p.norme = ?`;
      params.push(filters.norme);
    }

    if (filters.redacteur_id) {
      sql += ` AND p.redacteur_id = ?`;
      params.push(filters.redacteur_id);
    }

    if (filters.dateDebut) {
      sql += ` AND p.date_creation >= ?`;
      params.push(filters.dateDebut);
    }

    if (filters.dateFin) {
      sql += ` AND p.date_creation <= ?`;
      params.push(filters.dateFin);
    }

    sql += ` ORDER BY p.date_modification DESC LIMIT ?`;
    params.push(filters.limit || 100);

    const [rows] = await db.query(sql, params);
    return rows;
  }

  static async searchInAttachments(keyword) {
    const [rows] = await db.query(
      `SELECT DISTINCT p.id, p.titre, a.original_name
       FROM procedures p
       JOIN procedure_attachments pa ON p.id = pa.procedure_id
       JOIN attachments a ON pa.attachment_id = a.id
       WHERE a.original_name LIKE ?
       LIMIT 50`,
      [`%${keyword}%`]
    );
    return rows;
  }
}

module.exports = SearchService;
