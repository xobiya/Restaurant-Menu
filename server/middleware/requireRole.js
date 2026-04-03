const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication is required.' });
  }

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'You do not have permission to access this resource.' });
  }

  return next();
};

module.exports = requireRole;
