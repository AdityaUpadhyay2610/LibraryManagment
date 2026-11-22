// backend/services/emailService.js
// Handles sending email notifications using nodemailer.
// If email credentials are not set, it logs to the console without throwing errors.

const nodemailer = require('nodemailer');
const config = require('../config');

let transporter = null;

if (config.MAIL_USER && config.MAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.MAIL_USER,
      pass: config.MAIL_PASS,
    },
  });
  console.log('[EMAIL SERVICE] Gmail transporter configured for:', config.MAIL_USER);
} else {
  console.log('[EMAIL SERVICE] No email credentials in config (MAIL_USER/MAIL_PASS). Email sending will be logged to console.');
}

/**
 * Sends an email notification.
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject line
 * @param {string} text - Plain text body
 * @param {string|null} html - Optional HTML body
 */
async function sendEmail(to, subject, text, html = null) {
  if (!to) {
    console.warn('[EMAIL SERVICE] Skipping email: recipient address is empty.');
    return;
  }

  // If no SMTP credentials are configured, log to console in dev mode
  if (!transporter) {
    console.log(`\n--- [SIMULATED EMAIL] ---`);
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${text}`);
    console.log(`-------------------------\n`);
    return;
  }

  try {
    const mailOptions = {
      from: `"Library Management System" <${config.MAIL_USER}>`,
      to,
      subject,
      text,
      html: html || undefined,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL SERVICE] Email successfully sent to ${to} (MessageId: ${info.messageId})`);
  } catch (err) {
    // Log the error but DO NOT throw, so library transactions (issue/return) still succeed
    console.error(`[EMAIL SERVICE ERROR] Failed to send email to ${to}:`, err.message);
  }
}

module.exports = {
  sendEmail,
};
