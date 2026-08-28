const requireAdmin = (req, res, next) => {
  if (!req.user || (!req.user.isAdmin && req.user.role !== 'admin')) {
    return res.status(403).json({
      message: 'Access denied. Guild Master (Admin) authorization required.',
    });
  }
  next();
};

module.exports = {
  requireAdmin,
};
