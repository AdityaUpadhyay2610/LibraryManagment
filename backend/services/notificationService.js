const cron = require('node-cron');
const { pool } = require('../db/pool');
const emailService = require('./emailService');
const fineService = require('./fineService');

async function sendNotifications() {
  try {
    const query = `
      SELECT t.*, u.full_name, u.email, u.username, b.title, b.author
      FROM "transaction" t
      JOIN app_user u ON t.student_id = u.id
      JOIN book b ON t.book_id = b.id
      WHERE t.return_date IS NULL
    `;
    const res = await pool.query(query);
    const activeTransactions = res.rows;

    const now = new Date();

    for (const t of activeTransactions) {
      const dueDate = new Date(t.due_date);

      // overdue check
      if (dueDate.getTime() < now.getTime()) {
        const { daysLate, fine } = fineService.calculateFine(dueDate, now);

        if (t.email) {
          const subject = `Overdue Book Notice - ${t.title}`;
          const body = `Dear ${t.full_name || t.username},\n\n` +
            `This is a reminder that the following book is overdue:\n\n` +
            `Title: ${t.title}\n` +
            `Author: ${t.author || 'N/A'}\n` +
            `Due Date: ${dueDate.toDateString()}\n` +
            `Days Overdue: ${daysLate}\n` +
            `Estimated Fine: ₹${fine.toFixed(2)}\n\n` +
            `Please return this book to the library as soon as possible.\n\n` +
            `Library Management System`;

          await emailService.sendEmail(t.email, subject, body);
        }
      }
      // reminder if due within 2 days
      else {
        const diffMs = dueDate.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours > 0 && diffHours <= 48) {
          if (t.email) {
            const subject = `Reminder: "${t.title}" is due in 2 days`;
            const body = `Dear ${t.full_name || t.username},\n\n` +
              `This is a friendly reminder that "${t.title}" is due on ${dueDate.toDateString()}.\n` +
              `You can return it on time or renew it from your student dashboard.\n\n` +
              `Library Management System`;

            await emailService.sendEmail(t.email, subject, body);
          }
        }
      }
    }
  } catch (err) {
    console.error('Failed to send scheduled notifications:', err.message);
  }
}

function startScheduledJobs() {
  // run daily at 10:00 AM
  cron.schedule('0 10 * * *', () => {
    sendNotifications();
  });
}

module.exports = {
  sendNotifications,
  startScheduledJobs,
};
