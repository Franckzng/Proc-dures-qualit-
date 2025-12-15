// backend/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middlewares/authMiddleware');

// Certains middlewares exportent verifyToken, d'autres exportent directement la fonction.
// On supporte les deux cas.
const verifyToken = authMiddleware.verifyToken || authMiddleware;

// Tous les endpoints sont protégés
router.get('/summary', verifyToken, dashboardController.getSummary);
router.get('/recent', verifyToken, dashboardController.getRecentActivities);
router.get('/by-department', verifyToken, dashboardController.getByDepartment);
router.get('/pending-tasks', verifyToken, dashboardController.getPendingTasks);

module.exports = router;
