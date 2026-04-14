require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');
const { generalLimiter } = require('./middleware/rateLimiter');

// ============ Initialize Express ============
const app = express();
const PORT = process.env.PORT || 5000;

// ============ Security Middleware ============
app.use(helmet());
app.use(cors({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://localhost:8080',
        'http://localhost:5173',
        'http://localhost:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ============ Body Parsing ============
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============ Logging ============
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
}

// Request logger — prints method, URL, body keys
app.use((req, res, next) => {
    if (req.method !== 'GET') {
        const bodyKeys = req.body ? Object.keys(req.body) : [];
        console.log(`📨 ${req.method} ${req.originalUrl} | body keys: [${bodyKeys.join(', ')}]`);
    }
    next();
});

// ============ Rate Limiting ============
app.use('/api/', generalLimiter);

// ============ Static Files ============
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============ API Routes ============
const authRoutes = require('./routes/authRoutes');
const voteRoutes = require('./routes/voteRoutes');
const auditRoutes = require('./routes/auditRoutes');
const publicRoutes = require('./routes/publicRoutes');
const adminRoutes = require('./routes/adminRoutes');
const resultRoutes = require('./routes/resultRoutes');
const complaintRoutes = require('./routes/complaintRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/vote', voteRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/complaints', complaintRoutes);

// ============ Health Check ============
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: '🇮🇳 BharatVote Backend is running!',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
    });
});

// ============ Root ============
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: '🗳️ BharatVote API Server',
        docs: '/api/health',
        endpoints: {
            auth: '/api/auth',
            vote: '/api/vote',
            audit: '/api/audit',
            public: '/api/public',
            admin: '/api/admin',
            results: '/api/results',
            complaints: '/api/complaints',
        },
    });
});

// ============ 404 Handler ============
app.use((req, res) => {
    console.log(`⚠️ 404: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        status: 'error',
        message: `Route ${req.method} ${req.originalUrl} not found`,
    });
});

// ============ Global Error Handler ============
app.use((err, req, res, next) => {
    console.error('❌ Unhandled Error:', err);

    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
            status: 'error',
            message: `File too large. Maximum size is ${process.env.MAX_FILE_SIZE_MB || 5}MB`,
        });
    }

    if (err.message && err.message.includes('Only JPEG and PNG')) {
        return res.status(400).json({
            status: 'error',
            message: err.message,
        });
    }

    res.status(err.status || 500).json({
        status: 'error',
        message: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message || 'Something went wrong',
    });
});

// ============ Start Server ============
const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log('');
            console.log('  🗳️  ══════════════════════════════════════');
            console.log('  🇮🇳  BharatVote Backend Server');
            console.log('  ══════════════════════════════════════');
            console.log(`  🚀  Port:        ${PORT}`);
            console.log(`  🌍  Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`  🔗  Frontend:    ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
            console.log(`  📡  API:         http://localhost:${PORT}/api/health`);
            console.log('  ══════════════════════════════════════');
            console.log('');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};

startServer();
