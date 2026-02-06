const db = require('../config/db');

class VersionService {
  static async createVersion(procedureId, userId) {
    const [[proc]] = await db.query(
      `SELECT * FROM procedures WHERE id = ?`,
      [procedureId]
    );
    if (!proc) throw new Error('Procédure non trouvée');

    const [steps] = await db.query(
      `SELECT * FROM steps WHERE procedure_id = ?`,
      [procedureId]
    );

    const snapshot = { procedure: proc, steps };

    await db.query(
      `INSERT INTO procedure_versions 
       (procedure_id, version, titre, description, content_snapshot, statut, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [procedureId, proc.version, proc.titre, proc.description, 
       JSON.stringify(snapshot), proc.statut, userId]
    );
  }

  static async getVersions(procedureId) {
    const [versions] = await db.query(
      `SELECT pv.*, u.nom, u.prenom 
       FROM procedure_versions pv
       LEFT JOIN utilisateurs u ON pv.created_by = u.id
       WHERE pv.procedure_id = ?
       ORDER BY pv.created_at DESC`,
      [procedureId]
    );
    return versions;
  }

  static async getVersion(versionId) {
    const [[version]] = await db.query(
      `SELECT * FROM procedure_versions WHERE id = ?`,
      [versionId]
    );
    return version;
  }

  static async restoreVersion(versionId, userId) {
    const version = await this.getVersion(versionId);
    if (!version) throw new Error('Version non trouvée');

    const snapshot = JSON.parse(version.content_snapshot);
    const proc = snapshot.procedure;

    await this.createVersion(proc.id, userId);

    await db.query(
      `UPDATE procedures 
       SET titre = ?, description = ?, version = ?, date_modification = NOW()
       WHERE id = ?`,
      [proc.titre, proc.description, proc.version, proc.id]
    );

    return proc.id;
  }
}

module.exports = VersionService;
