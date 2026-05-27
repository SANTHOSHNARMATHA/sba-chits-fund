/**
 * /api/enroll - accept customer enrollment submissions.
 *
 * Flow:
 *   1. Validate required fields & basic formats.
 *   2. Save the record into the internal Excel workbook.
 *   3. Send an HTML email notification to the admin (best-effort).
 *   4. Respond to the website with the assigned Customer ID.
 */

const express = require('express');
const rateLimit = require('express-rate-limit');

const { appendCustomer } = require('../utils/excelStore');
const { sendAdminNotification } = require('../utils/mailer');

const router = express.Router();

// Throttle: max 5 enrollments per IP per 10 minutes to deter spam.
const enrollLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many submissions from this network. Please try again after a few minutes.',
  },
});

function sanitize (value, maxLen = 500) {
  if (value === null || value === undefined) return '';
  return String(value).trim().slice(0, maxLen);
}

function isValidEmail (email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidIndianPhone (phone) {
  // 10-digit (optional +91 / 0 prefix). We strip non-digits first.
  const digits = phone.replace(/\D/g, '');
  return /^(91)?[6-9]\d{9}$/.test(digits) || /^[6-9]\d{9}$/.test(digits);
}

router.post('/enroll', enrollLimiter, async (req, res) => {
  try {
    const body = req.body || {};

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
      // anti-spam honeypot
      _company:       sanitize(body._company, 100),
    };

    // Honeypot: a hidden input bots tend to fill. Real users leave it empty.
    if (data._company) {
      return res.status(400).json({ success: false, error: 'Submission rejected.' });
    }

    // ---- Required field validation ----
    const errors = [];
    if (!data.fullName)   errors.push('Full name is required.');
    if (!data.phone)      errors.push('Phone number is required.');
    if (!data.email)      errors.push('Email address is required.');
    if (!data.address)    errors.push('Address is required.');
    if (!data.city)       errors.push('City is required.');

    if (data.email && !isValidEmail(data.email)) {
      errors.push('Please provide a valid email address.');
    }
    if (data.phone && !isValidIndianPhone(data.phone)) {
      errors.push('Please provide a valid 10-digit Indian phone number.');
    }
    if (data.age && (!/^\d+$/.test(data.age) || Number(data.age) < 18 || Number(data.age) > 99)) {
      errors.push('Age must be a number between 18 and 99.');
    }
    if (data.pincode && !/^\d{6}$/.test(data.pincode)) {
      errors.push('Pincode must be a 6-digit number.');
    }

    if (errors.length) {
      return res.status(400).json({ success: false, error: errors.join(' ') });
    }

    // strip honeypot from stored data
    delete data._company;

    // ---- Persist to Excel ----
    const { customerId } = await appendCustomer(data);

    // ---- Email admin (non-blocking on user response time) ----
    // We await it so we can log success/failure, but we don't fail
    // the request if email fails – the record is already saved.
    const emailResult = await sendAdminNotification(customerId, data);

    return res.status(200).json({
      success: true,
      customerId,
      emailSent: emailResult.ok,
      message:
        'Thank you for enrolling with SBA Chits & Fund Private Limited. ' +
        'Our team will contact you shortly using the details you provided.',
    });
  } catch (err) {
    console.error('[Enroll] Error processing submission:', err);
    return res.status(500).json({
      success: false,
      error: 'Sorry, we could not process your submission right now. Please try again or call us directly.',
    });
  }
});

module.exports = router;
