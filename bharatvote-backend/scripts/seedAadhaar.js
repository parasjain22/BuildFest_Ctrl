/**
 * Seed Script — Mock Aadhaar Registry
 * 
 * Generates 100 random 12-digit Aadhaar numbers, hashes them with SHA-256
 * (using the same hashWithSalt function as the app), and inserts into MongoDB.
 * 
 * Usage:  node scripts/seedAadhaar.js
 * 
 * The first 10 Aadhaar numbers are printed to the console so you can use them
 * for testing registration on the website.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');

// Use the exact same hashing logic as the app
const hashWithSalt = (value) => {
    const salt = process.env.HASH_SECRET_SALT;
    if (!salt) throw new Error('HASH_SECRET_SALT not set in .env');
    return crypto.createHmac('sha256', salt).update(value).digest('hex');
};

const MONGO_URI = process.env.MONGO_URI;
const TOTAL = 100; // number of mock Aadhaar records to seed

// Generate a random 12-digit Aadhaar number (format: XXXX XXXX XXXX)
const generateRandomAadhaar = () => {
    // Aadhaar numbers start with 2-9 (never 0 or 1)
    const first = String(Math.floor(Math.random() * 8) + 2);
    let rest = '';
    for (let i = 0; i < 11; i++) {
        rest += String(Math.floor(Math.random() * 10));
    }
    return first + rest;
};

const seed = async () => {
    console.log('');
    console.log('🇮🇳 ═══════════════════════════════════════════════');
    console.log('   BharatVote — Mock Aadhaar Registry Seeder');
    console.log('═══════════════════════════════════════════════════');
    console.log('');

    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const AadhaarRegistry = require('../models/AadhaarRegistry');

        // Check if already seeded
        const existing = await AadhaarRegistry.countDocuments();
        if (existing > 0) {
            console.log(`⚠️  Registry already has ${existing} records.`);
            console.log('   To re-seed, drop the collection first:');
            console.log('   db.aadhaarregistries.drop()');
            console.log('');

            // Still print some existing ones for convenience
            // Can't reverse hashes, so just tell user to use the numbers from the original seeding
            console.log('   If you lost the test numbers, drop & re-run this script.');
            await mongoose.disconnect();
            process.exit(0);
        }

        // Generate Aadhaar numbers
        const rawNumbers = [];
        const seen = new Set();
        while (rawNumbers.length < TOTAL) {
            const num = generateRandomAadhaar();
            if (!seen.has(num)) {
                seen.add(num);
                rawNumbers.push(num);
            }
        }

        // Hash and prepare documents
        const docs = rawNumbers.map(num => ({
            aadhaar_hash: hashWithSalt(num),
            region: 'India',
            is_active: true,
        }));

        // Insert into MongoDB
        await AadhaarRegistry.insertMany(docs);
        console.log(`✅ Inserted ${TOTAL} hashed Aadhaar records into MongoDB`);
        console.log('   (Raw numbers are NEVER stored — only SHA-256 hashes)');
        console.log('');

        // Print first 10 for testing
        console.log('🔑 ═══════════════════════════════════════════════');
        console.log('   TEST AADHAAR NUMBERS (use these to register):');
        console.log('═══════════════════════════════════════════════════');
        console.log('');
        for (let i = 0; i < 10; i++) {
            const formatted = rawNumbers[i].replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');
            console.log(`   ${i + 1}.  ${formatted}   (raw: ${rawNumbers[i]})`);
        }
        console.log('');
        console.log('   ⚠️  SAVE THESE NUMBERS — they cannot be recovered');
        console.log('       from the database (only hashes are stored).');
        console.log('');
        console.log('═══════════════════════════════════════════════════');

        await mongoose.disconnect();
        console.log('✅ Done! MongoDB disconnected.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error.message);
        process.exit(1);
    }
};

seed();
