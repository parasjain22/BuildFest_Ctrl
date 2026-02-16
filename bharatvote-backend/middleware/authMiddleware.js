const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { tokenBlacklist } = require('../controllers/authController');

/**
 * JWT Authentication Middleware.
 * Supports both voter tokens (userId in DB) and admin tokens (env-based credentials).
 * Rejects blacklisted tokens (from logout).
 */
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                status: 'error',
                message: 'Access denied. No token provided.',
            });
        }

        const token = authHeader.split(' ')[1];

        // Check if token has been blacklisted (user logged out)
        if (tokenBlacklist.has(token)) {
            return res.status(401).json({
                status: 'error',
                message: 'Session invalidated. Please login again.',
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Admin token (userId === 'admin')
        if (decoded.userId === 'admin' && decoded.role === 'admin') {
            req.user = {
                _id: 'admin',
                role: 'admin',
                name: 'Election Commissioner',
                email: decoded.email,
            };
            req.userId = 'admin';
            return next();
        }

        // Voter token (userId is a MongoDB ObjectId)
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'User not found. Token invalid.',
            });
        }

        if (user.blocked) {
            return res.status(403).json({
                status: 'error',
                message: 'Account has been blocked.',
            });
        }

        req.user = user;
        req.userId = user._id;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                status: 'error',
                message: 'Session expired. Please login again.',
            });
        }
        return res.status(401).json({
            status: 'error',
            message: 'Invalid token.',
        });
    }
};

module.exports = authMiddleware;
