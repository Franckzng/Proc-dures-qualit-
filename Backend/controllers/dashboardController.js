// backend/controllers/dashboardController.js
const db = require('../config/db');

/**
 * GET /api/dashboard/summary
 * Retourne : { total, byStatus, workflowsInProgress, pendingForUser, pendingCountGlobal, recent, updated_at }
 */
exports.getSummary = async (req, res, next) => {
  try {
    const userId = req.user?.id || null;
    const roleId = req.user?.role_id || null;

    // total procédures (selon rôle)
    let totalSql = 'SELECT COUNT(*) AS total FROM procedures';
    let totalParams = [];
    
    if (roleId === 4) { // Rédacteur
      totalSql += ' WHERE redacteur_id = ?';
      totalParams = [userId];
    } else if (roleId === 3) { // Vérificateur
      totalSql += " WHERE statut IN ('EN_REVISION', 'EN_APPROBATION', 'APPROUVEE')";
    } else if (roleId === 2) { // Approbateur
      totalSql += " WHERE statut IN ('EN_APPROBATION', 'APPROUVEE')";
    } else if (roleId === 5) { // Utilisateur simple
      totalSql += " WHERE statut = 'APPROUVEE'";
    }
    
    const [totalRows] = await db.query(totalSql, totalParams);
    const total = Number(totalRows[0]?.total || 0);

    // répartition par statut (selon rôle)
    let statusSql = 'SELECT statut, COUNT(*) AS count FROM procedures';
    let statusParams = [];
    
    if (roleId === 4) {
      statusSql += ' WHERE redacteur_id = ?';
      statusParams = [userId];
    } else if (roleId === 3) {
      statusSql += " WHERE statut IN ('EN_REVISION', 'EN_APPROBATION', 'APPROUVEE')";
    } else if (roleId === 2) {
      statusSql += " WHERE statut IN ('EN_APPROBATION', 'APPROUVEE')";
    } else if (roleId === 5) {
      statusSql += " WHERE statut = 'APPROUVEE'";
    }
    
    statusSql += ' GROUP BY statut';
    const [byStatusRows] = await db.query(statusSql, statusParams);

    // workflows en cours
    const [wfRows] = await db.query(
      `SELECT COUNT(*) AS workflowsInProgress FROM workflows_approbation WHERE statut = 'EN_COURS'`
    );
    const workflowsInProgress = Number(wfRows[0]?.workflowsInProgress || 0);

    // étapes EN_ATTENTE pour l'utilisateur connecté
    let pendingForUser = 0;
    if (userId) {
      const [pendingRows] = await db.query(
        `SELECT COUNT(*) AS pending FROM etapes_workflow WHERE statut = 'EN_ATTENTE' AND utilisateur_id = ?`,
        [userId]
      );
      pendingForUser = Number(pendingRows[0]?.pending || 0);
    }

    // count global d'étapes en attente
    const [pendingGlobalRows] = await db.query(
      `SELECT COUNT(*) AS pending FROM etapes_workflow WHERE statut = 'EN_ATTENTE'`
    );
    const pendingCountGlobal = Number(pendingGlobalRows[0]?.pending || 0);

    // procédures récentes (selon rôle)
    let recentSql = `SELECT p.id, p.titre, p.statut, p.date_creation,
            u.id AS redacteur_id, CONCAT(u.prenom, ' ', u.nom) AS redacteur_name
       FROM procedures p
       LEFT JOIN utilisateurs u ON u.id = p.redacteur_id`;
    let recentParams = [];
    
    if (roleId === 4) {
      recentSql += ' WHERE p.redacteur_id = ?';
      recentParams = [userId];
    } else if (roleId === 3) {
      recentSql += " WHERE p.statut IN ('EN_REVISION', 'EN_APPROBATION', 'APPROUVEE')";
    } else if (roleId === 2) {
      recentSql += " WHERE p.statut IN ('EN_APPROBATION', 'APPROUVEE')";
    } else if (roleId === 5) {
      recentSql += " WHERE p.statut = 'APPROUVEE'";
    }
    
    recentSql += ' ORDER BY p.date_creation DESC LIMIT 8';
    const [recentProcedures] = await db.query(recentSql, recentParams);

    const updated_at = new Date().toISOString();

    return res.json({
      total,
      byStatus: byStatusRows,
      workflowsInProgress,
      pendingForUser,
      pendingCountGlobal,
      recent: recentProcedures,
      updated_at
    });
  } catch (err) {
    console.error('Erreur dashboard.getSummary:', err);
    next(err);
  }
};

/**
 * GET /api/dashboard/recent?limit=10
 * Retourne les activités récentes (procédures crées, workflows lancés, étapes traitées)
 */
exports.getRecentActivities = async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 100);

    const sql = `
      SELECT t.* FROM (
        SELECT 
          'procedure_created' AS type,
          p.id              AS entity_id,
          p.titre           AS title,
          p.redacteur_id    AS user_id,
          CONCAT(u.prenom,' ',u.nom) AS user_name,
          p.date_creation   AS occurred_at,
          NULL              AS action,
          NULL              AS commentaire
        FROM procedures p
        LEFT JOIN utilisateurs u ON u.id = p.redacteur_id

        UNION ALL

        SELECT
          'workflow_started' AS type,
          w.id               AS entity_id,
          CONCAT('workflow#', w.id, ' (proc:', w.procedure_id, ')') AS title,
          w.initiateur_id    AS user_id,
          CONCAT(ui.prenom,' ',ui.nom) AS user_name,
          w.date_initiation  AS occurred_at,
          w.statut           AS action,
          w.commentaire      AS commentaire
        FROM workflows_approbation w
        LEFT JOIN utilisateurs ui ON ui.id = w.initiateur_id

        UNION ALL

        SELECT
          CASE 
            WHEN ew.statut = 'VALIDE' THEN 'step_validated'
            WHEN ew.statut = 'REJETE' THEN 'step_rejected'
            ELSE 'step_updated'
          END AS type,
          ew.id              AS entity_id,
          CONCAT('step#', ew.id, ' (wf:', ew.workflow_id, ')') AS title,
          ew.utilisateur_id  AS user_id,
          CONCAT(u2.prenom,' ',u2.nom) AS user_name,
          ew.date_traitement  AS occurred_at,
          ew.statut          AS action,
          ew.commentaire     AS commentaire
        FROM etapes_workflow ew
        LEFT JOIN utilisateurs u2 ON u2.id = ew.utilisateur_id
        WHERE ew.date_traitement IS NOT NULL
      ) AS t
      WHERE t.occurred_at IS NOT NULL
      ORDER BY t.occurred_at DESC
      LIMIT ?;
    `;

    const [rows] = await db.query(sql, [limit]);
    return res.json(rows);
  } catch (err) {
    console.error('Erreur dashboard.getRecentActivities:', err);
    next(err);
  }
};

/**
 * GET /api/dashboard/by-department
 */
exports.getByDepartment = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT d.id, d.nom AS department_name, COUNT(p.id) AS procedures_count
         FROM departements d
         LEFT JOIN procedures p ON p.departement_id = d.id
        GROUP BY d.id, d.nom
        ORDER BY procedures_count DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('Erreur dashboard.getByDepartment:', err);
    next(err);
  }
};

/**
 * GET /api/dashboard/pending-tasks
 * Retourne les étapes en attente.
 * Si l'utilisateur est admin -> toutes les étapes en attente,
 * sinon -> celles assignées à l'utilisateur.
 */
exports.getPendingTasks = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    // Détection "admin" simple : adapte selon la structure de ton utilisateur (role, role_id...)
    const isAdmin = (user.role && (user.role === 'Admin' || user.role === 'Administrateur')) || user.isAdmin;

    let sql;
    let params = [];

    if (isAdmin) {
      sql = `
        SELECT ew.*, p.titre AS procedure_title, u.nom AS assigned_nom, u.prenom AS assigned_prenom
        FROM etapes_workflow ew
        JOIN workflows_approbation w ON w.id = ew.workflow_id
        JOIN procedures p ON p.id = w.procedure_id
        LEFT JOIN utilisateurs u ON u.id = ew.utilisateur_id
        WHERE ew.statut = 'EN_ATTENTE'
        ORDER BY ew.date_creation DESC
      `;
    } else {
      sql = `
        SELECT ew.*, p.titre AS procedure_title, u.nom AS assigned_nom, u.prenom AS assigned_prenom
        FROM etapes_workflow ew
        JOIN workflows_approbation w ON w.id = ew.workflow_id
        JOIN procedures p ON p.id = w.procedure_id
        LEFT JOIN utilisateurs u ON u.id = ew.utilisateur_id
        WHERE ew.statut = 'EN_ATTENTE' AND (ew.utilisateur_id = ?)
        ORDER BY ew.date_creation DESC
      `;
      params = [user.id];
    }

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Erreur dashboard.getPendingTasks:', err);
    next(err);
  }
};
