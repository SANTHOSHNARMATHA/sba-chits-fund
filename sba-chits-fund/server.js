/**
 * SBA CHITS & FUND PRIVATE LIMITED - Public Website Server
 *
 * - Serves the public marketing website from /public
 * - Exposes /api/enroll for customer form submissions
 * - On submission: appends to internal Excel + emails admin
 *
 * Run with:   npm install   then   npm start
 */

require('dotenv').config();

const express     = require('express');
const path        = require('path');
const cors        = require('cors');
const bodyParser  = require('body-parser');

const enrollRoute        = require('./routes/enroll');
const { initializeWorkbook } = require('./utils/excelStore');
const { verifyTransporter }  = require('./utils/mailer');

const app  = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// ----- Middleware -----
app.use(cors());
app.use(bodyParser.json({ limit: '256kb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '256kb' }));

// Light security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Trust first proxy hop (useful behind Nginx / Render / Railway / etc.)
app.set('trust proxy', 1);

// ----- Static site -----
app.use(express.static(path.join(__dirname, 'public'), {
  index: 'index.html',
  maxAge: '1h',
}));

// ----- API -----
app.use('/api', enrollRoute);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'sba-chits-fund-website' });
});

// SPA-style fallback (also handles direct hash navigations)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ----- Error handler -----
app.use((err, req, res, next) => {
  console.error('[Server] Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error.' });
});

// ----- Boot -----
(async () => {
  await initializeWorkbook();          // create /data/customers.xlsx if missing
  await verifyTransporter();           // log SMTP status (non-fatal)

  app.listen(PORT, () => {
    console.log('========================================================');
    console.log(' SBA CHITS & FUND PRIVATE LIMITED - website is running');
    console.log(`  Local URL : http://localhost:${PORT}`);
    console.log(`  Env       : ${process.env.NODE_ENV || 'development'}`);
    console.log(`  Admin     : ${process.env.ADMIN_EMAIL || '(not set)'}`);
    console.log('========================================================');
  });
})();
