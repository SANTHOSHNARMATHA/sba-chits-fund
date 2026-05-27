/**
 * Excel storage utility for SBA Chits & Fund Private Limited.
 *
 * Maintains a single workbook at  /data/customers.xlsx
 * - The file is created with formatted headers on first run.
 * - Every new customer submission is appended as a new row.
 * - Each row gets an auto-incremented Customer ID and a timestamp.
 *
 * The Excel file is for INTERNAL ADMIN USE ONLY.
 * It is never sent over email.
 */

const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE_PATH = path.join(DATA_DIR, 'customers.xlsx');
const SHEET_NAME = 'Customer Enrollments';

const COLUMNS = [
  { header: 'Customer ID',          key: 'customerId',      width: 14 },
  { header: 'Submitted On',         key: 'submittedOn',     width: 22 },
  { header: 'Full Name',            key: 'fullName',        width: 26 },
  { header: 'Phone Number',         key: 'phone',           width: 18 },
  { header: 'Email Address',        key: 'email',           width: 30 },
  { header: 'Age',                  key: 'age',             width: 8  },
  { header: 'Occupation',           key: 'occupation',      width: 20 },
  { header: 'Monthly Income (INR)', key: 'monthlyIncome',   width: 22 },
  { header: 'Address',              key: 'address',         width: 40 },
  { header: 'City',                 key: 'city',            width: 18 },
  { header: 'State',                key: 'state',           width: 18 },
  { header: 'Pincode',              key: 'pincode',         width: 12 },
  { header: 'Interested Scheme',    key: 'scheme',          width: 22 },
  { header: 'Chit Value (INR)',     key: 'chitValue',       width: 18 },
  { header: 'Duration (Months)',    key: 'duration',        width: 18 },
  { header: 'How Did You Hear',     key: 'referralSource',  width: 22 },
  { header: 'Message / Notes',      key: 'message',         width: 50 },
];

/**
 * Make sure /data exists and the workbook exists with a header row.
 * Called once on server startup so the default file is always present.
 */
async function initializeWorkbook () {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(FILE_PATH)) {
    return; // Already initialized
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator   = 'SBA Chits & Fund Private Limited';
  workbook.company   = 'SBA Chits & Fund Private Limited';
  workbook.created   = new Date();
  workbook.modified  = new Date();

  const sheet = workbook.addWorksheet(SHEET_NAME, {
    views: [{ state: 'frozen', ySplit: 1 }], // freeze the header row
  });

  sheet.columns = COLUMNS;

  // Style the header row
  const headerRow = sheet.getRow(1);
  headerRow.height = 24;
  headerRow.eachCell((cell) => {
    cell.font      = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.fill      = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0A2540' }, // deep navy
    };
    cell.border = {
      top:    { style: 'thin', color: { argb: 'FF888888' } },
      left:   { style: 'thin', color: { argb: 'FF888888' } },
      bottom: { style: 'thin', color: { argb: 'FF888888' } },
      right:  { style: 'thin', color: { argb: 'FF888888' } },
    };
  });

  await workbook.xlsx.writeFile(FILE_PATH);
  console.log(`[Excel] Initialized default workbook at ${FILE_PATH}`);
}

/**
 * Append a single customer record to the workbook.
 * Returns the assigned Customer ID and the row number.
 */
async function appendCustomer (data) {
  await initializeWorkbook(); // safety – ensures file exists even if deleted

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(FILE_PATH);
  const sheet = workbook.getWorksheet(SHEET_NAME) || workbook.worksheets[0];

  // Re-apply columns mapping so addRow(key:value) works after re-load
  sheet.columns = COLUMNS;

  // Generate Customer ID – sequential, zero-padded.
  // We count existing data rows (sheet.rowCount includes the header).
  const nextSequence = sheet.rowCount; // rowCount = N data rows + 1 header; next ID = N+1 = rowCount
  const customerId   = `SBA-${String(nextSequence).padStart(5, '0')}`;

  const now = new Date();
  const submittedOn = now.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: true,
  });

  const row = sheet.addRow({
    customerId,
    submittedOn,
    fullName:       data.fullName       || '',
    phone:          data.phone          || '',
    email:          data.email          || '',
    age:            data.age            || '',
    occupation:     data.occupation     || '',
    monthlyIncome:  data.monthlyIncome  || '',
    address:        data.address        || '',
    city:           data.city           || '',
    state:          data.state          || '',
    pincode:        data.pincode        || '',
    scheme:         data.scheme         || '',
    chitValue:      data.chitValue      || '',
    duration:       data.duration       || '',
    referralSource: data.referralSource || '',
    message:        data.message        || '',
  });

  // Style the data row
  row.height = 20;
  row.alignment = { vertical: 'middle', wrapText: true };
  row.eachCell((cell, colNumber) => {
    cell.border = {
      top:    { style: 'thin', color: { argb: 'FFCCCCCC' } },
      left:   { style: 'thin', color: { argb: 'FFCCCCCC' } },
      bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      right:  { style: 'thin', color: { argb: 'FFCCCCCC' } },
    };
    // Alternate row banding
    if (nextSequence % 2 === 0) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF7F9FC' },
      };
    }
    if (colNumber === 1) {
      cell.font = { bold: true, color: { argb: 'FF0A2540' } };
    }
  });

  await workbook.xlsx.writeFile(FILE_PATH);
  console.log(`[Excel] Appended customer ${customerId} -> ${data.fullName}`);

  return { customerId, rowNumber: row.number };
}

module.exports = {
  initializeWorkbook,
  appendCustomer,
  FILE_PATH,
};
