import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import formatCurrency from './formatCurrency.js';
import formatDate from './formatDate.js';

/**
 * Generate and download professional PDF payslip
 * @param {Object} payroll - Populated payroll object
 * @param {Object} companyInfo - Company name and address
 */
export const generatePayslipPdf = (payroll, companyInfo = {}) => {
  if (!payroll || !payroll.employee) {
    alert('Invalid payroll data: Employee profile missing.');
    return;
  }

  const emp = payroll.employee;
  const companyName = companyInfo.companyName || 'EMPLOYEE PAYROLL SYSTEM';
  const companyAddress = companyInfo.address || '123 Business Avenue, Tech Hub, Bangalore';

  // Initialize jsPDF (A4 portrait)
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  // Primary Theme Colors
  const primaryColor = [14, 116, 144]; // Deep cyan/sky #0e7490
  const darkTextColor = [30, 41, 59];  // Slate-800
  const mutedTextColor = [100, 116, 139]; // Slate-500

  // 1. Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName.toUpperCase(), 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(companyAddress, 14, 18);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYSLIP', pageWidth - 14, 12, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Period: ${payroll.period}`, pageWidth - 14, 18, { align: 'right' });

  // 2. Employee Summary Info Block
  let startY = 32;

  doc.setTextColor(...darkTextColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('EMPLOYEE DETAILS', 14, startY);

  autoTable(doc, {
    startY: startY + 3,
    theme: 'plain',
    styles: { fontSize: 8.5, cellPadding: 2, textColor: darkTextColor },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 32, textColor: mutedTextColor },
      1: { cellWidth: 60 },
      2: { fontStyle: 'bold', cellWidth: 32, textColor: mutedTextColor },
      3: { cellWidth: 60 },
    },
    body: [
      [
        'Employee ID:',
        emp.employeeId || '-',
        'Designation:',
        emp.designation || '-',
      ],
      [
        'Full Name:',
        emp.fullName || '-',
        'Department:',
        emp.department || '-',
      ],
      [
        'Bank Name:',
        emp.bankDetails?.bankName || 'Not Set',
        'Account No:',
        emp.bankDetails?.accountNumber || 'Not Set',
      ],
      [
        'IFSC / PAN:',
        `${emp.bankDetails?.ifscCode || '-'} / ${emp.bankDetails?.panNumber || '-'}`,
        'Payroll Status:',
        payroll.status.toUpperCase(),
      ],
    ],
  });

  // 3. Attendance Strip Block
  const attendanceStartY = doc.lastAutoTable.finalY + 4;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('ATTENDANCE SUMMARY', 14, attendanceStartY);

  autoTable(doc, {
    startY: attendanceStartY + 3,
    theme: 'grid',
    styles: { fontSize: 8, halign: 'center', cellPadding: 2.5 },
    headStyles: { fillColor: [241, 245, 249], textColor: darkTextColor, fontStyle: 'bold' },
    head: [['Working Days', 'Present Days', 'Half-Days', 'Leaves', 'Unpaid Days', 'Payable Days']],
    body: [
      [
        payroll.attendanceDetails?.standardWorkingDays || 26,
        payroll.attendanceDetails?.presentDays || 0,
        payroll.attendanceDetails?.halfDays || 0,
        payroll.attendanceDetails?.leaveDays || 0,
        payroll.attendanceDetails?.unpaidDays || 0,
        payroll.attendanceDetails?.payableDays || 0,
      ],
    ],
  });

  // 4. Two-Column Table: Earnings vs Deductions
  const earnings = [
    ['Basic Salary', formatCurrency(payroll.basicSalary)],
    ['House Rent Allowance (HRA)', formatCurrency(payroll.allowances?.hra || 0)],
    ['Dearness Allowance (DA)', formatCurrency(payroll.allowances?.da || 0)],
  ];
  if (payroll.allowances?.specialAllowance > 0) {
    earnings.push(['Special Allowance', formatCurrency(payroll.allowances.specialAllowance)]);
  }
  if (payroll.bonuses?.totalBonuses > 0) {
    earnings.push(['Bonuses & Incentives', formatCurrency(payroll.bonuses.totalBonuses)]);
  }
  if (payroll.overtime?.totalOvertimePay > 0) {
    earnings.push([`Overtime (${payroll.overtime.hours} hrs)`, formatCurrency(payroll.overtime.totalOvertimePay)]);
  }

  const deductions = [
    [
      `Unpaid Leaves (${payroll.attendanceDetails?.unpaidDays || 0} days)`,
      formatCurrency(payroll.deductions?.unpaidLeaveDeduction || 0),
    ],
    ['Provident Fund (PF)', formatCurrency(payroll.deductions?.pf || 0)],
    ['Employee State Insurance (ESI)', formatCurrency(payroll.deductions?.esi || 0)],
  ];
  if (payroll.deductions?.taxTds > 0) {
    deductions.push(['Tax Deducted at Source (TDS)', formatCurrency(payroll.deductions.taxTds)]);
  }
  if (payroll.deductions?.otherDeductions > 0) {
    deductions.push(['Other Deductions', formatCurrency(payroll.deductions.otherDeductions)]);
  }

  // Align rows count for two column layout
  const maxRows = Math.max(earnings.length, deductions.length);
  const combinedRows = [];

  for (let i = 0; i < maxRows; i++) {
    const e = earnings[i] || ['', ''];
    const d = deductions[i] || ['', ''];
    combinedRows.push([e[0], e[1], d[0], d[1]]);
  }

  // Add subtotal row
  combinedRows.push([
    'Gross Earnings',
    formatCurrency(payroll.grossSalary),
    'Total Deductions',
    formatCurrency(payroll.deductions?.totalDeductions || 0),
  ]);

  const salaryTableStartY = doc.lastAutoTable.finalY + 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('SALARY BREAKDOWN', 14, salaryTableStartY);

  autoTable(doc, {
    startY: salaryTableStartY + 3,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 3 },
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
      2: { cellWidth: 60 },
      3: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
    },
    head: [['Earnings Item', 'Amount', 'Deduction Item', 'Amount']],
    body: combinedRows,
    didParseCell: function (data) {
      // Style the summary gross/deduction row
      if (data.row.index === combinedRows.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [241, 245, 249];
      }
    },
  });

  // 5. Net Salary Highlight Banner
  const netPayY = doc.lastAutoTable.finalY + 8;
  doc.setFillColor(240, 253, 244); // light emerald #f0fdf4
  doc.setDrawColor(34, 197, 94);  // emerald-500
  doc.rect(14, netPayY, pageWidth - 28, 18, 'FD');

  doc.setTextColor(22, 101, 52); // emerald-800
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('NET TAKE-HOME PAYABLE SALARY:', 20, netPayY + 11);

  doc.setFontSize(14);
  doc.text(formatCurrency(payroll.netSalary), pageWidth - 20, netPayY + 12, { align: 'right' });

  // 6. Payment Information Note
  if (payroll.status === 'Paid') {
    doc.setFontSize(8);
    doc.setTextColor(...mutedTextColor);
    doc.text(
      `Disbursed via ${payroll.paymentDetails?.paymentMethod || 'Bank Transfer'} | Transaction Ref: ${
        payroll.paymentDetails?.transactionReference || 'N/A'
      } | Date: ${formatDate(payroll.paymentDetails?.paymentDate)}`,
      14,
      netPayY + 24
    );
  }

  // 7. Footer
  const footerY = 278;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, footerY, pageWidth - 14, footerY);

  doc.setFontSize(7.5);
  doc.setTextColor(...mutedTextColor);
  doc.text(
    `This is a system-generated document and does not require a physical signature. Generated on ${new Date().toLocaleString()}`,
    14,
    footerY + 5
  );
  doc.text(`Authorized by: Employee Payroll Management System`, pageWidth - 14, footerY + 5, {
    align: 'right',
  });

  // Download PDF
  const filename = `Payslip-${emp.employeeId || 'EMP'}-${payroll.period}.pdf`;
  doc.save(filename);
};

export default generatePayslipPdf;
