// backend/controllers/videoController.js
const { Video, Procedure, ProcedureVideo } = require('../models');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegPath);

exports.uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier vidéo fourni' });
    }

    const { procedureId } = req.body;
    const userId = req.user.id;

    // Vérifier si la procédure existe
    if (procedureId) {
      const procedure = await Procedure.findByPk(procedureId);
      if (!procedure) {
        return res.status(404).json({ error: 'Procédure introuvable' });
      }
    }

    // Obtenir la durée de la vidéo
    const getDuration = (filePath) => {
      return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
          if (err) return reject(err);
          resolve(Math.floor(metadata.format.duration));
        });
      });
    };

    const filePath = req.file.path;
    const duration = await getDuration(filePath);

    // Créer l'entrée vidéo dans la base
    const newVideo = await Video.create({
      nom: req.file.originalname,
      nom_fichier: req.file.filename,
      chemin_fichier: req.file.path,
      taille: req.file.size,
      duree: duration,
      format: path.extname(req.file.originalname).substring(1),
      uploadeur_id: userId
    });

    // Lier à la procédure si spécifiée
    if (procedureId) {
      await ProcedureVideo.create({
        procedure_id: procedureId,
        video_id: newVideo.id
      });
    }

    res.status(201).json(newVideo);
  } catch (error) {
    console.error('Erreur upload vidéo:', error);
    res.status(500).json({ error: 'Échec de l\'upload vidéo' });
  }
};

exports.getVideo = async (req, res) => {
  try {
    const video = await Video.findByPk(req.params.id, {
      include: [{
        model: Procedure,
        through: { attributes: [] }
      }]
    });

    if (!video) {
      return res.status(404).json({ error: 'Vidéo non trouvée' });
    }

    res.json(video);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.downloadVideo = async (req, res) => {
  try {
    const video = await Video.findByPk(req.params.id);
    
    if (!video) {
      return res.status(404).json({ error: 'Vidéo non trouvée' });
    }

    const filePath = video.chemin_fichier;
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Fichier vidéo introuvable' });
    }

    res.download(filePath, video.nom);
  } catch (error) {
    res.status(500).json({ error: 'Erreur de téléchargement' });
  }
};

exports.deleteVideo = async (req, res) => {
  try {
    const video = await Video.findByPk(req.params.id);
    
    if (!video) {
      return res.status(404).json({ error: 'Vidéo non trouvée' });
    }

    // Supprimer les associations
    await ProcedureVideo.destroy({ where: { video_id: video.id } });
    
    // Supprimer le fichier physique
    if (fs.existsSync(video.chemin_fichier)) {
      fs.unlinkSync(video.chemin_fichier);
    }

    // Supprimer de la base
    await video.destroy();

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Échec de la suppression' });
  }
};