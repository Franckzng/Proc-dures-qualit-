// routes/attachmentRoutes.js
const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');

const router = express.Router();

// JWT auth middleware (support default export or named verifyToken)
const authMiddleware = require('../middlewares/authMiddleware');
const verifyToken = authMiddleware.verifyToken || authMiddleware;

// Controller exports
const { upload: uploadController, listByProcedure } = require('../controllers/attachmentController');

// Multer storage (preserve original extension)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = crypto.randomBytes(16).toString('hex');
    cb(null, `${name}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB
});

// Protect all attachment routes with JWT
router.use(verifyToken);

/**
 * POST /api/attachments
 * Body form-data: file, optional procedureId
 */
router.post('/', upload.single('file'), uploadController);

/**
 * GET /api/attachments/procedure/:procedureId
 * List attachments for a given procedure
 */
router.get('/procedure/:procedureId', listByProcedure);

module.exports = router;
