const NotificationService = require('../services/notificationService');

exports.getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const unreadOnly = req.query.unreadOnly === 'true';
    const notifications = await NotificationService.getUserNotifications(userId, unreadOnly);
    res.json(notifications);
  } catch (err) {
    next(err);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    await NotificationService.markAsRead(id, userId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

exports.markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await NotificationService.markAllAsRead(userId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
