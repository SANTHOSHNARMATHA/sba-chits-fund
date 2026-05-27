/**
 * Email notification utility for SBA Chits & Fund Private Limited.
 *
 * Sends a formatted HTML + plain-text email to the admin
 * whenever a new customer submits the enrollment form.
 *
 * IMPORTANT: The customer Excel file is NEVER attached.
 * The email body contains the customer details and description only.
 */

const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter () {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST || 'smtp.gmail.com',
    port:   parseInt(process.env.SMTP_PORT || '587', 10),
    secure: (process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

/**
 * Verify SMTP configuration on server startup.
 * Logs a warning if credentials are missing/invalid – but
 * does NOT crash the server (customer submissions will still
 * be saved to Excel even if email fails).
 */
async function verifyTransporter () {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[Email] SMTP_USER / SMTP_PASS not configured. Email notifications are DISABLED.');
    return false;
  }
  try {
    await getTransporter().verify();
    console.log('[Email] SMTP transporter verified – ready to send notifications.');
    return true;
  } catch (err) {
    console.warn('[Email] SMTP verification failed:', err.message);
    return false;
  }
}

function escapeHtml (str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;');
}

function buildHtmlBody (customerId, data) {
  const rows = [
    ['Customer ID',         customerId],
    ['Full Name',           data.fullName],
    ['Phone Number',        data.phone],
    ['Email Address',       data.email],
    ['Age',                 data.age],
    ['Occupation',          data.occupation],
    ['Monthly Income',      data.monthlyIncome],
    ['Address',             data.address],
    ['City',                data.city],
    ['State',               data.state],
    ['Pincode',             data.pincode],
    ['Interested Scheme',   data.scheme],
    ['Chit Value (INR)',    data.chitValue],
    ['Duration (months)',   data.duration],
    ['Heard About Us Via',  data.referralSource],
  ];

  const tableRows = rows
    .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '')
    .map(([label, value]) => `
        <tr>
          <td style="padding:10px 14px;border-bottom:1px solid #e8ecf2;font-weight:600;color:#0a2540;width:200px;background:#f7f9fc;">${escapeHtml(label)}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e8ecf2;color:#1a1a1a;">${escapeHtml(value)}</td>
        </tr>`)
    .join('');

  const message = data.message && String(data.message).trim()
    ? `
      <h3 style="font-family:Georgia,serif;color:#0a2540;margin:28px 0 10px;font-size:17px;border-left:3px solid #c89b3c;padding-left:10px;">
        Description / Message from Customer
      </h3>
      <p style="background:#fffaf0;padding:14px 16px;border-radius:6px;border:1px solid #f0e3c4;color:#3a3a3a;line-height:1.6;margin:0;white-space:pre-wrap;">${escapeHtml(data.message)}</p>`
    : '';

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f6fa;font-family:'Segoe UI',Tahoma,Arial,sans-serif;color:#1a1a1a;">
  <div style="max-width:680px;margin:24px auto;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 4px 22px rgba(10,37,64,0.08);">
    <div style="background:linear-gradient(135deg,#0a2540 0%,#13386b 100%);padding:28px 32px;color:#ffffff;">
      <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#c89b3c;font-weight:600;">New Customer Enrollment</div>
      <h1 style="font-family:Georgia,serif;font-size:24px;margin:6px 0 0;font-weight:600;">SBA Chits &amp; Fund Private Limited</h1>
      <div style="font-size:13px;color:#cfd8e3;margin-top:4px;">Website enrollment form submission</div>
    </div>

    <div style="padding:28px 32px;">
      <p style="margin:0 0 18px;color:#3a3a3a;font-size:15px;line-height:1.6;">
        A new customer has submitted their details through the company website.
        Below are the complete details for your review and follow-up.
      </p>

      <table style="width:100%;border-collapse:collapse;font-size:14px;border:1px solid #e8ecf2;border-radius:6px;overflow:hidden;">
        ${tableRows}
      </table>

      ${message}

      <div style="margin-top:28px;padding-top:18px;border-top:1px dashed #d8dee8;font-size:12px;color:#7a8597;line-height:1.6;">
        This is an automated notification from the SBA Chits &amp; Fund company website.
        The complete customer record has been saved to the internal Excel register.
      </div>
    </div>

    <div style="background:#0a2540;color:#9fb2ca;padding:14px 32px;font-size:12px;text-align:center;">
      SBA CHITS &amp; FUND PRIVATE LIMITED &nbsp;|&nbsp; CIN: U64990TZ2026PTC038770
    </div>
  </div>
</body>
</html>`;
}

function buildTextBody (customerId, data) {
  const lines = [
    'NEW CUSTOMER ENROLLMENT - SBA CHITS & FUND PRIVATE LIMITED',
    '=========================================================',
    '',
    `Customer ID       : ${customerId}`,
    `Full Name         : ${data.fullName || '-'}`,
    `Phone Number      : ${data.phone || '-'}`,
    `Email Address     : ${data.email || '-'}`,
    `Age               : ${data.age || '-'}`,
    `Occupation        : ${data.occupation || '-'}`,
    `Monthly Income    : ${data.monthlyIncome || '-'}`,
    `Address           : ${data.address || '-'}`,
    `City              : ${data.city || '-'}`,
    `State             : ${data.state || '-'}`,
    `Pincode           : ${data.pincode || '-'}`,
    `Interested Scheme : ${data.scheme || '-'}`,
    `Chit Value (INR)  : ${data.chitValue || '-'}`,
    `Duration (months) : ${data.duration || '-'}`,
    `Heard Us Via      : ${data.referralSource || '-'}`,
    '',
    'Description / Message:',
    '----------------------',
    (data.message && String(data.message).trim()) ? data.message : '(none)',
    '',
    '---',
    'This is an automated notification from the SBA Chits & Fund company website.',
    'CIN: U64990TZ2026PTC038770',
  ];
  return lines.join('\n');
}

/**
 * Send the admin notification email for one customer enrollment.
 * Returns { ok: true } on success and { ok: false, error } on failure.
 */
async function sendAdminNotification (customerId, data) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return { ok: false, error: 'SMTP not configured' };
  }

  const fromName = process.env.SMTP_FROM_NAME || 'SBA Chits & Fund - Website';
  const fromAddr = process.env.SMTP_USER;
  const toAddr   = process.env.ADMIN_EMAIL || 'sbachitsfund@gmail.com';

  const subject = `New Customer Enrollment - ${data.fullName || customerId} [${customerId}]`;

  try {
    const info = await getTransporter().sendMail({
      from:    `"${fromName}" <${fromAddr}>`,
      to:      toAddr,
      replyTo: data.email || undefined,
      subject,
      text:    buildTextBody(customerId, data),
      html:    buildHtmlBody(customerId, data),
      // NOTE: No attachments. The Excel file is internal-only.
    });
    console.log(`[Email] Sent admin notification for ${customerId} (messageId=${info.messageId})`);
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Email] Failed to send notification for ${customerId}:`, err.message);
    return { ok: false, error: err.message };
  }
}

module.exports = {
  verifyTransporter,
  sendAdminNotification,
};
