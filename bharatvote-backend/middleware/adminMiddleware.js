/**
 * Admin Role-Based Access Control Middleware.
 * Must be used AFTER authMiddleware.
 */
const adminMiddleware = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            status: 'error',
            message: 'Authentication required.',
        });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({
            status: 'error',
            message: 'Admin access required.',
        });
    }

    next();
};

module.exports = adminMiddleware;
