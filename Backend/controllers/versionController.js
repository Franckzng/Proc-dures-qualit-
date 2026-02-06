const VersionService = require('../services/versionService');

exports.getVersions = async (req, res, next) => {
  try {
    const { procedureId } = req.params;
    const versions = await VersionService.getVersions(procedureId);
    res.json(versions);
  } catch (err) {
    next(err);
  }
};

exports.getVersion = async (req, res, next) => {
  try {
    const { versionId } = req.params;
    const version = await VersionService.getVersion(versionId);
    if (!version) {
      return res.status(404).json({ message: 'Version non trouvée' });
    }
    res.json(version);
  } catch (err) {
    next(err);
  }
};

exports.createVersion = async (req, res, next) => {
  try {
    const { procedureId } = req.params;
    const userId = req.user.id;
    await VersionService.createVersion(procedureId, userId);
    res.status(201).json({ message: 'Version créée' });
  } catch (err) {
    next(err);
  }
};

exports.restoreVersion = async (req, res, next) => {
  try {
    const { versionId } = req.params;
    const userId = req.user.id;
    const procedureId = await VersionService.restoreVersion(versionId, userId);
    res.json({ procedureId, message: 'Version restaurée' });
  } catch (err) {
    next(err);
  }
};
