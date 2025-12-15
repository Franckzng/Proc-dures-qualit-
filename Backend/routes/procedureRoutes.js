// backend/routes/procedureRoute.js
const express        = require('express');
const router         = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const {
  getProcedures,
  getProcedureById,
  createProcedure,
  updateProcedure,
  deleteProcedure,
  startApprovalWorkflow,
  getAllProcesses,
  getByProcess
} = require('../controllers/procedureController');
const {
  getSteps,
  createStep,
  updateStep,
  deleteStep
} = require('../controllers/stepController');
const { ROLE_ADMIN, ROLE_REDACTEUR } = require('../config/constants');

// Seuls les admins et rédacteurs peuvent créer/éditer/supprimer
function redacteurOrAdmin(req, res, next) {
  const role = req.user.role_id;
  if (role === ROLE_ADMIN || role === ROLE_REDACTEUR) {
    return next();
  }
  return res.status(403).json({ message: 'Accès interdit' });
}

/* ---------------------------
   Routes centrées PROCESSUS
   --------------------------- */

// GET /api/procedures/processes  -> liste des processus (+ counts)
router.get('/processes', authMiddleware, getAllProcesses);

// GET /api/procedures/process   -> procédures non-classées
router.get('/process', authMiddleware, getByProcess);

// GET /api/procedures/process/:process  -> procédures pour process donné
router.get('/process/:process', authMiddleware, getByProcess);

/* ---------------------------
   CRUD procedures & steps
   --------------------------- */

// Liste générale (selon rôle)
router.get('/', authMiddleware, getProcedures);

// Détail d'une procédure
router.get('/:id', authMiddleware, getProcedureById);

// Create
router.post('/', authMiddleware, redacteurOrAdmin, createProcedure);

// Update
router.put('/:id', authMiddleware, redacteurOrAdmin, updateProcedure);

// Steps endpoints (procédure-scoped)
router.get('/:id/steps', authMiddleware, getSteps);
router.post('/:id/steps', authMiddleware, createStep);

// Steps global update/delete by id
router.put('/steps/:id', authMiddleware, updateStep);
router.delete('/steps/:id', authMiddleware, deleteStep);

// Delete procedure
router.delete('/:id', authMiddleware, redacteurOrAdmin, deleteProcedure);

// Start workflow
router.post('/:id/workflow/start', authMiddleware, startApprovalWorkflow);

module.exports = router;
