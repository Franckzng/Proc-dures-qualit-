const AuditService = require('../services/auditService');

exports.getLogs = async (req, res, next) => {
  try {
    const filters = {
      userId: req.query.userId,
      entityType: req.query.entityType,
      entityId: req.query.entityId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      limit: req.query.limit
    };
    const logs = await AuditService.getLogs(filters);
    res.json(logs);
  } catch (err) {
    next(err);
  }
};

exports.getReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate et endDate requis' });
    }
    const report = await AuditService.getReport(startDate, endDate);
    res.json(report);
  } catch (err) {
    next(err);
  }
};
