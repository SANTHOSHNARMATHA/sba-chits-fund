# SBA Chits & Fund Private Limited — Official Website

A website for **SBA CHITS & FUND PRIVATE LIMITED** (CIN: U64990TZ2026PTC038770),
a chit fund company registered in Tiruppur, Tamil Nadu.

The front-end is plain **HTML, CSS & JavaScript**. It is backed by a tiny
**zero-dependency Node server** (`server.js`) whose only jobs are to serve the
site and to **append each enrollment to `data/enrollment.json`**. There is
**no email sending and no Excel** — the browser opens the visitor's own mail
client after the data is saved.

---

## Features

- **Editorial, trust-driven public website** (navy + gold on warm cream paper)
- **Hero, About, Services, How-it-works, Why-Choose-Us, Sample Schemes,
  Leadership and Contact** sections
- **Customer Enrollment form** with validation and honeypot anti-spam
- **Enrollment capture:**
  1. Captures every detail the customer entered.
  2. Appends it as a new JSON object to **`data/enrollment.json`** (no file is
     downloaded to the visitor's device).
  3. Opens the visitor's **default mail application** with a new email
     pre-filled from the built-in email template, ready to send.
- Mobile-first responsive design

---

## Project Structure

```
sba-chits-fund/
├── server.js             # Tiny zero-dependency static + /api/enroll server
├── package.json
├── README.md
├── .gitignore
│
├── css/
│   └── style.css
│
├── js/
│   └── main.js           # All site logic + enrollment flow
│
├── images/
│   └── admin.jpg         # Managing Director photo
│
└── data/
    └── enrollment.json   # All enrollments are appended here (JSON array)
```

---

## How to run

No dependencies to install — the server uses only built-in Node modules.

```bash
cd sba-chits-fund
npm start          # or:  node server.js
```

Then open <http://localhost:3000> in your browser.

> Prefer a different port?  `PORT=5050 node server.js`
> In VS Code you can also use the *"Start SBA Chits Fund Server"* launch config.

---

## How the enrollment flow works

When a customer fills the **Enrollment Form** and clicks *Submit*:

1. **Capture** — `js/main.js` reads and validates every field, then sends them
   as JSON to `POST /api/enroll`.
2. **Save to JSON file** — the server validates again, assigns a sequential
   **Customer ID** (`SBA-00001`, `SBA-00002`, …) and a timestamp, and
   **appends the record to `data/enrollment.json`** as a new object in the
   array. Nothing is downloaded to the visitor's device.
3. **Open mail app** — once the server confirms the save, the browser opens the
   device's default email application with a new message **pre-filled** from the
   built-in template:
   - **To:** `sbachitsfund@gmail.com`
   - **Subject:** `New Customer Enrollment - <Name> [<Customer ID>]`
   - **Body:** all customer details laid out from the template.
   The admin simply reviews and clicks **Send**.

> Note: `mailto:` links can only carry **plain text**, so the email uses the
> plain-text version of the template (not a rich HTML layout).

### Where is the data?

**`data/enrollment.json`** — a JSON array. Each submission is one object, e.g.:

```json
[
  {
    "customerId": "SBA-00001",
    "submittedOn": "27 Jun 2026, 10:42:13 am",
    "fullName": "Example Name",
    "phone": "9894763248",
    "email": "example@email.com",
    "...": "...remaining form fields..."
  }
]
```

---

## Customer support

For any issues with this website, please contact:

**Mr. Sabareeswaran** (Managing Director)
📞 +91 98947 63248
✉ sbachitsfund@gmail.com

---

## Legal

SBA CHITS & FUND PRIVATE LIMITED operates strictly under the
**Chit Funds Act, 1982** and does **not** conduct prize chits or money
circulation schemes as banned under the Prize Chits and Money Circulation
Schemes (Banning) Act, 1978.

- CIN: U64990TZ2026PTC038770
- PAN: ABTCS4170N
- TAN: CMBS31161E
- Incorporated: 13 April 2026
- Registered Office: 464, RSP Complex, 1st Floor, Perichipalayam,
  T.C. Market, Tiruppur, Coimbatore – 641604, Tamil Nadu, India.
