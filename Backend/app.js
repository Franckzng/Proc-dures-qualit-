// backend/app.js
require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const bodyParser = require('body-parser');
const multer     = require('multer');
const crypto     = require('crypto');
const path       = require('path');
const { sequelize } = require('./models');

const authMiddleware    = require('./middlewares/authMiddleware');
const verifyToken       = authMiddleware.verifyToken || authMiddleware;

const authRoutes        = require('./routes/authRoutes');
const userRoutes        = require('./routes/userRoutes');
// departmentRoutes intentionally removed
const procedureRoutes   = require('./routes/procedureRoutes');
const workflowRoutes    = require('./routes/workflowRoutes');
const attachmentRoutes  = require('./routes/attachmentRoutes');
const dashboardRoutes   = require('./routes/dashboardRoutes');
const normeRoutes       = require('./routes/normeRoutes');

const app = express();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename:    (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const name = crypto.randomBytes(16).toString('hex');
    cb(null, `${name}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } });

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api', (req, res, next) => {
  if (req.originalUrl.startsWith('/api/auth')) return next();
  return verifyToken(req, res, next);
});

sequelize.authenticate()
  .then(() => console.log('✅ Database connected.'))
  .catch(err => console.error('❌ DB connection error:', err));

// Routes
app.use('/api/auth',        authRoutes);
app.use('/api/users',       userRoutes);
app.use('/api/procedures',  procedureRoutes);
app.use('/api/workflows',   workflowRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/dashboard',   dashboardRoutes);
app.use('/api/normes',      normeRoutes);

app.use((err, req, res, next) => {
  if (err && err instanceof multer.MulterError) {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'Fichier trop volumineux (max 500MB)' : 'Erreur d’upload de fichier';
    return res.status(400).json({ error: msg });
  }
  next(err);
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erreur serveur', details: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));
