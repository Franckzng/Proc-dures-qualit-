const db = require('../config/db');

class NotificationService {
    async createNotification(userId, type, titre, message, workflowId = null, stepId = null) {
        try {
            await db.query(
                `INSERT INTO notifications (utilisateur_id, type, titre, message, workflow_id, step_id) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [userId, type, titre, message, workflowId, stepId]
            );
            
            // Logique WebSocket (à implémenter ultérieurement)
            // if (global.io) {
            //   global.io.to(`user_${userId}`).emit('notification', { titre, message });
            // }
            
            return true;
        } catch (error) {
            console.error("Erreur création notification:", error);
            return false;
        }
    }
}

module.exports = new NotificationService();