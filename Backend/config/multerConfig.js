// backend/config/multerConfig.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/videos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const videoFilter = (req, file, cb) => {
  const validMimes = ['video/mp4', 'video/avi', 'video/mov', 'video/quicktime'];
  if (validMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format vidéo non supporté'), false);
  }
};

const upload = multer({
  storage: videoStorage,
  fileFilter: videoFilter,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB max
});

module.exports = upload;