const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const searchController = require('../controllers/searchController');

router.get('/advanced', authMiddleware, searchController.advancedSearch);
router.get('/attachments', authMiddleware, searchController.searchAttachments);

module.exports = router;
