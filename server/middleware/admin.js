function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied for this role.' });
    }
    next();
  };
}

function requireAdmin(req, res, next) {
  return requireRoles('MASTER', 'SUPER_MASTER')(req, res, next);
}

module.exports = { requireAdmin, requireRoles };
