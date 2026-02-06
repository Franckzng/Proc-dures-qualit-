// backend/controllers/workflowController.js

const db = require('../config/db');
const NotificationService = require('../services/notificationService');
const AuditService = require('../services/auditService');
const {
  STATUT_EN_REVISION,
  STATUT_EN_COURS,
  STATUT_EN_APPROBATION,
  STATUT_APPROUVE,    // pour workflows_approbation
  STATUT_APPROUVEE,   // pour procedures
  STATUT_REJETE,
  STATUT_REJETEE
} = require('../config/constants');
/**
 * Récupère la seule étape EN_ATTENTE pour une procédure donnée
 */
exports.getStepByProcedure = async (req, res, next) => {
  try {
    const procedureId = req.params.procedureId;

    // 1) On cherche le workflow actif (EN_COURS) lié à cette procédure
    const [wfRows] = await db.query(
      `SELECT id 
         FROM workflows_approbation 
        WHERE procedure_id = ? AND statut = ? 
        ORDER BY id DESC 
        LIMIT 1`,
      [procedureId, STATUT_EN_COURS]
    );
    if (!wfRows.length) {
      return res.status(404).json({ message: 'Aucun workflow en cours pour cette procédure' });
    }
    const workflowId = wfRows[0].id;

    // 2) On cherche la première étape EN_ATTENTE
    const [stepRows] = await db.query(
      `SELECT 
         ew.id           AS etape_id,
         ew.workflow_id,
         ew.ordre,
         ew.statut,
         u.id            AS utilisateur_id,
         u.nom,
         u.prenom
       FROM etapes_workflow ew
       JOIN utilisateurs u ON u.id = ew.utilisateur_id
      WHERE ew.workflow_id = ? AND ew.statut = 'EN_ATTENTE'
      ORDER BY ew.ordre
      LIMIT 1`,
      [workflowId]
    );
    if (!stepRows.length) {
      return res.status(404).json({ message: 'Aucune étape en attente' });
    }

    return res.json(stepRows[0]);
  } catch (err) {
    next(err);
  }
};

/**
 * (1) Listes des workflows (filtre facultatif)
 */
exports.getWorkflows = async (req, res, next) => {
  try {
    const { utilisateur, statut } = req.query;
    let sql    = 'SELECT * FROM workflows_approbation';
    const where = [];
    const params = [];
    if (utilisateur) { where.push('initiateur_id = ?'); params.push(utilisateur); }
    if (statut)      { where.push('statut = ?');        params.push(statut);     }
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

/**
 * (2) Étapes en attente pour l’utilisateur connecté
 */
exports.getEtapesEnAttentePourUtilisateur = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.query(
      `SELECT 
         ew.id            AS etape_id,
         ew.workflow_id,
         ew.ordre,
         p.id             AS procedure_id,
         p.titre          AS procedure_titre
       FROM etapes_workflow ew
       JOIN workflows_approbation w ON w.id = ew.workflow_id
       JOIN procedures p            ON p.id = w.procedure_id
      WHERE ew.statut = 'EN_ATTENTE'
        AND ew.utilisateur_id = ?
        AND ew.ordre = (
          SELECT MIN(ordre)
            FROM etapes_workflow
           WHERE workflow_id = ew.workflow_id
             AND statut      = 'EN_ATTENTE'
        )
      ORDER BY p.titre`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

/**
 * (3) Détail d’un workflow complet
 */
exports.getWorkflowById = async (req, res, next) => {
  try {
    const workflowId = req.params.id;
    const [[wf]] = await db.query(
      'SELECT * FROM workflows_approbation WHERE id = ?',
      [workflowId]
    );
    if (!wf) return res.status(404).json({ message: 'Workflow non trouvé' });

    const [etapes] = await db.query(
      `SELECT
         ew.id              AS etape_id,
         ew.workflow_id,
         ew.role_id,
         ew.utilisateur_id,
         ew.ordre,
         ew.statut,
         ew.commentaire,
         ew.date_traitement,
         ew.deadline,
         r.nom              AS role_nom,
         u.nom              AS user_nom,
         u.prenom           AS user_prenom
       FROM etapes_workflow ew
       LEFT JOIN roles        r ON r.id = ew.role_id
       LEFT JOIN utilisateurs u ON u.id = ew.utilisateur_id
      WHERE ew.workflow_id = ?
      ORDER BY ew.ordre`,
      [workflowId]
    );
    wf.etapes = etapes;

    const [[proc]] = await db.query(
      'SELECT id, titre, description FROM procedures WHERE id = ?',
      [wf.procedure_id]
    );
    wf.procedure = proc;

    res.json(wf);
  } catch (err) {
    next(err);
  }
};

/**
 * (4) Traiter (valider/rejeter) une étape
 */
exports.processStep = async (req, res, next) => {
  try {
    const { workflowId, etapeId } = req.params;
    const { action, commentaire } = req.body;
    const userId = req.user.id;

    // (a) Vérifier l'existence de l'étape
    const [[etape]] = await db.query(
      'SELECT * FROM etapes_workflow WHERE id = ? AND workflow_id = ?',
      [etapeId, workflowId]
    );
    if (!etape) return res.status(404).json({ message: 'Étape introuvable' });

    // (b) Mettre à jour l'étape
    await db.query(
      `UPDATE etapes_workflow
         SET statut          = ?,
             commentaire     = ?,
             date_traitement = NOW(),
             utilisateur_id  = ?
       WHERE id = ?`,
      [action, commentaire, userId, etapeId]
    );

    // (c) Récupérer l'ID de la procédure liée
    const [[wfRow]] = await db.query(
      'SELECT procedure_id FROM workflows_approbation WHERE id = ?',
      [workflowId]
    );
    const procedureId = wfRow.procedure_id;
    
    const [[proc]] = await db.query('SELECT titre FROM procedures WHERE id = ?', [procedureId]);
    const procedureTitle = proc?.titre || 'Procédure';

    if (action === 'VALIDE') {
      // Combien d'étapes restent EN_ATTENTE ?
      const [[{ count }]] = await db.query(
        `SELECT COUNT(*) AS count
           FROM etapes_workflow
          WHERE workflow_id = ? AND statut = 'EN_ATTENTE'`,
        [workflowId]
      );

      if (count === 0) {
        // **1) Clôturer le workflow** avec STATUT_APPROUVE
        await db.query(
          `UPDATE workflows_approbation
             SET statut = ?, date_finalisation = NOW()
           WHERE id = ?`,
          [STATUT_APPROUVE, workflowId]
        );
        // **2) Marquer la procédure comme approuvée** avec STATUT_APPROUVEE
        await db.query(
          `UPDATE procedures
             SET statut = ?
           WHERE id = ?`,
          [STATUT_APPROUVEE, procedureId]
        );
        
        const [[initiator]] = await db.query(
          'SELECT initiateur_id FROM workflows_approbation WHERE id = ?',
          [workflowId]
        );
        await NotificationService.notifyWorkflowStep(initiator.initiateur_id, procedureTitle, 'approved');
        await AuditService.log(userId, 'APPROVE', 'procedure', procedureId, { workflowId });

      } else if (etape.ordre === 1) {
        // Le vérificateur vient de valider → passer la procédure en EN_APPROBATION
        await db.query(
          `UPDATE procedures
             SET statut = ?
           WHERE id = ?`,
          [STATUT_EN_APPROBATION, procedureId]
        );
        
        const [[nextStep]] = await db.query(
          'SELECT utilisateur_id FROM etapes_workflow WHERE workflow_id = ? AND ordre = 2',
          [workflowId]
        );
        if (nextStep?.utilisateur_id) {
          await NotificationService.notifyWorkflowStep(nextStep.utilisateur_id, procedureTitle, 'assigned');
        }
      }

    } else {
      // Rejet → clôturer le workflow et la procédure en REJETE
      await db.query(
        `UPDATE workflows_approbation
           SET statut = ?, date_finalisation = NOW()
         WHERE id = ?`,
        [STATUT_REJETE, workflowId]
      );
      await db.query(
        `UPDATE procedures
           SET statut = ?
         WHERE id = ?`,
        [STATUT_REJETEE, procedureId]
      );
      
      const [[initiator]] = await db.query(
        'SELECT initiateur_id FROM workflows_approbation WHERE id = ?',
        [workflowId]
      );
      await NotificationService.notifyWorkflowStep(initiator.initiateur_id, procedureTitle, 'rejected');
      await AuditService.log(userId, 'REJECT', 'procedure', procedureId, { workflowId, commentaire });
    }


    

    res.json({ message: 'Étape traitée avec succès' });

  } catch (err) {
    next(err);
  }
};


/**
 * (5) Renvoyer le workflow complet pour une procédure donnée
 */
exports.getWorkflowByProcedure = async (req, res, next) => {
  try {
    const procedureId = req.params.procedureId;

    // 1) Trouver le workflow actif (EN_COURS ou terminé) le plus récent
    const [wfRows] = await db.query(
      `SELECT * 
         FROM workflows_approbation
        WHERE procedure_id = ?
        ORDER BY id DESC
        LIMIT 1`,
      [procedureId]
    );
    if (!wfRows.length) {
      return res.status(404).json({ message: 'Aucun workflow trouvé pour cette procédure' });
    }
    const workflow = wfRows[0];

    // 2) Charger toutes les étapes
    const [etapes] = await db.query(
      `SELECT
         ew.id              AS etape_id,
         ew.workflow_id,
         ew.ordre,
         ew.statut,
         ew.commentaire,
         ew.date_traitement,
         r.nom              AS role_nom,
         u.nom              AS user_nom,
         u.prenom           AS user_prenom
       FROM etapes_workflow ew
       LEFT JOIN roles        r ON ew.role_id        = r.id
       LEFT JOIN utilisateurs u ON ew.utilisateur_id = u.id
      WHERE ew.workflow_id = ?
      ORDER BY ew.ordre`,
      [workflow.id]
    );
    workflow.etapes = etapes;

    res.json(workflow);
  } catch (err) {
    next(err);
  }
};