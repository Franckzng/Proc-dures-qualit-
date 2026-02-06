const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const reportController = require('../controllers/reportController');

router.get('/approval-rate', authMiddleware, reportController.getApprovalRate);
router.get('/approval-time', authMiddleware, reportController.getApprovalTimeStats);
router.get('/rejection-by-user', authMiddleware, reportController.getRejectionByUser);
router.get('/by-department', authMiddleware, reportController.getProceduresByDepartment);
router.get('/by-norme', authMiddleware, reportController.getProceduresByNorme);
router.get('/obsolete', authMiddleware, reportController.getObsoleteProcedures);
router.get('/workflow-performance', authMiddleware, reportController.getWorkflowPerformance);

module.exports = router;
