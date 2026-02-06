const db = require('../config/db');

class ReportService {
  static async getApprovalRate(startDate, endDate) {
    const [stats] = await db.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN statut = 'APPROUVEE' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN statut = 'REJETEE' THEN 1 ELSE 0 END) as rejected
       FROM procedures
       WHERE date_creation BETWEEN ? AND ?`,
      [startDate, endDate]
    );
    return stats[0];
  }

  static async getApprovalTimeStats() {
    const [stats] = await db.query(
      `SELECT 
        AVG(TIMESTAMPDIFF(DAY, wa.date_initiation, wa.date_finalisation)) as avg_days,
        MIN(TIMESTAMPDIFF(DAY, wa.date_initiation, wa.date_finalisation)) as min_days,
        MAX(TIMESTAMPDIFF(DAY, wa.date_initiation, wa.date_finalisation)) as max_days
       FROM workflows_approbation wa
       WHERE wa.statut IN ('APPROUVE', 'REJETE') AND wa.date_finalisation IS NOT NULL`
    );
    return stats[0];
  }

  static async getRejectionByUser() {
    const [stats] = await db.query(
      `SELECT 
        u.id, u.nom, u.prenom, r.nom as role_nom,
        COUNT(*) as total_reviews,
        SUM(CASE WHEN ew.statut = 'REJETE' THEN 1 ELSE 0 END) as rejections
       FROM etapes_workflow ew
       JOIN utilisateurs u ON ew.utilisateur_id = u.id
       JOIN roles r ON u.role_id = r.id
       WHERE ew.statut IN ('VALIDE', 'REJETE')
       GROUP BY u.id, u.nom, u.prenom, r.nom
       ORDER BY rejections DESC`
    );
    return stats;
  }

  static async getProceduresByDepartment() {
    const [stats] = await db.query(
      `SELECT 
        d.id, d.nom as department_name,
        COUNT(p.id) as total,
        SUM(CASE WHEN p.statut = 'APPROUVEE' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN p.statut = 'BROUILLON' THEN 1 ELSE 0 END) as draft
       FROM departements d
       LEFT JOIN procedures p ON d.id = p.departement_id
       GROUP BY d.id, d.nom
       ORDER BY total DESC`
    );
    return stats;
  }

  static async getProceduresByNorme() {
    const [stats] = await db.query(
      `SELECT 
        COALESCE(norme, 'Non spécifié') as norme,
        COUNT(*) as count,
        SUM(CASE WHEN statut = 'APPROUVEE' THEN 1 ELSE 0 END) as approved
       FROM procedures
       GROUP BY norme
       ORDER BY count DESC`
    );
    return stats;
  }

  static async getObsoleteProcedures(monthsThreshold = 12) {
    const [procedures] = await db.query(
      `SELECT p.*, d.nom as departement_nom,
        TIMESTAMPDIFF(MONTH, p.date_modification, NOW()) as months_since_update
       FROM procedures p
       LEFT JOIN departements d ON p.departement_id = d.id
       WHERE p.statut = 'APPROUVEE'
         AND TIMESTAMPDIFF(MONTH, p.date_modification, NOW()) > ?
       ORDER BY months_since_update DESC`,
      [monthsThreshold]
    );
    return procedures;
  }

  static async getWorkflowPerformance() {
    const [stats] = await db.query(
      `SELECT 
        DATE_FORMAT(wa.date_initiation, '%Y-%m') as month,
        COUNT(*) as total_workflows,
        AVG(TIMESTAMPDIFF(DAY, wa.date_initiation, wa.date_finalisation)) as avg_duration,
        SUM(CASE WHEN wa.statut = 'APPROUVE' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN wa.statut = 'REJETE' THEN 1 ELSE 0 END) as rejected
       FROM workflows_approbation wa
       WHERE wa.date_finalisation IS NOT NULL
       GROUP BY month
       ORDER BY month DESC
       LIMIT 12`
    );
    return stats;
  }
}

module.exports = ReportService;
