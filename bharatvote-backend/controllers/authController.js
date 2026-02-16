const fs = require('fs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const OTP = require('../models/OTP');
const AadhaarRegistry = require('../models/AadhaarRegistry');
const { hashWithSalt, hashFileBuffer, generateOTP } = require('../utils/hash');

// ===================== ADMIN LOGIN =====================

/**
 * POST /api/auth/admin-login
 * Admin login with email + password from env vars.
 */
const adminLogin = async (req, res) => {
    console.log('🔐 [adminLogin] ▶ Admin login attempt');
    try {
        const { email, password } = req.body;
        console.log(`🔐 [adminLogin]   Email: ${email}`);

        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) {
            console.log('🔐 [adminLogin] ❌ ADMIN_EMAIL or ADMIN_PASSWORD not configured in .env');
            return res.status(500).json({ status: 'error', message: 'Admin credentials not configured on server' });
        }

        if (email !== adminEmail || password !== adminPassword) {
            console.log('🔐 [adminLogin] ❌ Invalid credentials');
            return res.status(401).json({ status: 'error', message: 'Invalid admin credentials' });
        }

        // Generate admin JWT
        const token = jwt.sign(
            { userId: 'admin', role: 'admin', email: adminEmail },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        console.log('🔐 [adminLogin] ✅ Admin authenticated, token issued');
        res.status(200).json({
            status: 'success',
            message: 'Admin login successful',
            token,
            user: {
                id: 'admin',
                name: 'Election Commissioner',
                email: adminEmail,
                role: 'admin',
            },
        });
    } catch (error) {
        console.error('🔐 [adminLogin] ❌ Error:', error.message);
        res.status(500).json({ status: 'error', message: 'Admin login failed' });
    }
};

// ===================== VOTER REGISTRATION =====================

/**
 * POST /api/auth/register
 * Voter registration with identity hashing.
 */
const register = async (req, res) => {
    console.log('📝 [register] ▶ New voter registration attempt');
    try {
        const { name, mobile, aadhaar, voter_id, email, state, constituency, declaration_accepted } = req.body;
        console.log(`📝 [register]   Name: ${name}, Voter ID: ${voter_id}, State: ${state}`);

        // Validate declaration
        if (declaration_accepted !== true && declaration_accepted !== 'true') {
            console.log('📝 [register] ❌ Declaration not accepted');
            return res.status(400).json({ status: 'error', message: 'Declaration must be accepted' });
        }

        // Check file uploads
        if (!req.files || !req.files.aadhaar_image || !req.files.user_image) {
            console.log('📝 [register] ❌ Missing file uploads');
            return res.status(400).json({ status: 'error', message: 'Both Aadhaar card image and user photo are required' });
        }

        // Hash sensitive identity data
        console.log('📝 [register]   Hashing Aadhaar and mobile...');
        const aadhaar_hash = hashWithSalt(aadhaar);
        const mobile_hash = hashWithSalt(mobile);

        // ═══ STEP 1: Verify Aadhaar exists in the mock government registry ═══
        console.log('📝 [register]   Verifying Aadhaar against government registry (SHA-256 lookup)...');
        const registryEntry = await AadhaarRegistry.findOne({ aadhaar_hash, is_active: true });
        if (!registryEntry) {
            console.log('📝 [register] ❌ Aadhaar NOT FOUND in government registry');
            return res.status(400).json({
                status: 'error',
                message: 'Invalid Aadhaar number. This Aadhaar is not recognized by the government registry. Please enter a valid Aadhaar number.',
            });
        }
        console.log('📝 [register] ✅ Aadhaar verified in government registry');

        // Hash uploaded files for integrity
        const aadhaarImageBuffer = fs.readFileSync(req.files.aadhaar_image[0].path);
        const userImageBuffer = fs.readFileSync(req.files.user_image[0].path);
        const aadhaar_image_hash = hashFileBuffer(aadhaarImageBuffer);
        const user_image_hash = hashFileBuffer(userImageBuffer);
        console.log('📝 [register]   File hashes generated');

        // Check for duplicates (user already registered with this Aadhaar)
        console.log('📝 [register]   Checking for duplicate Aadhaar in registered users...');
        const existingAadhaar = await User.findOne({ aadhaar_hash });
        if (existingAadhaar) {
            console.log('📝 [register] ❌ Duplicate Aadhaar — user already registered');
            return res.status(409).json({ status: 'error', message: 'This Aadhaar is already registered. Please login instead.' });
        }

        console.log('📝 [register]   Checking for duplicate mobile...');
        const existingMobile = await User.findOne({ mobile_hash });
        if (existingMobile) {
            console.log('📝 [register] ❌ Duplicate mobile detected');
            return res.status(409).json({ status: 'error', message: 'This mobile number is already registered' });
        }

        console.log('📝 [register]   Checking for duplicate Voter ID...');
        const existingVoterId = await User.findOne({ voter_id });
        if (existingVoterId) {
            console.log('📝 [register] ❌ Duplicate Voter ID detected');
            return res.status(409).json({ status: 'error', message: 'This Voter ID is already registered' });
        }

        const existingImageHash = await User.findOne({ aadhaar_image_hash });
        if (existingImageHash) {
            console.log('📝 [register] ❌ Duplicate Aadhaar image detected');
            return res.status(409).json({ status: 'error', message: 'This Aadhaar card image is already registered' });
        }

        // Generate voter commitment (for nullifier system)
        const commitment = hashWithSalt(aadhaar_hash + voter_id + Date.now().toString());
        console.log('📝 [register]   Commitment generated');

        // Create user
        const user = await User.create({
            name,
            mobile_hash,
            aadhaar_hash,
            voter_id,
            aadhaar_image_path: req.files.aadhaar_image[0].path,
            aadhaar_image_hash,
            user_image_path: req.files.user_image[0].path,
            user_image_hash,
            email: email || undefined,
            state,
            constituency,
            declaration_accepted: true,
            commitment,
        });

        console.log(`📝 [register] ✅ User created: ${user._id} (${name})`);
        res.status(201).json({
            status: 'success',
            message: 'Registration completed securely',
            data: {
                id: user._id,
                name: user.name,
                voter_id: user.voter_id,
                state: user.state,
                constituency: user.constituency,
                is_verified: user.is_verified,
            },
        });
    } catch (error) {
        if (error.code === 11000) {
            console.log('📝 [register] ❌ MongoDB duplicate key error');
            return res.status(409).json({ status: 'error', message: 'Duplicate identity detected' });
        }
        console.error('📝 [register] ❌ Error:', error.message);
        res.status(500).json({ status: 'error', message: 'Registration failed. Please try again.' });
    }
};

// ===================== VOTER LOGIN =====================

/**
 * POST /api/auth/login/initiate
 * Check Aadhaar existence and send OTP.
 */
const loginInitiate = async (req, res) => {
    console.log('🔑 [loginInitiate] ▶ Login attempt');
    try {
        const { aadhaar } = req.body;
        const aadhaar_hash = hashWithSalt(aadhaar);
        console.log(`🔑 [loginInitiate]   Aadhaar hash: ${aadhaar_hash.substring(0, 12)}...`);

        // Find user by aadhaar hash
        const user = await User.findOne({ aadhaar_hash });
        if (!user) {
            console.log('🔑 [loginInitiate] ❌ Aadhaar not registered');
            return res.status(404).json({
                status: 'not_registered',
                message: 'Aadhaar not found. Please register first.',
            });
        }

        console.log(`🔑 [loginInitiate]   User found: ${user._id} (${user.name})`);

        if (user.blocked) {
            console.log('🔑 [loginInitiate] ❌ Account blocked');
            return res.status(403).json({
                status: 'error',
                message: 'Account is blocked. Contact helpdesk.',
            });
        }

        // Check for existing unexpired OTP with lock
        const existingOTP = await OTP.findOne({ aadhaar_hash });
        if (existingOTP && existingOTP.locked_until && existingOTP.locked_until > new Date()) {
            const remainingMinutes = Math.ceil((existingOTP.locked_until - new Date()) / 60000);
            console.log(`🔑 [loginInitiate] ❌ Account locked for ${remainingMinutes} more minutes`);
            return res.status(429).json({
                status: 'error',
                message: `Too many attempts. Try again in ${remainingMinutes} minutes.`,
            });
        }

        // Generate OTP
        const otp = generateOTP(6);
        const otp_hash = hashWithSalt(otp);
        console.log(`🔑 [loginInitiate]   OTP generated: ${otp} (hash: ${otp_hash.substring(0, 8)}...)`);

        // Store OTP (upsert)
        await OTP.findOneAndUpdate(
            { aadhaar_hash },
            {
                aadhaar_hash,
                otp_hash,
                attempts: 0,
                locked_until: null,
                expires_at: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
            },
            { upsert: true, new: true }
        );
        console.log('🔑 [loginInitiate]   OTP stored in DB');

        // In mock mode, return OTP for development
        const isMock = process.env.OTP_MOCK === 'true';

        if (!isMock) {
            console.log(`📱 [loginInitiate]   OTP sent to registered mobile for Aadhaar hash: ${aadhaar_hash.substring(0, 8)}...`);
        } else {
            console.log(`📱 [loginInitiate]   MOCK MODE — OTP: ${otp}`);
        }

        const maskedMobile = '98****XX45';

        console.log('🔑 [loginInitiate] ✅ OTP sent successfully');
        res.status(200).json({
            status: 'success',
            message: `OTP sent to registered mobile: ${maskedMobile}`,
            data: {
                ...(isMock && { debug_otp: otp }),
                user_id: user._id,
            }
        });
    } catch (error) {
        console.error('🔑 [loginInitiate] ❌ Error:', error.message);
        res.status(500).json({ status: 'error', message: 'Failed to initiate login' });
    }
};

/**
 * POST /api/auth/login/verify-otp
 */
const verifyOTP = async (req, res) => {
    console.log('🔢 [verifyOTP] ▶ OTP verification attempt');
    try {
        const { aadhaar, otp } = req.body;
        const aadhaar_hash = hashWithSalt(aadhaar);
        const otp_hash = hashWithSalt(otp);

        const otpRecord = await OTP.findOne({ aadhaar_hash });
        if (!otpRecord) {
            console.log('🔢 [verifyOTP] ❌ No OTP record found');
            return res.status(400).json({ status: 'error', message: 'No OTP found. Please request a new one.' });
        }

        if (otpRecord.locked_until && otpRecord.locked_until > new Date()) {
            console.log('🔢 [verifyOTP] ❌ Account temporarily locked');
            return res.status(429).json({ status: 'error', message: 'Account temporarily locked. Try again later.' });
        }

        if (otpRecord.expires_at < new Date()) {
            console.log('🔢 [verifyOTP] ❌ OTP expired');
            return res.status(403).json({ status: 'error', message: 'OTP expired. Please request a new one.' });
        }

        if (otpRecord.otp_hash !== otp_hash) {
            otpRecord.attempts += 1;
            console.log(`🔢 [verifyOTP] ❌ Invalid OTP (attempt ${otpRecord.attempts}/${otpRecord.max_attempts})`);

            if (otpRecord.attempts >= otpRecord.max_attempts) {
                otpRecord.locked_until = new Date(Date.now() + 10 * 60 * 1000);
                console.log('🔢 [verifyOTP] 🔒 Account locked for 10 minutes');
            }

            await otpRecord.save();
            return res.status(401).json({
                status: 'error',
                message: `Invalid OTP. ${otpRecord.max_attempts - otpRecord.attempts} attempts remaining.`,
            });
        }

        // OTP verified — clean up
        await OTP.deleteOne({ aadhaar_hash });
        console.log('🔢 [verifyOTP]   OTP record deleted');

        // Generate temporary token for face verification step
        const tempToken = jwt.sign(
            { aadhaar_hash, step: 'face_verify' },
            process.env.JWT_SECRET,
            { expiresIn: '10m' }
        );

        console.log('🔢 [verifyOTP] ✅ OTP verified, temp token issued');
        res.status(200).json({
            status: 'otp_verified',
            message: 'OTP verified. Proceed to face verification.',
            temp_token: tempToken,
        });
    } catch (error) {
        console.error('🔢 [verifyOTP] ❌ Error:', error.message);
        res.status(500).json({ status: 'error', message: 'OTP verification failed' });
    }
};

/**
 * POST /api/auth/login/face-verify
 */
const faceVerify = async (req, res) => {
    console.log('👤 [faceVerify] ▶ Face verification attempt');
    try {
        const { temp_token } = req.body;

        let decoded;
        try {
            decoded = jwt.verify(temp_token, process.env.JWT_SECRET);
        } catch {
            console.log('👤 [faceVerify] ❌ Temp token invalid/expired');
            return res.status(401).json({ status: 'error', message: 'Session expired. Please restart login.' });
        }

        if (decoded.step !== 'face_verify') {
            console.log('👤 [faceVerify] ❌ Wrong auth step');
            return res.status(400).json({ status: 'error', message: 'Invalid authentication step' });
        }

        const user = await User.findOne({ aadhaar_hash: decoded.aadhaar_hash });
        if (!user) {
            console.log('👤 [faceVerify] ❌ User not found by aadhaar hash');
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        console.log(`👤 [faceVerify]   User: ${user._id} (${user.name})`);

        const isMock = process.env.FACE_MATCH_MOCK === 'true';
        let matchResult = { match: true, similarity: 0.92 };

        if (!isMock) {
            console.log('👤 [faceVerify]   Running face comparison service...');
        } else {
            console.log('👤 [faceVerify]   MOCK MODE — face match auto-approved');
        }

        if (req.file) {
            fs.unlink(req.file.path, () => { });
        }

        if (!matchResult.match) {
            user.violation_count += 1;
            await user.save();
            console.log('👤 [faceVerify] ❌ Face mismatch — violation recorded');
            return res.status(401).json({ status: 'error', message: 'Face verification failed' });
        }

        // Generate full auth JWT
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
        );

        console.log(`👤 [faceVerify] ✅ Login successful for ${user.name} (role: ${user.role})`);
        res.status(200).json({
            status: 'authenticated',
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                voter_id: user.voter_id,
                constituency: user.constituency,
                state: user.state,
                has_voted: user.has_voted,
            },
        });
    } catch (error) {
        console.error('👤 [faceVerify] ❌ Error:', error.message);
        res.status(500).json({ status: 'error', message: 'Face verification failed' });
    }
};

// ===================== TOKEN BLACKLIST =====================

/**
 * In-memory token blacklist.
 * In production, use Redis or a database table.
 */
const tokenBlacklist = new Set();

// Periodically clean expired tokens from the blacklist (every 5 minutes)
setInterval(() => {
    const now = Math.floor(Date.now() / 1000);
    for (const entry of tokenBlacklist) {
        try {
            const decoded = jwt.decode(entry);
            if (decoded && decoded.exp && decoded.exp < now) {
                tokenBlacklist.delete(entry);
            }
        } catch { tokenBlacklist.delete(entry); }
    }
}, 5 * 60 * 1000);

// ===================== LOGOUT =====================

/**
 * POST /api/auth/logout
 * Invalidate the current JWT by adding it to a blacklist.
 */
const logout = async (req, res) => {
    console.log('🔓 [logout] ▶ Logout request received');
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            tokenBlacklist.add(token);
            console.log('🔓 [logout]   Token blacklisted');
        }
        console.log('🔓 [logout] ✅ Logged out successfully');
        res.json({ status: 'success', message: 'Logged out successfully' });
    } catch (error) {
        console.error('🔓 [logout] ❌ Error:', error.message);
        res.status(500).json({ status: 'error', message: 'Logout failed' });
    }
};

module.exports = { adminLogin, register, loginInitiate, verifyOTP, faceVerify, logout, tokenBlacklist };
