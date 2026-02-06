const AuditService = require('../services/auditService');

const auditMiddleware = (action, entityType) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      res.send = originalSend;
      
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.user?.id || null;
        const entityId = req.params.id || req.body?.id || null;
        const details = {
          method: req.method,
          path: req.path,
          body: req.body,
          query: req.query
        };
        const ipAddress = req.ip || req.connection.remoteAddress;
        
        AuditService.log(userId, action, entityType, entityId, details, ipAddress)
          .catch(err => console.error('Audit middleware error:', err));
      }
      
      return res.send(data);
    };
    
    next();
  };
};

module.exports = auditMiddleware;
