import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  async generateInvoicePdf(invoice: any): Promise<Buffer> {
    // Using a simple HTML-to-PDF approach
    // In production, use puppeteer or @react-pdf/renderer
    const html = this.buildInvoiceHtml(invoice);
    return Buffer.from(html, 'utf-8');
  }

  async generateLabReportPdf(report: any): Promise<Buffer> {
    const html = this.buildLabReportHtml(report);
    return Buffer.from(html, 'utf-8');
  }

  async generateDischargeSummaryPdf(appointment: any): Promise<Buffer> {
    const html = this.buildDischargeSummaryHtml(appointment);
    return Buffer.from(html, 'utf-8');
  }

  async generatePrescriptionPdf(appointment: any): Promise<Buffer> {
    const html = this.buildPrescriptionHtml(appointment);
    return Buffer.from(html, 'utf-8');
  }

  private buildInvoiceHtml(invoice: any): string {
    const items = (invoice.items || []) as any[];
    const itemsHtml = items
      .map(
        (item: any) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;">${item.description}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">$${(item.unitPriceCents / 100).toFixed(2)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">$${(item.totalCents / 100).toFixed(2)}</td>
      </tr>`,
      )
      .join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Helvetica', Arial, sans-serif; color: #1E293B; margin: 40px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .logo { font-size: 28px; font-weight: 800; color: #2563EB; }
    .invoice-title { font-size: 32px; color: #64748B; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background: #F8FAFC; padding: 12px 8px; text-align: left; font-size: 12px; text-transform: uppercase; color: #64748B; border-bottom: 2px solid #E2E8F0; }
    .totals td { padding: 8px; font-weight: 600; }
    .grand-total td { font-size: 18px; color: #2563EB; border-top: 2px solid #2563EB; padding-top: 12px; }
    .footer { margin-top: 60px; text-align: center; color: #94A3B8; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">Medix Hospital</div>
      <p style="color:#64748B;margin-top:4px;">123 Healthcare Ave, New York, NY 10001</p>
      <p style="color:#64748B;">Phone: +1 (555) 123-4567</p>
    </div>
    <div style="text-align:right;">
      <div class="invoice-title">INVOICE</div>
      <p><strong>${invoice.invoiceNumber}</strong></p>
      <p style="color:#64748B;">Date: ${new Date(invoice.createdAt).toLocaleDateString()}</p>
      <p style="color:#64748B;">Due: ${new Date(invoice.dueDate).toLocaleDateString()}</p>
    </div>
  </div>

  <div style="margin-bottom:30px;">
    <h3 style="color:#64748B;font-size:12px;text-transform:uppercase;">Bill To</h3>
    <p><strong>${invoice.patient?.user?.firstName || ''} ${invoice.patient?.user?.lastName || ''}</strong></p>
    <p style="color:#64748B;">MRN: ${invoice.patient?.mrn || 'N/A'}</p>
    <p style="color:#64748B;">${invoice.patient?.user?.email || ''}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align:center;">Qty</th>
        <th style="text-align:right;">Unit Price</th>
        <th style="text-align:right;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>

  <table style="width:300px;margin-left:auto;margin-top:20px;">
    <tr class="totals">
      <td>Subtotal</td>
      <td style="text-align:right;">$${(invoice.subtotalCents / 100).toFixed(2)}</td>
    </tr>
    <tr class="totals">
      <td>Tax</td>
      <td style="text-align:right;">$${(invoice.taxCents / 100).toFixed(2)}</td>
    </tr>
    ${invoice.discountCents > 0 ? `
    <tr class="totals">
      <td>Discount</td>
      <td style="text-align:right;color:#10B981;">-$${(invoice.discountCents / 100).toFixed(2)}</td>
    </tr>` : ''}
    <tr class="totals grand-total">
      <td>Total Due</td>
      <td style="text-align:right;">$${(invoice.totalCents / 100).toFixed(2)}</td>
    </tr>
  </table>

  <div style="margin-top:40px;padding:20px;background:#F0F9FF;border-radius:8px;">
    <p style="font-weight:600;color:#2563EB;">Payment Instructions</p>
    <p style="color:#64748B;font-size:14px;">Payment can be made at the hospital reception desk or through our online portal at medix.hospital/pay</p>
  </div>

  <div class="footer">
    <p>Thank you for choosing Medix Hospital</p>
    <p>This is a computer-generated invoice. No signature required.</p>
  </div>
</body>
</html>`;
  }

  private buildLabReportHtml(report: any): string {
    const results = report.results || {};
    const resultsHtml = Object.entries(results)
      .map(
        ([key, result]: [string, any]) => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #eee;font-weight:500;">${key.replace(/([A-Z])/g, ' $1').trim()}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;font-weight:600;${result.isAbnormal ? 'color:#EF4444;' : 'color:#10B981;'}">${result.value}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;">${result.unit}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;">${result.referenceRange}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;">${result.isAbnormal ? '⚠️ Abnormal' : '✅ Normal'}</td>
      </tr>`,
      )
      .join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Helvetica', Arial, sans-serif; color: #1E293B; margin: 40px; }
    .header { border-bottom: 3px solid #2563EB; padding-bottom: 20px; margin-bottom: 30px; }
    .logo { font-size: 28px; font-weight: 800; color: #2563EB; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #F8FAFC; padding: 12px 10px; text-align: left; font-size: 12px; text-transform: uppercase; color: #64748B; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 30px; }
    .info-item label { font-size: 12px; color: #64748B; text-transform: uppercase; }
    .info-item p { font-weight: 600; margin-top: 4px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Medix Hospital — Laboratory Report</div>
    <p style="color:#64748B;">Department of ${report.testCategory || 'Pathology'}</p>
  </div>

  <div class="info-grid">
    <div class="info-item">
      <label>Patient Name</label>
      <p>${report.patient?.user?.firstName || ''} ${report.patient?.user?.lastName || ''}</p>
    </div>
    <div class="info-item">
      <label>MRN</label>
      <p>${report.patient?.mrn || 'N/A'}</p>
    </div>
    <div class="info-item">
      <label>Test Type</label>
      <p>${report.testType}</p>
    </div>
    <div class="info-item">
      <label>Ordered By</label>
      <p>Dr. ${report.orderedByUser?.firstName || ''} ${report.orderedByUser?.lastName || ''}</p>
    </div>
    <div class="info-item">
      <label>Date Ordered</label>
      <p>${new Date(report.createdAt).toLocaleDateString()}</p>
    </div>
    <div class="info-item">
      <label>Date Completed</label>
      <p>${report.completedAt ? new Date(report.completedAt).toLocaleDateString() : 'Pending'}</p>
    </div>
  </div>

  <h3>Test Results</h3>
  <table>
    <thead>
      <tr>
        <th>Parameter</th>
        <th style="text-align:center;">Result</th>
        <th style="text-align:center;">Unit</th>
        <th style="text-align:center;">Reference Range</th>
        <th style="text-align:center;">Status</th>
      </tr>
    </thead>
    <tbody>
      ${resultsHtml}
    </tbody>
  </table>

  ${report.notes ? `
  <div style="margin-top:30px;padding:16px;background:#FEF3C7;border-radius:8px;">
    <p style="font-weight:600;">Notes</p>
    <p>${report.notes}</p>
  </div>` : ''}

  <div style="margin-top:60px;display:flex;justify-content:space-between;">
    <div style="text-align:center;">
      <div style="border-top:1px solid #CBD5E1;width:200px;margin-bottom:8px;"></div>
      <p style="font-size:12px;color:#64748B;">Lab Technician</p>
    </div>
    <div style="text-align:center;">
      <div style="border-top:1px solid #CBD5E1;width:200px;margin-bottom:8px;"></div>
      <p style="font-size:12px;color:#64748B;">Pathologist</p>
    </div>
  </div>
</body>
</html>`;
  }

  private buildDischargeSummaryHtml(appointment: any): string {
    const prescriptionHtml = (appointment.prescription || [])
      .map(
        (rx: any) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;">${rx.drugName}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;">${rx.dosage}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;">${rx.frequency}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;">${rx.duration}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;">${rx.instructions || '—'}</td>
      </tr>`,
      )
      .join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Helvetica', Arial, sans-serif; color: #1E293B; margin: 40px; }
    .header { border-bottom: 3px solid #2563EB; padding-bottom: 20px; margin-bottom: 30px; }
    .logo { font-size: 28px; font-weight: 800; color: #2563EB; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { background: #F8FAFC; padding: 10px 8px; text-align: left; font-size: 11px; text-transform: uppercase; color: #64748B; }
    .section { margin-bottom: 24px; }
    .section h3 { color: #2563EB; font-size: 14px; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Medix Hospital — Discharge Summary</div>
  </div>

  <div class="section">
    <h3>Patient Information</h3>
    <p><strong>Name:</strong> ${appointment.patient?.user?.firstName || ''} ${appointment.patient?.user?.lastName || ''}</p>
    <p><strong>MRN:</strong> ${appointment.patient?.mrn || 'N/A'}</p>
    <p><strong>Admission Date:</strong> ${new Date(appointment.slotStart).toLocaleDateString()}</p>
    <p><strong>Discharge Date:</strong> ${new Date().toLocaleDateString()}</p>
  </div>

  <div class="section">
    <h3>Attending Physician</h3>
    <p>Dr. ${appointment.doctor?.firstName || ''} ${appointment.doctor?.lastName || ''}</p>
    <p>Department: ${appointment.department?.replace('_', ' ') || ''}</p>
  </div>

  <div class="section">
    <h3>Chief Complaint</h3>
    <p>${appointment.chiefComplaint || 'Not specified'}</p>
  </div>

  <div class="section">
    <h3>Diagnosis</h3>
    <p>${appointment.diagnosis || 'Not specified'}</p>
  </div>

  <div class="section">
    <h3>Clinical Notes</h3>
    <p>${appointment.notes || 'No additional notes'}</p>
  </div>

  ${appointment.vitals ? `
  <div class="section">
    <h3>Vitals at Discharge</h3>
    <p>BP: ${appointment.vitals.bloodPressureSystolic || '—'}/${appointment.vitals.bloodPressureDiastolic || '—'} mmHg
    | HR: ${appointment.vitals.heartRate || '—'} bpm
    | Temp: ${appointment.vitals.temperature || '—'}°F
    | SpO2: ${appointment.vitals.oxygenSaturation || '—'}%</p>
  </div>` : ''}

  ${prescriptionHtml ? `
  <div class="section">
    <h3>Discharge Medications</h3>
    <table>
      <thead>
        <tr>
          <th>Medication</th>
          <th>Dosage</th>
          <th>Frequency</th>
          <th>Duration</th>
          <th>Instructions</th>
        </tr>
      </thead>
      <tbody>
        ${prescriptionHtml}
      </tbody>
    </table>
  </div>` : ''}

  <div class="section">
    <h3>Follow-up Instructions</h3>
    <p>Please schedule a follow-up appointment within 2 weeks.</p>
    <p>Contact the hospital immediately if symptoms worsen.</p>
  </div>

  <div style="margin-top:60px;display:flex;justify-content:space-between;">
    <div style="text-align:center;">
      <div style="border-top:1px solid #CBD5E1;width:200px;margin-bottom:8px;"></div>
      <p style="font-size:12px;color:#64748B;">Attending Physician</p>
    </div>
    <div style="text-align:center;">
      <div style="border-top:1px solid #CBD5E1;width:200px;margin-bottom:8px;"></div>
      <p style="font-size:12px;color:#64748B;">Patient Signature</p>
    </div>
  </div>
</body>
</html>`;
  }

  private buildPrescriptionHtml(appointment: any): string {
    return this.buildDischargeSummaryHtml(appointment);
  }
}