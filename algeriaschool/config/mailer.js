const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const { createLogger } = require('./logger');
const logger = createLogger('mailer');

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  if (process.env.MAIL_LOG_ONLY === 'true') {
    transporter = nodemailer.createTransport({ jsonTransport: true });
  } else {
    transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: parseInt(process.env.MAIL_PORT) || 587,
      secure: process.env.MAIL_SECURE === 'true',
      auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
    });
  }
  return transporter;
}

async function sendMail({ to, subject, html, text }) {
  const from = process.env.MAIL_FROM || 'AlgeriaSchool <noreply@algeriaschool.com>';
  const mailOptions = { from, to, subject, html, text };

  if (process.env.MAIL_LOG_ONLY === 'true') {
    logger.info(`[EMAIL] To: ${to} | Subject: ${subject}`);
    const emailDir = '/tmp/emails';
    if (!fs.existsSync(emailDir)) fs.mkdirSync(emailDir, { recursive: true });
    const filename = path.join(emailDir, `${Date.now()}-${to.replace(/[@.]/g, '_')}.html`);
    fs.writeFileSync(filename, `<h2>${subject}</h2>\n${html || text}`);
    logger.info(`Email saved to ${filename}`);
    return { messageId: 'log-only-' + Date.now() };
  }

  const info = await getTransporter().sendMail(mailOptions);
  logger.info(`Email sent: ${info.messageId}`);
  return info;
}

module.exports = { sendMail };
