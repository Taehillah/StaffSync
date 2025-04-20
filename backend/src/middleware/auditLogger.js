import AuditLog from '../models/AuditLog';

export const auditLogger = async (req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const logData = {
      userId: req.user?._id,
      action: req.method === 'POST' ? 'CREATE' : 
             req.method === 'DELETE' ? 'DELETE' : 'UPDATE',
      entity: req.baseUrl.replace('/api/', ''),
      ipAddress: req.ip
    };

    if (req.params.id) logData.targetUserId = req.params.id;
    if (req.body.justification) logData.justification = req.body.justification;

    await AuditLog.create(logData);
  }
  next();
};