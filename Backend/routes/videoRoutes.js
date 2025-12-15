// backend/routes/videoRoutes.js
const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../config/multerConfig');

// Upload vidéo
router.post(
  '/upload',
  authMiddleware,
  upload.single('video'),
  videoController.uploadVideo
);

// Obtenir les métadonnées d'une vidéo
router.get('/:id', authMiddleware, videoController.getVideo);

// Télécharger une vidéo
router.get('/:id/download', authMiddleware, videoController.downloadVideo);

// Supprimer une vidéo
router.delete('/:id', authMiddleware, videoController.deleteVideo);

module.exports = router;