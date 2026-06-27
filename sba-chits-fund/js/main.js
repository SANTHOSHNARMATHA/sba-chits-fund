/* ============================================================
   SBA Chits & Fund - Frontend Logic
   - Sticky header shadow on scroll
   - Mobile menu toggle
   - Scroll reveal animations
   - Enrollment form:
       1. Capture all form details
       2. Send them to the server, which appends the record to
          data/enrollment.json  (no file is downloaded)
       3. Open the default mail app with the email pre-filled from
          the built-in email template
   ============================================================ */

(function () {
  'use strict';

  // ---- Configuration ----
  // Where enrollment notifications should be addressed.
  const ADMIN_EMAIL = 'sbachitsfund@gmail.com';

  // ---- Year in footer ----
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---- Sticky header shadow ----
  const header = document.getElementById('siteHeader');
  const onScroll = () => {
    if (!header) return;
    if (window.scrollY > 8) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---- Mobile menu toggle ----
  const navToggle = document.getElementById('navToggle');
  const drawer    = document.getElementById('mobileDrawer');
  if (navToggle && drawer) {
    navToggle.addEventListener('click', () => {
      const open = drawer.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    });
    drawer.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        drawer.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        drawer.setAttribute('aria-hidden', 'true');
      });
    });
  }

  // ---- Scroll reveal ----
  const revealEls = document.querySelectorAll(
    '.hero__copy, .hero__card, .section__head, .svc-card, .how-steps li, .why-list li, .scheme-table, .leadership__photo-wrap, .leadership__body, .enroll__intro, .enroll-form, .contact__card'
  );
  revealEls.forEach((el) => el.classList.add('reveal'));

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  // ---- Enrollment form ----
  const form       = document.getElementById('enrollForm');
  const submitBtn  = document.getElementById('submitBtn');
  const statusBox  = document.getElementById('formStatus');

  if (!form) return;

  // ---- Auto-fill Chit Value & Duration from the selected scheme ----
  // Figures mirror the "Sample Chit Schemes" table in index.html.
  const SCHEME_DEFAULTS = {
    'SBA Saver 25'   : { chitValue: '1,00,000',  duration: '25 months' },
    'SBA Classic 30' : { chitValue: '3,00,000',  duration: '30 months' },
    'SBA Trader 40'  : { chitValue: '5,00,000',  duration: '40 months' },
    'SBA Business 50': { chitValue: '10,00,000', duration: '50 months' },
    'SBA Premium 60' : { chitValue: '25,00,000', duration: '60 months' },
  };

  const schemeSelect   = form.querySelector('select[name="scheme"]');
  const chitValueInput = form.querySelector('input[name="chitValue"]');
  const durationSelect = form.querySelector('select[name="duration"]');

  if (schemeSelect && chitValueInput && durationSelect) {
    schemeSelect.addEventListener('change', () => {
      const preset = SCHEME_DEFAULTS[schemeSelect.value];
      if (preset) {
        chitValueInput.value = preset.chitValue;
        durationSelect.value = preset.duration;
      } else {
        // "Not sure yet" or "Other / Custom" - clear for manual entry.
        chitValueInput.value = '';
        durationSelect.value = '';
      }
    });
  }

  function setStatus (type, html) {
    statusBox.className = 'enroll-form__status';
    statusBox.classList.add(type === 'success' ? 'is-success' : 'is-error');
    statusBox.innerHTML = html;
  }

  function clearStatus () {
    statusBox.className = 'enroll-form__status';
    statusBox.innerHTML = '';
  }

  function setLoading (loading) {
    if (loading) {
      submitBtn.classList.add('is-loading');
      submitBtn.disabled = true;
    } else {
      submitBtn.classList.remove('is-loading');
      submitBtn.disabled = false;
    }
  }

  function collectFormData () {
    const fd = new FormData(form);
    const data = {};
    fd.forEach((v, k) => { data[k] = typeof v === 'string' ? v.trim() : v; });
    return data;
  }

  // ---- Email body built from the built-in email template ----
  // (mailto: links can only carry plain text, not HTML.)
  function buildEmailBody (customerId, data) {
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
      'This enrollment was captured via the SBA Chits & Fund company website.',
      'CIN: U64990TZ2026PTC038770',
    ];
    return lines.join('\n');
  }

  function openMailApp (customerId, data) {
    const subject = `New Customer Enrollment - ${data.fullName || customerId} [${customerId}]`;
    const body    = buildEmailBody(customerId, data);
    const mailto =
      `mailto:${encodeURIComponent(ADMIN_EMAIL)}` +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;
    // Navigating to a mailto: hands off to the OS mail app without
    // unloading the page.
    window.location.href = mailto;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearStatus();

    // Native HTML5 validation pass (covers required fields + consent box).
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = collectFormData();
    setLoading(true);

    try {
      // 1 & 2. Send to the server, which appends the record to
      //        data/enrollment.json and returns the assigned Customer ID.
      const res = await fetch('/api/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      let payload = {};
      try { payload = await res.json(); } catch (_) { /* non-JSON */ }

      if (!res.ok || !payload.success) {
        const msg = (payload && payload.error)
          ? payload.error
          : 'Something went wrong while saving your details. Please try again or call us directly.';
        setStatus('error', `<strong>Submission failed.</strong>${msg}`);
        setLoading(false);
        return;
      }

      const customerId = payload.customerId;

      setStatus(
        'success',
        `<strong>Thank you! Your enrollment was saved.</strong>
         Your reference ID is <code style="font-weight:700">${customerId}</code>.
         Your email app is opening with the message ready to send.`
      );

      form.reset();
      // Keep the default state value
      const stateInput = form.querySelector('input[name="state"]');
      if (stateInput) stateInput.value = 'Tamil Nadu';
      setLoading(false);
      statusBox.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // 3. Open the default mail app pre-filled from the email template.
      openMailApp(customerId, data);
    } catch (err) {
      console.error('Submit error', err);
      setStatus(
        'error',
        `<strong>Network error.</strong>We could not reach the server. Please make sure the site is running, then try again, or call us on +91 98947 63248.`
      );
      setLoading(false);
    }
  });
})();
