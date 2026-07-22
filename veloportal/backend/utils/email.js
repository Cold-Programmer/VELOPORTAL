const nodemailer = require('nodemailer');

// ---------------------------------------------------------------------------
// SMTP configuration
// ---------------------------------------------------------------------------
// All credentials come from environment variables — never hardcode them.
// Supported providers (set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS):
//   - Gmail:     host=smtp.gmail.com port=587 (use an App Password, not your Gmail password)
//   - Outlook:   host=smtp.office365.com port=587
//   - SendGrid:  host=smtp.sendgrid.net port=587, user=apikey, pass=<SG.KEY>
//   - Brevo:     host=smtp-relay.brevo.com port=587
//   - Mailjet:   host=in-v3.mailjet.com port=587
// See README section "Setting up email" for step-by-step instructions.
// ---------------------------------------------------------------------------

function createTransport() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
    port:   Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true', // true only for port 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Anti-spam / deliverability settings
    // pool: true keeps a connection alive across multiple sends
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    // TLS settings — avoids self-signed certificate failures on some hosts
    tls: { rejectUnauthorized: process.env.NODE_ENV === 'production' },
  });
}

const FROM_NAME  = process.env.EMAIL_FROM_NAME  || 'VeloPortal';
const FROM_EMAIL = process.env.EMAIL_FROM_ADDR  || process.env.SMTP_USER || 'noreply@veloportal.app';
const APP_URL    = process.env.CLIENT_URL        || 'http://localhost:5173';

// ---------------------------------------------------------------------------
// Shared HTML email shell — plain, text-heavy design that renders well in
// Gmail, Outlook, Apple Mail, and dark mode without rendering issues.
// Anti-spam best practices:
//   • Uses a real From address (same domain as your site in production)
//   • Has a plain-text alternative (nodemailer sends multipart/alternative)
//   • Includes an unsubscribe note (required by CAN-SPAM / GDPR)
//   • Contains no spammy words in subject lines
// ---------------------------------------------------------------------------
function wrap(content, { title = 'VeloPortal' } = {}) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="color-scheme" content="light dark"/>
<title>${title}</title>
<style>
  body { font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background: #F4F3EE; color: #1C1C1A; }
  .wrap { max-width: 580px; margin: 0 auto; padding: 32px 16px; }
  .card { background: #fff; border-radius: 20px; padding: 40px; border: 1px solid #E9E8E1; }
  .logo { font-size: 20px; font-weight: 700; color: #16382A; margin-bottom: 32px; display: block; }
  .logo span { color: #C97F1C; }
  h1 { font-size: 22px; font-weight: 700; color: #1C1C1A; margin: 0 0 12px; }
  p { font-size: 15px; line-height: 1.65; color: #4A4A47; margin: 0 0 20px; }
  .btn { display: inline-block; background: #16382A; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 50px; font-weight: 600; font-size: 14px; margin: 8px 0 24px; }
  .code { display: block; background: #F4F3EE; border-radius: 12px; padding: 18px 20px; font-family: monospace; font-size: 15px; color: #16382A; font-weight: 700; letter-spacing: 2px; margin: 16px 0; }
  .divider { border: none; border-top: 1px solid #E9E8E1; margin: 28px 0; }
  .footer { font-size: 12px; color: #999994; margin-top: 24px; text-align: center; }
  .tag { display: inline-block; background: #f0f7f3; color: #16382A; padding: 3px 10px; border-radius: 50px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px; }
  @media (max-width: 600px) { .card { padding: 28px 20px; } }
  @media (prefers-color-scheme: dark) {
    body { background: #0A0F0C; }
    .card { background: #111813; border-color: rgba(255,255,255,.08); }
    h1 { color: #F1F1EE; }
    p { color: rgba(241,241,238,.65); }
    .code { background: #0A0F0C; color: #E8A33D; }
    .divider { border-color: rgba(255,255,255,.08); }
    .footer { color: rgba(241,241,238,.35); }
    .tag { background: rgba(22,56,42,.4); color: #E8A33D; }
  }
</style>
</head>
<body>
<div class="wrap">
  <div class="card">
    <a href="${APP_URL}" class="logo">🚲 Velo<span>Portal</span></a>
    ${content}
    <hr class="divider"/>
    <p class="footer">
      VeloPortal · KCA University, Nairobi<br/>
      <a href="${APP_URL}/dashboard" style="color:#16382A">Your dashboard</a> &nbsp;·&nbsp;
      You are receiving this because you have an account at VeloPortal.
    </p>
  </div>
</div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Email templates
// ---------------------------------------------------------------------------

async function sendWelcomeEmail({ to, name, verifyToken }) {
  if (!process.env.SMTP_USER) {
    console.log(`[email:welcome] Would send to ${to} — SMTP not configured, logging instead.`);
    console.log(`  Verification link: ${APP_URL}/api/auth/verify-email/${verifyToken}`);
    return;
  }

  const verifyUrl = `${APP_URL}/api/auth/verify-email/${verifyToken}`;
  const text = `
Welcome to VeloPortal, ${name}!

Confirm your email by visiting:
${verifyUrl}

If you did not create this account, you can safely ignore this message.

– The VeloPortal team
KCA University, Nairobi
`.trim();

  const html = wrap(`
    <span class="tag">Welcome aboard</span>
    <h1>Welcome to VeloPortal, ${name}! 🎉</h1>
    <p>Thanks for joining Nairobi's cycling community. Tap the button below to confirm your email address and activate your account.</p>
    <a href="${verifyUrl}" class="btn">Confirm my email</a>
    <p>Or paste this link into your browser:</p>
    <span class="code">${verifyUrl}</span>
    <p style="font-size:13px;color:#999">This link expires in 24 hours. If you didn't create a VeloPortal account, ignore this message — no action is needed.</p>
  `, { title: 'Confirm your VeloPortal account' });

  const transporter = createTransport();
  await transporter.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to,
    subject: 'Confirm your VeloPortal account',
    text,
    html,
    // Headers that improve deliverability and reduce spam scoring
    headers: {
      'List-Unsubscribe': `<mailto:unsubscribe@veloportal.app?subject=unsubscribe>`,
      'X-Mailer': 'VeloPortal',
      'Precedence': 'transactional',
    },
  });
  console.log(`[email:welcome] Sent to ${to}`);
}

async function sendPasswordResetEmail({ to, name, resetToken }) {
  const resetUrl = `${APP_URL}/reset-password/${resetToken}`;

  if (!process.env.SMTP_USER) {
    console.log(`[email:reset] Would send to ${to} — SMTP not configured.`);
    console.log(`  Reset link: ${resetUrl}`);
    return;
  }

  const text = `
Hi ${name},

You requested a password reset for your VeloPortal account.

Reset link (expires in 1 hour):
${resetUrl}

If you did not request this, ignore this email — your password has not changed.

– The VeloPortal team
`.trim();

  const html = wrap(`
    <span class="tag">Password reset</span>
    <h1>Reset your password</h1>
    <p>Hi ${name}, we received a request to reset the password for your VeloPortal account. Tap the button below to choose a new password.</p>
    <a href="${resetUrl}" class="btn">Reset my password</a>
    <p>Or paste this link into your browser:</p>
    <span class="code">${resetUrl}</span>
    <p style="font-size:13px;color:#999">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this.</p>
  `, { title: 'Reset your VeloPortal password' });

  const transporter = createTransport();
  await transporter.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to,
    subject: 'Reset your VeloPortal password',
    text,
    html,
    headers: {
      'Precedence': 'transactional',
      'X-Mailer': 'VeloPortal',
    },
  });
  console.log(`[email:reset] Sent to ${to}`);
}

async function sendOrderConfirmationEmail({ to, name, orderNumber, totalAmount, items }) {
  if (!process.env.SMTP_USER) {
    console.log(`[email:order] Would send receipt for ${orderNumber} to ${to}`);
    return;
  }

  const itemRows = items.map(i => `• ${i.name} × ${i.quantity}  —  KES ${(i.price * i.quantity).toLocaleString()}`).join('\n');
  const text = `Order confirmed: ${orderNumber}\n\n${itemRows}\n\nTotal: KES ${Number(totalAmount).toLocaleString()}`;
  const html = wrap(`
    <span class="tag">Order confirmed</span>
    <h1>Your order is placed, ${name}!</h1>
    <p>Order reference: <strong>${orderNumber}</strong></p>
    ${items.map(i => `<p>• ${i.name} × ${i.quantity}  —  KES ${(i.price * i.quantity).toLocaleString()}</p>`).join('')}
    <hr class="divider"/>
    <p><strong>Total: KES ${Number(totalAmount).toLocaleString()}</strong></p>
    <a href="${APP_URL}/dashboard" class="btn">View my orders</a>
    <p style="font-size:13px;color:#999">Payment via M-Pesa. Questions? Reply to this email.</p>
  `, { title: `Order ${orderNumber} confirmed` });

  const transporter = createTransport();
  await transporter.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to, subject: `Your VeloPortal order ${orderNumber} is confirmed`,
    text, html,
    headers: { 'Precedence': 'transactional' },
  });
}

module.exports = { sendWelcomeEmail, sendPasswordResetEmail, sendOrderConfirmationEmail };
