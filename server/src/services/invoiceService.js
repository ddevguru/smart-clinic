const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const { query } = require('../config/db');

class InvoiceService {
  /**
   * Generate next sequential invoice number: INV-YYYYMM-XXXX
   */
  static async generateInvoiceNumber() {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `INV-${yearMonth}-`;

    const countRes = await query(`
      SELECT count(*) as cnt FROM subscription_invoices
      WHERE invoice_number LIKE $1;
    `, [`${prefix}%`]);

    const nextSeq = parseInt(countRes.rows[0].cnt, 10) + 1;
    return `${prefix}${String(nextSeq).padStart(4, '0')}`;
  }

  /**
   * Create finalized subscription invoice with GST breakdown
   */
  static async createInvoice({
    subscriptionId,
    paymentId,
    clinicId,
    planName,
    billingPeriodStart,
    billingPeriodEnd,
    subtotal,
    currency = 'INR'
  }) {
    const invoiceNumber = await this.generateInvoiceNumber();

    // Fetch billing profile or clinic details
    const bpRes = await query('SELECT * FROM billing_profiles WHERE clinic_id = $1', [clinicId]);
    const clinicRes = await query('SELECT * FROM clinics WHERE id = $1', [clinicId]);
    const bp = bpRes.rows[0];
    const clinic = clinicRes.rows[0];

    const billingName = bp?.legal_business_name || clinic?.name || 'Clinic';
    const billingAddress = bp?.billing_address ? `${bp.billing_address}, ${bp.city}, ${bp.state} - ${bp.postal_code}` : (clinic?.address || 'India');
    const gstin = bp?.gstin || null;

    // Determine GST tax structure (Karnataka intrastate = CGST+SGST, interstate = IGST)
    const isKarnataka = (bp?.state || clinic?.state || 'Karnataka').toLowerCase().includes('karnataka');
    const taxType = isKarnataka ? 'CGST_SGST' : 'IGST';
    const taxRate = 18.00;
    const taxAmount = +(subtotal * (taxRate / 100)).toFixed(2);
    const totalAmount = +(subtotal + taxAmount).toFixed(2);

    const invRes = await query(`
      INSERT INTO subscription_invoices (
        id, invoice_number, subscription_id, payment_id, clinic_id,
        clinic_billing_name, clinic_billing_address, clinic_gstin,
        platform_legal_name, platform_gstin, plan_name,
        billing_period_start, billing_period_end,
        subtotal, tax_rate, tax_type, tax_amount, total_amount,
        currency, status, finalized_at, created_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4,
        $5, $6, $7,
        'Smart Clinic OS Technologies Pvt Ltd', '29AABCS1429B1Z8', $8,
        $9, $10,
        $11, $12, $13, $14, $15,
        $16, 'PAID', NOW(), NOW()
      ) RETURNING *;
    `, [
      invoiceNumber, subscriptionId, paymentId, clinicId,
      billingName, billingAddress, gstin, planName,
      billingPeriodStart, billingPeriodEnd,
      subtotal, taxRate, taxType, taxAmount, totalAmount,
      currency
    ]);

    const invoice = invRes.rows[0];

    // Generate PDF document asynchronously
    try {
      await this.generateInvoicePdf(invoice.id);
    } catch (e) {
      console.warn('PDF generation deferred:', e.message);
    }

    return invoice;
  }

  /**
   * Generate downloadable PDF invoice using PDFKit
   */
  static async generateInvoicePdf(invoiceId) {
    const invRes = await query('SELECT * FROM subscription_invoices WHERE id = $1', [invoiceId]);
    if (invRes.rows.length === 0) throw new Error('Invoice not found.');
    const invoice = invRes.rows[0];

    const storageDir = path.join(__dirname, '..', '..', 'storage', 'invoices');
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    const filePath = path.join(storageDir, `${invoice.invoice_number}.pdf`);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header Banner (Deep Teal)
      doc.rect(40, 40, 515, 60).fill('#087F79');
      doc.fillColor('#FFFFFF').fontSize(20).font('Helvetica-Bold').text('TAX INVOICE', 60, 52);
      doc.fontSize(10).font('Helvetica').text('SaaS Platform Subscription', 60, 78);
      doc.fontSize(12).font('Helvetica-Bold').text(invoice.invoice_number, 400, 56, { align: 'right' });
      doc.fontSize(9).font('Helvetica').text(`Date: ${new Date(invoice.created_at).toLocaleDateString('en-IN')}`, 400, 74, { align: 'right' });

      doc.moveDown(3);

      // Two Column Layout: Issuer vs Bill To
      const colTop = 120;
      doc.fillColor('#183B3A').fontSize(11).font('Helvetica-Bold').text('ISSUED BY:', 40, colTop);
      doc.font('Helvetica').fontSize(10).fillColor('#2D3748');
      doc.text(invoice.platform_legal_name, 40, colTop + 16);
      doc.text('Smart Clinic Towers, Outer Ring Road, Bengaluru, Karnataka - 560103', 40, colTop + 30, { width: 230 });
      doc.text(`GSTIN: ${invoice.platform_gstin}`, 40, colTop + 58);
      doc.text('Email: billing@smartclinicos.in', 40, colTop + 72);

      doc.fillColor('#183B3A').fontSize(11).font('Helvetica-Bold').text('BILLED TO (CLINIC):', 310, colTop);
      doc.font('Helvetica').fontSize(10).fillColor('#2D3748');
      doc.text(invoice.clinic_billing_name, 310, colTop + 16);
      doc.text(invoice.clinic_billing_address || 'Clinic Premises', 310, colTop + 30, { width: 240 });
      if (invoice.clinic_gstin) {
        doc.text(`Clinic GSTIN: ${invoice.clinic_gstin}`, 310, colTop + 58);
      } else {
        doc.text('Clinic GSTIN: Unregistered / Composition', 310, colTop + 58);
      }

      // Line items table
      const tableTop = 230;
      doc.rect(40, tableTop, 515, 24).fill('#E5F7F3');
      doc.fillColor('#087F79').font('Helvetica-Bold').fontSize(10);
      doc.text('DESCRIPTION / SERVICE', 50, tableTop + 7);
      doc.text('PERIOD', 250, tableTop + 7);
      doc.text('SAC CODE', 370, tableTop + 7);
      doc.text('AMOUNT (INR)', 450, tableTop + 7, { align: 'right' });

      // Item Row
      const rowTop = tableTop + 32;
      doc.fillColor('#183B3A').font('Helvetica-Bold').fontSize(10);
      doc.text(`Smart Clinic OS — ${invoice.plan_name}`, 50, rowTop);
      doc.font('Helvetica').fontSize(9).fillColor('#708583');
      const pStart = new Date(invoice.billing_period_start).toLocaleDateString('en-IN');
      const pEnd = new Date(invoice.billing_period_end).toLocaleDateString('en-IN');
      doc.text(`${pStart} to ${pEnd}`, 250, rowTop);
      doc.text('998313 (IT/SaaS)', 370, rowTop);
      doc.fillColor('#183B3A').font('Helvetica-Bold').fontSize(10);
      doc.text(`₹${parseFloat(invoice.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 450, rowTop, { align: 'right' });

      // Divider
      doc.rect(40, rowTop + 24, 515, 1).fill('#E2E8F0');

      // Totals & Tax Calculation
      const totalsTop = rowTop + 36;
      doc.font('Helvetica').fontSize(10).fillColor('#4A5568');
      doc.text('Subtotal:', 340, totalsTop);
      doc.text(`₹${parseFloat(invoice.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 450, totalsTop, { align: 'right' });

      if (invoice.tax_type === 'CGST_SGST') {
        const halfTax = +(invoice.tax_amount / 2).toFixed(2);
        doc.text('CGST (9.0%):', 340, totalsTop + 18);
        doc.text(`₹${halfTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 450, totalsTop + 18, { align: 'right' });
        doc.text('SGST (9.0%):', 340, totalsTop + 36);
        doc.text(`₹${halfTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 450, totalsTop + 36, { align: 'right' });
      } else {
        doc.text(`IGST (${invoice.tax_rate}%):`, 340, totalsTop + 18);
        doc.text(`₹${parseFloat(invoice.tax_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 450, totalsTop + 18, { align: 'right' });
      }

      // Grand Total Bar
      const grandTop = totalsTop + 58;
      doc.rect(330, grandTop, 225, 28).fill('#087F79');
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(12);
      doc.text('TOTAL PAID:', 340, grandTop + 8);
      doc.text(`₹${parseFloat(invoice.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 450, grandTop + 8, { align: 'right' });

      // Payment Confirmation Stamp
      doc.rect(40, totalsTop + 10, 180, 56).fill('#E6FFFA');
      doc.rect(40, totalsTop + 10, 180, 56).stroke('#38B2AC');
      doc.fillColor('#234E52').font('Helvetica-Bold').fontSize(11).text('PAYMENT RECEIVED', 50, totalsTop + 20);
      doc.font('Helvetica').fontSize(9).fillColor('#285E61').text(`Method: Online (Razorpay)`, 50, totalsTop + 36);
      doc.text(`Status: Verified & Settled`, 50, totalsTop + 48);

      // Footer
      const checksum = crypto.createHash('sha256').update(invoice.id + invoice.total_amount).digest('hex');
      doc.fontSize(8).fillColor('#A0AEC0').text(`Electronically generated tax invoice under Section 31 of CGST Act. Document Integrity Checksum: ${checksum.slice(0, 32)}...`, 40, 750, { align: 'center', width: 515 });

      doc.end();

      stream.on('finish', async () => {
        await query('UPDATE subscription_invoices SET pdf_file_path = $1 WHERE id = $2', [filePath, invoice.id]);
        resolve(filePath);
      });
      stream.on('error', reject);
    });
  }
}

module.exports = InvoiceService;

