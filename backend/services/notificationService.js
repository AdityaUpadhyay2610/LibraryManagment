// backend/services/notificationService.js
// Scheduled task service (node-cron) for automated library notifications:
// 1. Daily overdue notices at 10:00 AM
// 2. Upcoming due date reminders (due within 2 days)

const cron = require('node-cron');
const { pool } = require('../db/pool');
const emailService = require('./emailService');
const fineService = require('./fineService');

/**
 * Checks for overdue loans and upcoming due dates, sending email notifications.
 * Can be run manually with `npm run notify:test` or automatically by cron.
 */
async function sendNotifications() {
  console.log('[NOTIFICATION SERVICE] Checking for overdue and upcoming loans...');

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
    let overdueCount = 0;
    let reminderCount = 0;

    for (const t of activeTransactions) {
      const dueDate = new Date(t.due_date);

      // Check 1: Overdue Books
      if (dueDate.getTime() < now.getTime()) {
        overdueCount += 1;
        const { daysLate, fine } = fineService.calculateFine(dueDate, now);

        if (t.email) {
          const subject = `⚠️ URGENT: Overdue Book Notice - ${t.title}`;
          const body = `Dear ${t.full_name || t.username},\n\n` +
            `This is an automated reminder that the following book issued to your account is now OVERDUE.\n\n` +
            `📖 OVERDUE ITEM DETAILS\n` +
            `-----------------------------------------------------\n` +
            `Title         : ${t.title}\n` +
            `Author        : ${t.author || 'N/A'}\n` +
            `Due Date      : ${dueDate.toDateString()}\n` +
            `Days Overdue  : ${daysLate} days\n` +
            `Estimated Fine: ₹${fine.toFixed(2)}\n` +
            `-----------------------------------------------------\n\n` +
            `⚠️ ACTION REQUIRED\n` +
            `Please return this book to the library immediately to avoid further penalties.\n` +
            `Note: Fines will continue to accumulate for every additional day.\n\n` +
            `If you have already returned this book, please contact the library admin immediately.\n\n` +
            `Best Regards,\n` +
            `Library Management System`;

          await emailService.sendEmail(t.email, subject, body);
        }
      }
      // Check 2: Due in 2 Days Reminder
      else {
        const diffMs = dueDate.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours > 0 && diffHours <= 48) {
          reminderCount += 1;
          if (t.email) {
            const subject = `⏰ Reminder: "${t.title}" is due in 2 days`;
            const body = `Dear ${t.full_name || t.username},\n\n` +
              `This is a friendly reminder that "${t.title}" is due on ${dueDate.toDateString()}.\n` +
              `You may return the book on time or renew it online from your student dashboard if you need more time.\n\n` +
              `Best Regards,\n` +
              `Library Management System`;

            await emailService.sendEmail(t.email, subject, body);
          }
        }
      }
    }

    console.log(`[NOTIFICATION SERVICE] Finished processing: ${overdueCount} overdue notices, ${reminderCount} reminders sent.`);
  } catch (err) {
    console.error('[NOTIFICATION SERVICE ERROR] Failed to send notifications:', err.message);
  }
}

/**
 * Starts the daily node-cron schedule (runs at 10:00 AM every day).
 */
function startScheduledJobs() {
  // Cron expression: "0 10 * * *" = 10:00 AM daily
  cron.schedule('0 10 * * *', () => {
    console.log('[CRON] Running daily overdue and reminder notifications at 10:00 AM...');
    sendNotifications();
  });
  console.log('[NOTIFICATION SERVICE] Daily overdue reminder cron job scheduled for 10:00 AM.');
}

module.exports = {
  sendNotifications,
  startScheduledJobs,
};
