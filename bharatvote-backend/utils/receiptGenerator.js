const PDFDocument = require('pdfkit');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate a vote receipt PDF as a Buffer.
 */
const generateReceiptPDF = (receiptData) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A5', margin: 40 });
            const buffers = [];

            doc.on('data', (chunk) => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            // Tricolor header bar
            doc.rect(0, 0, doc.page.width, 8).fill('#FF9933');
            doc.rect(0, 8, doc.page.width, 8).fill('#FFFFFF');
            doc.rect(0, 16, doc.page.width, 8).fill('#138808');

            doc.moveDown(2);

            // Title
            doc.fontSize(18).fillColor('#1a1a2e').font('Helvetica-Bold')
                .text('भारत निर्वाचन प्रणाली', { align: 'center' });
            doc.fontSize(10).fillColor('#666').font('Helvetica')
                .text('BharatVote - Secure Digital Voting System', { align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(8).fillColor('#138808')
                .text('✓ DIGITALLY VERIFIED', { align: 'center' });

            doc.moveDown(1);

            // Divider
            doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke('#ddd');
            doc.moveDown(1);

            // I am a Proud Voter
            doc.fontSize(16).fillColor('#FF9933').font('Helvetica-Bold')
                .text('🗳️ I am a Proud Voter!', { align: 'center' });
            doc.fontSize(10).fillColor('#666').font('Helvetica')
                .text('मैं एक गर्वित मतदाता हूँ!', { align: 'center' });

            doc.moveDown(1);

            // Receipt details
            const details = [
                ['Receipt ID', receiptData.receiptId],
                ['Voter Number', `#${receiptData.voterNumber} voter in this election`],
                ['Timestamp', new Date(receiptData.timestamp).toLocaleString('en-IN')],
                ['Election', receiptData.electionName || 'General Election'],
            ];

            details.forEach(([label, value]) => {
                doc.fontSize(9).fillColor('#999').text(label, 40);
                doc.fontSize(11).fillColor('#1a1a2e').font('Helvetica-Bold').text(value, 40);
                doc.font('Helvetica').moveDown(0.5);
            });

            doc.moveDown(0.5);

            // Vote Hash
            doc.fontSize(9).fillColor('#999').text('Vote Hash (SHA-256)', 40);
            doc.fontSize(7).fillColor('#1a1a2e').font('Courier')
                .text(receiptData.voteHash, 40, undefined, { width: doc.page.width - 80 });

            doc.font('Helvetica').moveDown(0.5);

            // Merkle Root
            doc.fontSize(9).fillColor('#999').text('Merkle Root', 40);
            doc.fontSize(7).fillColor('#1a1a2e').font('Courier')
                .text(receiptData.merkleRoot, 40, undefined, { width: doc.page.width - 80 });

            doc.font('Helvetica').moveDown(1.5);

            // Privacy notice
            doc.fontSize(8).fillColor('#138808')
                .text('🔒 This receipt proves your vote was included but does NOT reveal who you voted for.', 40, undefined, {
                    width: doc.page.width - 80,
                    align: 'center',
                });

            doc.moveDown(1);

            // ECI regards
            doc.fontSize(9).fillColor('#1a1a2e').font('Helvetica-Bold')
                .text('With regards,', { align: 'center' });
            doc.fontSize(9).fillColor('#666').font('Helvetica')
                .text('Election Commission of India', { align: 'center' });
            doc.text('Nirvachan Sadan, New Delhi', { align: 'center' });

            doc.moveDown(1);

            // Tricolor footer bar
            const footerY = doc.page.height - 24;
            doc.rect(0, footerY, doc.page.width, 8).fill('#FF9933');
            doc.rect(0, footerY + 8, doc.page.width, 8).fill('#FFFFFF');
            doc.rect(0, footerY + 16, doc.page.width, 8).fill('#138808');

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Generate social media share data.
 */
const generateShareData = (receiptData) => {
    const message = `🗳️ I just voted in ${receiptData.electionName || 'the election'}! I am a Proud Voter! 🇮🇳\n\nVoter #${receiptData.voterNumber}\nReceipt: ${receiptData.receiptId}\n\n#BharatVote #ProudVoter #IndianElection\n@ABORTECIINDIA`;

    return {
        text: message,
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(message)}`,
        whatsapp: `https://wa.me/?text=${encodeURIComponent(message)}`,
    };
};

module.exports = { generateReceiptPDF, generateShareData };
