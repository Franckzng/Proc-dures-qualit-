// backend/routes/workflowRoutes.js
const express            = require('express');
const router             = express.Router();
const workflowController = require('../controllers/workflowController');
const authMiddleware     = require('../middlewares/authMiddleware');

router.use(authMiddleware);

// 1) Lister tous les workflows
router.get('/', workflowController.getWorkflows);

// 2) Étapes en attente pour l’utilisateur connecté
router.get('/etapes/attente', workflowController.getEtapesEnAttentePourUtilisateur);

// 3) Détail complet d’un workflow
router.get('/:id', workflowController.getWorkflowById);

// 4) Traiter (valider/rejeter) une étape
router.patch('/:workflowId/etapes/:etapeId', workflowController.processStep);

// 5) **Nouvelle** → récupérer la seule étape EN_ATTENTE d’une procédure
router.get('/etapes/procedure/:procedureId', workflowController.getStepByProcedure);

router.get('/procedure/:procedureId', authMiddleware, workflowController.getWorkflowByProcedure);

module.exports = router;
