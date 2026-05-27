# SBA Chits & Fund Private Limited — Official Website

A complete, production-grade website for **SBA CHITS & FUND PRIVATE LIMITED**
(CIN: U64990TZ2026PTC038770), a chit fund company registered in Tiruppur,
Tamil Nadu.

The site includes a public marketing front-end and a backend that captures
customer enrollment submissions, stores them in an internal Excel file, and
sends a notification email to the admin.

---

## Features

- **Editorial, trust-driven public website** (navy + gold on warm cream paper)
- **Hero, About, Services, How-it-works, Why-Choose-Us, Sample Schemes,
  Leadership and Contact** sections
- **Customer Enrollment form** with validation, honeypot anti-spam and
  rate limiting
- **Automatic Excel persistence** at `data/customers.xlsx`
  - Default file is auto-created on first run
  - Every submission is appended as a new row with auto-generated
    Customer ID (`SBA-00001`, `SBA-00002`, …)
  - Header row, freeze pane, alternating banding, all pre-formatted
- **Admin email notification** for every submission
  - Beautiful HTML email with full customer details
  - **The Excel file is _never_ attached** (per company requirement)
- **Admin photo and contact card** featured prominently on the site
- Mobile-first responsive design

---

## Project Structure

```
sba-chits-fund/
├── server.js                  # Express app entry point
├── package.json
├── .env.example               # Copy to .env and fill values
├── .gitignore
├── README.md
│
├── routes/
│   └── enroll.js              # POST /api/enroll  – form handler
│
├── utils/
│   ├── excelStore.js          # Excel init + append logic
│   └── mailer.js              # Nodemailer SMTP notifications
│
├── data/
│   └── customers.xlsx         # Internal customer register (auto-created)
│
└── public/
    ├── index.html             # Public website
    ├── css/style.css
    ├── js/main.js
    └── images/admin.jpg       # Managing Director photo
```

---

## Setup

### 1. Prerequisites
- Node.js **v18 or higher**
- npm (bundled with Node)

### 2. Install dependencies
```bash
cd sba-chits-fund
npm install
```

### 3. Configure environment
Copy the example env file and fill in your real values:
```bash
cp .env.example .env
```

Open `.env` and set the SMTP credentials. **If you use Gmail**:

1. Go to your Google Account → **Security** → enable **2-Step Verification**.
2. Scroll down to **App Passwords**.
3. Create an app password for "Mail" → copy the 16-character password.
4. Put it in `.env` as `SMTP_PASS`.
5. Set `SMTP_USER` to the same Gmail address (`sbachitsfund@gmail.com`).

```dotenv
PORT=3000
NODE_ENV=production

ADMIN_EMAIL=sbachitsfund@gmail.com

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=sbachitsfund@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM_NAME=SBA Chits & Fund - Website
```

### 4. Run the server
```bash
npm start
```
Open <http://localhost:3000> in your browser.

For development with auto-reload:
```bash
npm run dev
```

---

## How the data flow works

1. A customer fills the **Enrollment Form** on the website.
2. The form submits a `POST` to `/api/enroll` as JSON.
3. The server:
   - Validates the fields (name, phone, email, address, etc.)
   - Generates the next sequential **Customer ID** (e.g. `SBA-00042`).
   - Appends a new row to `data/customers.xlsx` (the file is created
     automatically with formatted headers on first server start).
   - Sends a styled HTML email to the admin (`sbachitsfund@gmail.com`)
     containing all customer details plus the description message.
     **No file is attached — the Excel is strictly internal.**
4. The website shows a success confirmation with the Customer ID.

If the email step fails (for example, SMTP not yet configured), the
submission is still saved to Excel — no customer data is ever lost.

---

## Where is the customer Excel file?

**`data/customers.xlsx`** (relative to the project root).

It contains a sheet called **"Customer Enrollments"** with the columns:

| # | Column |
|---|---|
| 1 | Customer ID |
| 2 | Submitted On |
| 3 | Full Name |
| 4 | Phone Number |
| 5 | Email Address |
| 6 | Age |
| 7 | Occupation |
| 8 | Monthly Income (INR) |
| 9 | Address |
| 10 | City |
| 11 | State |
| 12 | Pincode |
| 13 | Interested Scheme |
| 14 | Chit Value (INR) |
| 15 | Duration (Months) |
| 16 | How Did You Hear |
| 17 | Message / Notes |

This file is intended **for internal admin use only**. Take regular
backups (a simple `cp data/customers.xlsx backups/customers-$(date +%F).xlsx`
in cron is enough).

---

## Production deployment notes

- Set `NODE_ENV=production` in your environment.
- Put the app behind a reverse proxy (Nginx / Caddy) with HTTPS.
- Persist the `data/` folder on a non-ephemeral disk
  (especially on Render, Railway, Heroku-style platforms — use a mounted
  volume so `customers.xlsx` survives restarts).
- The app already trusts the first proxy hop and emits standard security
  headers; review them against your specific deployment if needed.

### Quick deploy options

- **VPS / On-premise** – `pm2 start server.js --name sba-chits` (after
  `npm i -g pm2`). Set up Nginx as reverse proxy to port 3000.
- **Render.com** – Web Service, build `npm install`, start `npm start`,
  add the env vars from `.env`, attach a Persistent Disk mounted at
  `/opt/render/project/src/data` (or symlink).
- **Railway** – similar; attach a Volume mounted at `/app/data`.

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
