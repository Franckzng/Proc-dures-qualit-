// backend/controllers/stepController.js
const db = require('../models');
const { Step, StepVersion, Procedure } = db;

/**
 * Récupère les étapes d'une procédure
 */
async function getSteps(req, res) {
  try {
    const { id: procedureId } = req.params;
    const steps = await Step.findAll({
      where: { procedure_id: procedureId },
      order: [['ordre', 'ASC']]
    });
    res.json(steps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Création d'une étape
 * - sanitize parent_id (0 / '0' / '' => null)
 * - vérifie que la procédure existe
 * - si parent_id fourni, vérifie que la step parent existe et appartient à la même procédure
 */
async function createStep(req, res) {
  try {
    const { id: procedureId } = req.params; // route: POST /procedures/:id/steps
    // 1) vérifier que la procédure existe
    const proc = await Procedure.findByPk(procedureId);
    if (!proc) {
      return res.status(404).json({ message: 'Procédure introuvable' });
    }

    // 2) Construire stepData en nettoyant parent_id et autres champs
    const payload = { ...req.body };

    // Normalize parent_id: consider 0, '0', '' as null
    if (payload.parent_id === '' || payload.parent_id === 0 || payload.parent_id === '0' || payload.parent_id === undefined) {
      payload.parent_id = null;
    } else {
      // if client sends string number, cast to integer
      if (typeof payload.parent_id === 'string' && payload.parent_id.trim() !== '') {
        payload.parent_id = parseInt(payload.parent_id, 10);
        if (Number.isNaN(payload.parent_id)) payload.parent_id = null;
      }
    }

    // 3) Si parent_id présent non null -> vérifier qu'il existe et appartient à la même procédure
    if (payload.parent_id !== null) {
      const parentStep = await Step.findByPk(payload.parent_id);
      if (!parentStep) {
        return res.status(400).json({ message: `Parent introuvable (id=${payload.parent_id})` });
      }
      if (parentStep.procedure_id !== Number(procedureId)) {
        return res.status(400).json({ message: `Parent (id=${payload.parent_id}) n'appartient pas à la procédure ${procedureId}` });
      }
    }

    // 4) garantir procedure_id et created_by
    const stepData = {
      procedure_id: Number(procedureId),
      parent_id: payload.parent_id,
      ordre: payload.ordre ?? 0,
      titre: payload.titre ?? null,
      contenu: payload.contenu ?? null,
      type: payload.type ?? 'ETAPE',
      metadata: payload.metadata ?? null,
      created_by: req.user?.id ?? null
    };

    // 5) créer l'étape
    const step = await Step.create(stepData);

    // 6) créer une version initiale
    try {
      await StepVersion.create({
        step_id: step.id,
        procedure_id: step.procedure_id,
        numero_version: '1.0',
        contenu: step.contenu,
        titre: step.titre,
        metadata: step.metadata,
        utilisateur_id: req.user?.id ?? null,
        action: 'CREATE'
      });
    } catch (verErr) {
      // log mais ne pas bloquer la création de l'étape si archive échoue
      console.error('Warning: impossible de créer StepVersion initiale', verErr);
    }

    res.status(201).json(step);
  } catch (error) {
    console.error('createStep error:', error);
    // Si c'est une erreur de contrainte FK, renvoyer info lisible
    if (error && error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ message: 'Référence parent invalide pour l\'étape' });
    }
    res.status(500).json({ message: error.message || 'Erreur serveur' });
  }
}

/**
 * Mise à jour d'une étape
 */
async function updateStep(req, res) {
  try {
    const { id } = req.params;
    const step = await Step.findByPk(id);
    if (!step) return res.status(404).json({ message: 'Étape non trouvée' });

    const payload = { ...req.body };

    // Normalize parent_id same as create
    if (payload.parent_id === '' || payload.parent_id === 0 || payload.parent_id === '0' || payload.parent_id === undefined) {
      payload.parent_id = null;
    } else {
      if (typeof payload.parent_id === 'string' && payload.parent_id.trim() !== '') {
        payload.parent_id = parseInt(payload.parent_id, 10);
        if (Number.isNaN(payload.parent_id)) payload.parent_id = null;
      }
    }

    if (payload.parent_id !== null) {
      const parentStep = await Step.findByPk(payload.parent_id);
      if (!parentStep) {
        return res.status(400).json({ message: `Parent introuvable (id=${payload.parent_id})` });
      }
      if (parentStep.procedure_id !== step.procedure_id) {
        return res.status(400).json({ message: `Parent n'appartient pas à la même procédure` });
      }
    }

    // Computation changedFields (basic)
    const changedFields = {};
    Object.keys(payload).forEach(k => {
      if (payload[k] !== undefined && payload[k] !== step[k]) {
        changedFields[k] = { old: step[k], new: payload[k] };
      }
    });

    await step.update({ ...payload, updated_by: req.user?.id ?? step.updated_by });

    // create version
    await StepVersion.create({
      step_id: step.id,
      procedure_id: step.procedure_id,
      numero_version: (await getNextVersion(step.procedure_id)),
      contenu: step.contenu,
      titre: step.titre,
      metadata: step.metadata,
      utilisateur_id: req.user?.id ?? null,
      action: 'UPDATE',
      changed_fields: changedFields
    });

    res.json(step);
  } catch (error) {
    console.error('updateStep error:', error);
    res.status(500).json({ message: error.message });
  }
}

/**
 * Suppression d'une étape
 */
async function deleteStep(req, res) {
  try {
    const { id } = req.params;
    const step = await Step.findByPk(id);
    if (!step) return res.status(404).json({ message: 'Étape non trouvée' });

    // Archiver
    await StepVersion.create({
      step_id: step.id,
      procedure_id: step.procedure_id,
      numero_version: await getNextVersion(step.procedure_id),
      contenu: step.contenu,
      titre: step.titre,
      metadata: step.metadata,
      utilisateur_id: req.user?.id ?? null,
      action: 'DELETE'
    });

    await step.destroy();
    res.status(204).end();
  } catch (error) {
    console.error('deleteStep error:', error);
    res.status(500).json({ message: error.message });
  }
}

/**
 * Utility: next version (simple)
 */
async function getNextVersion(procedureId) {
  const [last] = await StepVersion.findAll({
    where: { procedure_id: procedureId },
    order: [['id', 'DESC']],
    limit: 1
  });
  const prev = last ? parseFloat(last.numero_version) : 1.0;
  const next = (prev + 0.1);
  return next.toFixed(1);
}

module.exports = { getSteps, createStep, updateStep, deleteStep, getNextVersion };
