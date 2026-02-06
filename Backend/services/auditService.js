const db = require('../config/db');

class AuditService {
  static async log(userId, action, entityType, entityId, details = {}, ipAddress = null) {
    try {
      await db.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, action, entityType, entityId, JSON.stringify(details), ipAddress]
      );
    } catch (error) {
      console.error('Audit log error:', error);
    }
  }

  static async getLogs(filters = {}) {
    let sql = `SELECT al.*, u.nom, u.prenom, u.email 
               FROM audit_logs al 
               LEFT JOIN utilisateurs u ON al.user_id = u.id 
               WHERE 1=1`;
    const params = [];

    if (filters.userId) {
      sql += ' AND al.user_id = ?';
      params.push(filters.userId);
    }
    if (filters.entityType) {
      sql += ' AND al.entity_type = ?';
      params.push(filters.entityType);
    }
    if (filters.entityId) {
      sql += ' AND al.entity_id = ?';
      params.push(filters.entityId);
    }
    if (filters.startDate) {
      sql += ' AND al.created_at >= ?';
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      sql += ' AND al.created_at <= ?';
      params.push(filters.endDate);
    }

    sql += ' ORDER BY al.created_at DESC LIMIT ?';
    params.push(filters.limit || 100);

    const [rows] = await db.query(sql, params);
    return rows;
  }

  static async getReport(startDate, endDate) {
    const [stats] = await db.query(
      `SELECT 
        action,
        entity_type,
        COUNT(*) as count,
        COUNT(DISTINCT user_id) as unique_users
       FROM audit_logs
       WHERE created_at BETWEEN ? AND ?
       GROUP BY action, entity_type
       ORDER BY count DESC`,
      [startDate, endDate]
    );
    return stats;
  }
}

module.exports = AuditService;
