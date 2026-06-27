/**
 * SBA CHITS & FUND PRIVATE LIMITED - tiny static + enrollment server.
 *
 * Zero dependencies (pure Node.js built-ins). Its only jobs are:
 *   1. Serve the static website (index.html, css, js, images).
 *   2. Expose POST /api/enroll which APPENDS each submission as a new
 *      JSON object to data/enrollment.json.
 *
 * There is NO email sending and NO Excel here - the browser opens the
 * user's mail client itself after this server confirms the save.
 *
 * Run with:   node server.js     (or  npm start)
 */

'use strict';

const http = require('http');
const fs   = require('fs');
const path = require('path');

const ROOT      = __dirname;
const DATA_DIR  = path.join(ROOT, 'data');
const DATA_FILE = path.join(DATA_DIR, 'enrollment.json');
const PORT      = parseInt(process.env.PORT || '3000', 10);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

// ---- Ensure data/enrollment.json exists as an empty array ----
function ensureDataFile () {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]\n', 'utf8');
}

function readRecords () {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8').trim();
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (_) {
    return [];
  }
}

// ---- Validation helpers (mirror the form's client-side rules) ----
function sanitize (value, maxLen = 500) {
  if (value === null || value === undefined) return '';
  return String(value).trim().slice(0, maxLen);
}
function isValidEmail (email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function isValidIndianPhone (phone) {
  const digits = String(phone).replace(/\D/g, '');
  return /^(91)?[6-9]\d{9}$/.test(digits) || /^[6-9]\d{9}$/.test(digits);
}

function sendJson (res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

// ---- POST /api/enroll : append one record to data/enrollment.json ----
function handleEnroll (req, res) {
  let raw = '';
  let tooBig = false;
  req.on('data', (chunk) => {
    raw += chunk;
    if (raw.length > 262144) { tooBig = true; req.destroy(); } // 256kb cap
  });
  req.on('end', () => {
    if (tooBig) return sendJson(res, 413, { success: false, error: 'Payload too large.' });

    let body;
    try { body = JSON.parse(raw || '{}'); }
    catch (_) { return sendJson(res, 400, { success: false, error: 'Invalid JSON.' }); }

    // Honeypot: real users leave this empty.
    if (sanitize(body._company, 100)) {
      return sendJson(res, 400, { success: false, error: 'Submission rejected.' });
    }

    const data = {
      fullName:       sanitize(body.fullName, 120),
      phone:          sanitize(body.phone, 20),
      email:          sanitize(body.email, 160).toLowerCase(),
      age:            sanitize(body.age, 3),
      occupation:     sanitize(body.occupation, 80),
      monthlyIncome:  sanitize(body.monthlyIncome, 40),
      address:        sanitize(body.address, 400),
      city:           sanitize(body.city, 80),
      state:          sanitize(body.state, 80),
      pincode:        sanitize(body.pincode, 10),
      scheme:         sanitize(body.scheme, 80),
      chitValue:      sanitize(body.chitValue, 40),
      duration:       sanitize(body.duration, 20),
      referralSource: sanitize(body.referralSource, 80),
      message:        sanitize(body.message, 2000),
    };

    const errors = [];
    if (!data.fullName) errors.push('Full name is required.');
    if (!data.phone)    errors.push('Phone number is required.');
    if (!data.email)    errors.push('Email address is required.');
    if (!data.address)  errors.push('Address is required.');
    if (!data.city)     errors.push('City is required.');
    if (data.email && !isValidEmail(data.email)) errors.push('Please provide a valid email address.');
    if (data.phone && !isValidIndianPhone(data.phone)) errors.push('Please provide a valid 10-digit Indian phone number.');
    if (data.age && (!/^\d+$/.test(data.age) || Number(data.age) < 18 || Number(data.age) > 99)) errors.push('Age must be between 18 and 99.');
    if (data.pincode && !/^\d{6}$/.test(data.pincode)) errors.push('Pincode must be a 6-digit number.');
    if (errors.length) return sendJson(res, 400, { success: false, error: errors.join(' ') });

    // ---- Append to data/enrollment.json ----
    try {
      const records    = readRecords();
      const customerId  = `SBA-${String(records.length + 1).padStart(5, '0')}`;
      const submittedOn = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: true,
      });

      const record = Object.assign({ customerId, submittedOn }, data);
      records.push(record);
      fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2) + '\n', 'utf8');

      console.log(`[Enroll] Saved ${customerId} -> ${data.fullName} (total: ${records.length})`);
      return sendJson(res, 200, { success: true, customerId, record });
    } catch (err) {
      console.error('[Enroll] Failed to save:', err);
      return sendJson(res, 500, { success: false, error: 'Could not save your details. Please try again.' });
    }
  });
}

// ---- Static file serving (safe, confined to ROOT) ----
function serveStatic (req, res) {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.normalize(path.join(ROOT, urlPath));
  // Prevent directory traversal outside ROOT.
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); return res.end('Forbidden');
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not found');
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(content);
  });
}

// ---- Server ----
ensureDataFile();

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/enroll') {
    return handleEnroll(req, res);
  }
  if (req.method === 'GET' && req.url === '/api/health') {
    return sendJson(res, 200, { status: 'ok', service: 'sba-chits-fund-website' });
  }
  if (req.method === 'GET') {
    return serveStatic(req, res);
  }
  res.writeHead(405, { 'Content-Type': 'text/plain' });
  res.end('Method not allowed');
});

server.listen(PORT, () => {
  console.log('========================================================');
  console.log(' SBA CHITS & FUND PRIVATE LIMITED - website is running');
  console.log(`  Local URL : http://localhost:${PORT}`);
  console.log(`  Data file : ${DATA_FILE}`);
  console.log('========================================================');
});
