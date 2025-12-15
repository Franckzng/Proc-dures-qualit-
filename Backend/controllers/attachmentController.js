// backend/controllers/attachmentController.js
const db = require('../models'); // contient Attachment, Procedure, sequelize, Sequelize
const { Attachment, Procedure } = db;

/**
 * Upload d'un fichier et association à une procédure (si procedureId fourni).
 *
 * - Crée l'attachment
 * - Tente d'utiliser le mixin Sequelize proc.addAttachment()
 * - Si le mixin n'existe pas (proc.addAttachment not a function), on fait un INSERT direct
 *   vers la table de liaison `procedure_attachments` via db.sequelize.query
 */
exports.upload = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Fichier manquant' });
    }

    const file = req.file;
    const procedureId = req.body?.procedureId ? Number(req.body.procedureId) : null;

    // 1) Création de l'attachment
    const attachment = await Attachment.create({
      original_name: file.originalname,
      stored_name:   file.filename,
      mime_type:     file.mimetype,
      size:          file.size,
      path:          file.path,
      uploader_id:   req.user?.id ?? null
    });

    // 2) Association N–N : try Sequelize mixin first, fallback to direct INSERT
    if (procedureId) {
      const proc = await Procedure.findByPk(procedureId);
      if (proc) {
        try {
          if (typeof proc.addAttachment === 'function') {
            // Sequelize mixin (preferred)
            await proc.addAttachment(attachment);
          } else {
            // Fallback: insert directly into procedure_attachments
            await db.sequelize.query(
              'INSERT INTO procedure_attachments (procedure_id, attachment_id) VALUES (?, ?)',
              { replacements: [procedureId, attachment.id] }
            );
          }
        } catch (assocErr) {
          console.error('Warning: impossible d\'associer attachment -> procedure (will continue) :', assocErr);
          // On ne return pas d'erreur bloquante pour le client upload — on log seulement
        }
      } else {
        // Proc non trouvée : log et continuer (on peut aussi décider de supprimer l'attachment si besoin)
        console.warn(`Procedure ${procedureId} introuvable — attachment créé mais non lié.`);
      }
    }

    // 3) Génération URL publique
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const url = `${baseUrl}/uploads/${attachment.stored_name}`;

    // 4) Réponse JSON
    return res.status(201).json({
      id:             attachment.id,
      original_name:  attachment.original_name,
      mime_type:      attachment.mime_type,
      size:           attachment.size,
      url,
      uploader_id:    attachment.uploader_id,
      uploaded_at:    attachment.uploaded_at
    });
  } catch (err) {
    console.error('attachment.upload error:', err);
    next(err);
  }
};

/**
 * Liste des attachments pour une procédure.
 * Utilise une requête JOIN directe (robuste même si associations Sequelize manquent).
 */
exports.listByProcedure = async (req, res, next) => {
  try {
    const procedureId = Number(req.params.procedureId);
    if (!procedureId) return res.status(400).json({ message: 'procedureId invalide' });

    // Requête sûre : join direct sur procedure_attachments
    const attachments = await db.sequelize.query(
      `SELECT a.id, a.original_name, a.stored_name, a.mime_type, a.size, a.path, a.uploader_id, a.uploaded_at
       FROM attachments a
       INNER JOIN procedure_attachments pa ON pa.attachment_id = a.id
       WHERE pa.procedure_id = ?
       ORDER BY a.uploaded_at DESC`,
      {
        replacements: [procedureId],
        type: db.Sequelize.QueryTypes.SELECT
      }
    );

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const result = attachments.map(att => ({
      id: att.id,
      original_name: att.original_name,
      mime_type: att.mime_type,
      size: att.size,
      url: `${baseUrl}/uploads/${att.stored_name}`,
      uploader_id: att.uploader_id,
      uploaded_at: att.uploaded_at
    }));

    return res.json(result);
  } catch (err) {
    console.error('attachment.listByProcedure error:', err);
    next(err);
  }
};
