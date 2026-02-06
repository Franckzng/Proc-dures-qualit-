const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const auditController = require('../controllers/auditController');

router.get('/logs', authMiddleware, auditController.getLogs);
router.get('/report', authMiddleware, auditController.getReport);

module.exports = router;
