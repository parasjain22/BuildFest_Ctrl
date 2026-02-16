const nodemailer = require('nodemailer');

/**
 * Create email transporter.
 * In development, logs to console instead of sending.
 */
const createTransporter = () => {
    if (process.env.NODE_ENV === 'development' || !process.env.EMAIL_HOST) {
        // Dev mode: log emails to console
        return {
            sendMail: async (options) => {
                console.log('📧 [DEV] Email would be sent:');
                console.log(`   To: ${options.to}`);
                console.log(`   Subject: ${options.subject}`);
                return { messageId: 'dev-' + Date.now() };
            },
        };
    }

    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
};

/**
 * Send vote receipt email to the voter.
 */
const sendReceiptEmail = async (toEmail, receiptData, pdfBuffer) => {
    const transporter = createTransporter();

    const mailOptions = {
        from: process.env.EMAIL_FROM || 'BharatVote <noreply@bharatvote.in>',
        to: toEmail,
        subject: `🗳️ Your BharatVote Receipt - ${receiptData.receiptId}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #FF9933, #fff, #138808); padding: 4px;">
          <div style="background: #1a1a2e; padding: 24px; text-align: center;">
            <h1 style="color: #fff; margin: 0;">🗳️ BharatVote</h1>
            <p style="color: #aaa; margin: 4px 0;">Secure Digital Voting System</p>
          </div>
        </div>
        <div style="padding: 24px; background: #fff;">
          <h2 style="color: #FF9933;">I am a Proud Voter! 🇮🇳</h2>
          <p>Your vote has been successfully cast and encrypted.</p>
          <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>Receipt ID:</strong> ${receiptData.receiptId}</p>
            <p><strong>Voter #:</strong> ${receiptData.voterNumber}</p>
            <p><strong>Timestamp:</strong> ${new Date(receiptData.timestamp).toLocaleString('en-IN')}</p>
          </div>
          <p style="color: #138808; font-size: 13px;">
            🔒 Your receipt PDF is attached. This proves your vote was counted but does NOT reveal your choice.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            With regards,<br>
            Election Commission of India<br>
            Nirvachan Sadan, New Delhi
          </p>
        </div>
      </div>
    `,
        attachments: pdfBuffer
            ? [{ filename: `BharatVote-Receipt-${receiptData.receiptId}.pdf`, content: pdfBuffer }]
            : [],
    };

    return transporter.sendMail(mailOptions);
};

module.exports = { sendReceiptEmail };
