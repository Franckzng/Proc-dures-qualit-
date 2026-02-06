const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const versionController = require('../controllers/versionController');

router.get('/procedure/:procedureId', authMiddleware, versionController.getVersions);
router.get('/:versionId', authMiddleware, versionController.getVersion);
router.post('/procedure/:procedureId', authMiddleware, versionController.createVersion);
router.post('/:versionId/restore', authMiddleware, versionController.restoreVersion);

module.exports = router;
