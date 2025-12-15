// backend/routes/normeRoutes.js
const express = require('express');
const router = express.Router();
const normeController = require('../controllers/normeController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware, normeController.listByUser);
router.post('/', authMiddleware, normeController.create);

module.exports = router;
