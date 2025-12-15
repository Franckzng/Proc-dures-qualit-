// backend/controllers/procedureController.js
const db = require('../config/db');
const {
  ROLE_ADMIN,
  ROLE_REDACTEUR,
  ROLE_VERIFICATEUR,
  ROLE_APPROBATEUR,
  STATUT_BROUILLON,
  STATUT_EN_REVISION,
  STATUT_EN_APPROBATION,
  STATUT_APPROUVEE,
  STATUT_REJETEE,
  STATUT_EN_COURS,
  STATUT_PUBLIEE
} = require('../config/constants');

/**
 * Lister les procédures en fonction du rôle
 */
async function getProcedures(req, res) {
  try {
    const userId = req.user.id;
    const roleId = req.user.role_id;
    let sql, params;

    if (roleId === ROLE_ADMIN) {
      sql = `SELECT p.* , d.nom AS departement_nom FROM procedures p LEFT JOIN departements d ON p.departement_id = d.id ORDER BY p.date_creation DESC`;
      params = [];
    } else if (roleId === ROLE_REDACTEUR) {
      sql = `SELECT p.* , d.nom AS departement_nom FROM procedures p LEFT JOIN departements d ON p.departement_id = d.id WHERE p.redacteur_id = ? ORDER BY p.date_creation DESC`;
      params = [userId];
    } else if (roleId === ROLE_VERIFICATEUR) {
      sql = `SELECT p.* , d.nom AS departement_nom FROM procedures p LEFT JOIN departements d ON p.departement_id = d.id WHERE p.statut IN (?, ?, ?) ORDER BY p.date_creation DESC`;
      params = [STATUT_EN_REVISION, STATUT_EN_APPROBATION, STATUT_APPROUVEE];
    } else if (roleId === ROLE_APPROBATEUR) {
      sql = `SELECT p.* , d.nom AS departement_nom FROM procedures p LEFT JOIN departements d ON p.departement_id = d.id WHERE p.statut IN (?, ?) ORDER BY p.date_creation DESC`;
      params = [STATUT_EN_APPROBATION, STATUT_APPROUVEE];
    } else {
      sql = `SELECT p.* , d.nom AS departement_nom FROM procedures p LEFT JOIN departements d ON p.departement_id = d.id WHERE p.statut = ? ORDER BY p.date_creation DESC`;
      params = [STATUT_APPROUVEE];
    }

    const [procedures] = await db.query(sql, params);
    res.json(procedures);
  } catch (error) {
    console.error('Erreur getProcedures:', error);
    res.status(500).json({ message: error.message });
  }
}

/**
 * Récupérer une procédure par ID (avec workflow + étapes + rédacteur)
 */
async function getProcedureById(req, res) {
  try {
    const { id } = req.params;

    const [[proc]] = await db.query(
      `SELECT p.*, d.nom AS departement_nom, u.nom AS redacteur_nom, u.prenom AS redacteur_prenom
         FROM procedures p
    LEFT JOIN departements d ON p.departement_id = d.id
    LEFT JOIN utilisateurs u ON p.redacteur_id = u.id
        WHERE p.id = ?`,
      [id]
    );
    if (!proc) {
      return res.status(404).json({ message: 'Procédure non trouvée' });
    }

    const [[wf]] = await db.query(
      `SELECT w.*, u.nom AS initiateur_nom, u.prenom AS initiateur_prenom
         FROM workflows_approbation w
    LEFT JOIN utilisateurs u ON w.initiateur_id = u.id
        WHERE w.procedure_id = ?
        ORDER BY w.id DESC
        LIMIT 1`,
      [id]
    );

    if (wf) {
      const [etapes] = await db.query(
        `SELECT
           ew.id              AS etape_id,
           ew.workflow_id,
           ew.ordre,
           ew.statut,
           ew.commentaire,
           ew.date_traitement,
           u.nom        AS user_nom,
           u.prenom     AS user_prenom,
           u.email      AS user_email,
           ew.utilisateur_id
         FROM etapes_workflow ew
         LEFT JOIN utilisateurs u ON ew.utilisateur_id = u.id
        WHERE ew.workflow_id = ?
        ORDER BY ew.ordre`,
        [wf.id]
      );

      wf.etapes = etapes.map(e => ({
        ...e,
        date_traitement: e.date_traitement ? new Date(e.date_traitement).toISOString() : null,
        commentaire: e.commentaire ?? null,
        user_nom: e.user_nom ?? null,
        user_prenom: e.user_prenom ?? null,
        user_email: e.user_email ?? null
      }));

      wf.date_initiation = wf.date_initiation ? new Date(wf.date_initiation).toISOString() : null;
      wf.date_finalisation = wf.date_finalisation ? new Date(wf.date_finalisation).toISOString() : null;
      wf.initiateur_nom = wf.initiateur_nom ?? null;
      wf.initiateur_prenom = wf.initiateur_prenom ?? null;
    }

    proc.workflow = wf || null;
    res.json(proc);
  } catch (error) {
    console.error('Erreur getProcedureById →', error);
    res.status(500).json({ message: error.message });
  }
}

/**
 * Création d’une procédure
 */
async function createProcedure(req, res) {
  try {
    const {
      titre,
      code,
      description,
      version,
      statut,
      departement_id,
      processus,
      norme
    } = req.body;
    const redacteurId = req.user.id;
    const defaultStatut = statut || STATUT_BROUILLON;

    const [result] = await db.query(
      `INSERT INTO procedures
         (titre, code, description, version, statut,
          departement_id, processus, norme, redacteur_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [titre, code || null, description, version,
       defaultStatut, departement_id, processus, norme, redacteurId]
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    console.error('Erreur createProcedure:', error);
    if (error && error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Le code de procédure existe déjà.' });
    }
    res.status(500).json({ message: error.message });
  }
}

/**
 * Mise à jour d’une procédure
 */
async function updateProcedure(req, res) {
  try {
    const { id } = req.params;
    const [procRows] = await db.query(`SELECT statut FROM procedures WHERE id = ?`, [id]);
    if (!procRows.length) {
      return res.status(404).json({ message: 'Procédure non trouvée' });
    }
    const currentStatut = procRows[0].statut;
    if (![STATUT_BROUILLON, STATUT_REJETEE].includes(currentStatut)) {
      return res.status(403).json({
        message: `Impossible de modifier une procédure en statut ${currentStatut}`
      });
    }

    const {
      titre,
      code,
      description,
      version,
      statut,
      departement_id,
      processus,
      norme
    } = req.body;

    await db.query(
      `UPDATE procedures SET
         titre         = ?,
         code          = ?,
         description   = ?,
         version       = ?,
         statut        = ?,
         departement_id= ?,
         processus     = ?,
         norme         = ?
       WHERE id = ?`,
      [titre, code || null, description, version,
       statut, departement_id, processus, norme,
       id]
    );
    res.status(204).end();
  } catch (error) {
    console.error('Erreur updateProcedure:', error);
    if (error && error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Le code de procédure existe déjà.' });
    }
    res.status(500).json({ message: error.message });
  }
}

/**
 * Suppression d’une procédure (avec cleanup attachments & workflows)
 */
async function deleteProcedure(req, res) {
  const { id } = req.params;

  try {
    const [procRows] = await db.query(`SELECT statut FROM procedures WHERE id = ?`, [id]);
    if (!procRows.length) {
      return res.status(404).json({ message: 'Procédure non trouvée' });
    }
    const currentStatut = procRows[0].statut;
    if (![STATUT_BROUILLON, STATUT_REJETEE, STATUT_APPROUVEE].includes(currentStatut)) {
      return res.status(403).json({
        message: `Impossible de supprimer une procédure en statut ${currentStatut}`
      });
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [attachRows] = await conn.query(
        `SELECT attachment_id FROM procedure_attachments WHERE procedure_id = ?`,
        [id]
      );
      const attachmentIds = attachRows.map(row => row.attachment_id);

      await conn.query(
        `DELETE ew
           FROM etapes_workflow ew
           JOIN workflows_approbation wa ON ew.workflow_id = wa.id
          WHERE wa.procedure_id = ?`,
        [id]
      );

      await conn.query(`DELETE FROM workflows_approbation WHERE procedure_id = ?`, [id]);
      await conn.query(`DELETE FROM procedure_attachments WHERE procedure_id = ?`, [id]);

      const filesToDelete = [];
      for (const attId of attachmentIds) {
        const [countRows] = await conn.query(
          `SELECT COUNT(*) as count FROM procedure_attachments WHERE attachment_id = ?`,
          [attId]
        );
        if (countRows[0].count === 0) {
          const [pathRows] = await conn.query(`SELECT path FROM attachments WHERE id = ?`, [attId]);
          if (pathRows.length) filesToDelete.push(pathRows[0].path);
          await conn.query(`DELETE FROM attachments WHERE id = ?`, [attId]);
        }
      }

      await conn.query(`DELETE FROM procedures WHERE id = ?`, [id]);

      await conn.commit();
      conn.release();

      const fs = require('fs').promises;
      for (const filePath of filesToDelete) {
        try { await fs.unlink(filePath); } catch (fileErr) { console.error(`Erreur suppression fichier ${filePath}:`, fileErr); }
      }

      return res.status(204).end();
    } catch (txErr) {
      try { await conn.rollback(); } catch (r) { /* ignore */ }
      conn.release();
      console.error('Erreur deleteProcedure (transaction) :', txErr);
      if (txErr && txErr.code && txErr.code.startsWith('ER_')) {
        return res.status(409).json({ message: 'Impossible de supprimer la procédure à cause de contraintes liées.' });
      }
      return res.status(500).json({ message: txErr.message || 'Erreur lors de la suppression' });
    }
  } catch (error) {
    console.error('Erreur deleteProcedure:', error);
    return res.status(500).json({ message: error.message });
  }
}

/**
 * Démarrer le workflow d'approbation
 */
async function startApprovalWorkflow(req, res) {
  try {
    const procedureId = req.params.id;
    const initiateur  = req.user.id;

    const [procRows] = await db.query(`SELECT id FROM procedures WHERE id = ?`, [procedureId]);
    if (!procRows.length) return res.status(404).json({ message: 'Procédure non trouvée' });

    const [wfRes] = await db.query(
      `INSERT INTO workflows_approbation
         (procedure_id, initiateur_id, statut)
       VALUES (?, ?, ?)`,
      [procedureId, initiateur, STATUT_EN_COURS]
    );
    const workflowId = wfRes.insertId;

    const verifierId   = await findUserByRole('Vérificateur');
    const approbateurId= await findUserByRole('Approbateur');
    if (verifierId) {
      await db.query(
        `INSERT INTO etapes_workflow (workflow_id, utilisateur_id, ordre, statut) VALUES (?, ?, 1, 'EN_ATTENTE')`,
        [workflowId, verifierId]
      );
    }
    if (approbateurId) {
      await db.query(
        `INSERT INTO etapes_workflow (workflow_id, utilisateur_id, ordre, statut) VALUES (?, ?, 2, 'EN_ATTENTE')`,
        [workflowId, approbateurId]
      );
    }

    await db.query(`UPDATE procedures SET statut = ? WHERE id = ?`, [STATUT_EN_REVISION, procedureId]);

    res.status(201).json({ workflowId });
  } catch (error) {
    console.error('Erreur startApprovalWorkflow:', error);
    res.status(500).json({ message: error.message });
  }
}

/**
 * Utilitaire : retrouver un utilisateur par rôle
 */
async function findUserByRole(roleName) {
  const [rows] = await db.query(
    `SELECT u.id FROM utilisateurs u JOIN roles r ON u.role_id = r.id WHERE r.nom = ? AND u.actif = 1 LIMIT 1`,
    [roleName]
  );
  return rows.length ? rows[0].id : null;
}

/* ---------------------------------------------------------------------
 *  Nouveautés : liste globale des processus + procédures par process
 * ------------------------------------------------------------------ */

/* getAllProcesses: renvoie {processus, procedures_count} */
async function getAllProcesses(req, res) {
  try {
    const sql = `
      SELECT 
        COALESCE(NULLIF(TRIM(processus), ''), 'non-classé') AS processus,
        COUNT(*) AS procedures_count
      FROM procedures
      GROUP BY COALESCE(NULLIF(TRIM(processus), ''), 'non-classé')
      ORDER BY procedures_count DESC, processus ASC
    `;
    //console.debug('[procedureController] getAllProcesses SQL ->', sql);
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (error) {
    console.error('Erreur getAllProcesses:', error);
    res.status(500).json({ message: error.message });
  }
}

/* getByProcess: renvoie les procédures pour un process donné (keyword optionnel) */
async function getByProcess(req, res) {
  try {
    let { process } = req.params; // undefined si /process
    const { keyword } = req.query;

    // Express already decodes URL params. Treat empty / non-classé uniformly
    if (!process || String(process).trim() === '') {
      process = null;
    } else {
      process = String(process).trim();
    }

    //console.debug('[procedureController] getByProcess -> process param (decoded) =', process, 'keyword=', keyword);

    let sql = `SELECT p.*, d.nom AS departement_nom FROM procedures p LEFT JOIN departements d ON p.departement_id = d.id WHERE 1=1`;
    const params = [];

    if (process === null || String(process).toLowerCase() === 'non-classé' || String(process).toLowerCase() === 'non-class') {
      sql += ` AND (p.processus IS NULL OR TRIM(p.processus) = '')`;
    } else {
      sql += ` AND p.processus = ?`;
      params.push(process);
    }

    if (keyword && String(keyword).trim() !== '') {
      sql += ` AND (p.titre LIKE ? OR p.contenu LIKE ?)`;
      const k = `%${String(keyword).trim()}%`;
      params.push(k, k);
    }

    sql += ` ORDER BY p.titre`;

    //console.debug('[procedureController] getByProcess SQL ->', sql, 'params ->', params);
    const [procedures] = await db.query(sql, params);
    res.json(procedures);
  } catch (error) {
    console.error('Erreur getByProcess:', error);
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
  getProcedures,
  getProcedureById,
  createProcedure,
  updateProcedure,
  deleteProcedure,
  startApprovalWorkflow,
  findUserByRole,
  // Nouveaux exports centrés sur processus
  getAllProcesses,
  getByProcess
};
