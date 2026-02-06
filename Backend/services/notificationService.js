const db = require('../config/db');

class NotificationService {
  static async create(userId, type, title, message, entityType = null, entityId = null) {
    try {
      await db.query(
        `INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, type, title, message, entityType, entityId]
      );
      return true;
    } catch (error) {
      console.error('Notification error:', error);
      return false;
    }
  }

  static async notifyWorkflowStep(userId, procedureTitle, action) {
    const titles = {
      'assigned': 'Nouvelle tâche assignée',
      'approved': 'Procédure approuvée',
      'rejected': 'Procédure rejetée'
    };
    const messages = {
      'assigned': `Vous avez une nouvelle étape à traiter pour "${procedureTitle}"`,
      'approved': `La procédure "${procedureTitle}" a été approuvée`,
      'rejected': `La procédure "${procedureTitle}" a été rejetée`
    };
    return this.create(userId, 'workflow', titles[action], messages[action], 'procedure', null);
  }

  static async getUserNotifications(userId, unreadOnly = false) {
    let sql = `SELECT * FROM notifications WHERE user_id = ?`;
    const params = [userId];
    if (unreadOnly) sql += ' AND is_read = false';
    sql += ' ORDER BY created_at DESC LIMIT 50';
    const [rows] = await db.query(sql, params);
    return rows;
  }

  static async markAsRead(notificationId, userId) {
    await db.query(
      `UPDATE notifications SET is_read = true WHERE id = ? AND user_id = ?`,
      [notificationId, userId]
    );
  }

  static async markAllAsRead(userId) {
    await db.query(
      `UPDATE notifications SET is_read = true WHERE user_id = ?`,
      [userId]
    );
  }
}

module.exports = NotificationService;