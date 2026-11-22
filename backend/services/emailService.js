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
}

async function sendEmail(to, subject, text, html = null) {
  if (!to) return;

  // in dev without smtp credentials, just log
  if (!transporter) {
    console.log(`[simulated email] to: ${to} | subject: ${subject}`);
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

    await transporter.sendMail(mailOptions);
  } catch (err) {
    // don't throw so transactions still complete
    console.error(`failed to send email to ${to}:`, err.message);
  }
}

module.exports = {
  sendEmail,
};
