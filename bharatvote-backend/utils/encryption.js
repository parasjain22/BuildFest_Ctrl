const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';

/**
 * Encrypt data using AES-256-CBC.
 * Returns { iv, encryptedData } as hex strings.
 */
const encrypt = (data, keyHex) => {
    const key = Buffer.from(keyHex || process.env.VOTE_ENCRYPTION_KEY, 'hex');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return {
        iv: iv.toString('hex'),
        encryptedData: encrypted,
    };
};

/**
 * Decrypt AES-256-CBC encrypted data.
 */
const decrypt = (encryptedData, ivHex, keyHex) => {
    const key = Buffer.from(keyHex || process.env.VOTE_ENCRYPTION_KEY, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
};

/**
 * Generate a new AES-256 key pair for an election.
 * Simulates HSM key storage.
 */
const generateElectionKeyPair = () => {
    const privateKey = crypto.randomBytes(32).toString('hex');
    const publicKeyHash = crypto.createHash('sha256').update(privateKey).digest('hex');
    return { privateKey, publicKeyHash };
};

module.exports = { encrypt, decrypt, generateElectionKeyPair };
