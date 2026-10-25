import mongoose from 'mongoose';

const payrollSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required'],
      index: true,
    },
    month: {
      type: Number,
      required: [true, 'Payroll month is required'],
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: [true, 'Payroll year is required'],
    },
    period: {
      type: String, // e.g. "2026-10"
      required: true,
      index: true,
    },
    basicSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    attendanceDetails: {
      standardWorkingDays: { type: Number, default: 26 },
      presentDays: { type: Number, default: 0 },
      halfDays: { type: Number, default: 0 },
      leaveDays: { type: Number, default: 0 },
      absentDays: { type: Number, default: 0 },
      payableDays: { type: Number, default: 0 },
      unpaidDays: { type: Number, default: 0 },
    },
    allowances: {
      hra: { type: Number, default: 0 },
      da: { type: Number, default: 0 },
      specialAllowance: { type: Number, default: 0 },
      otherAllowance: { type: Number, default: 0 },
      totalAllowances: { type: Number, default: 0 },
    },
    bonuses: {
      performanceBonus: { type: Number, default: 0 },
      festivalBonus: { type: Number, default: 0 },
      totalBonuses: { type: Number, default: 0 },
    },
    overtime: {
      hours: { type: Number, default: 0 },
      ratePerHour: { type: Number, default: 0 },
      totalOvertimePay: { type: Number, default: 0 },
    },
    deductions: {
      unpaidLeaveDeduction: { type: Number, default: 0 },
      pf: { type: Number, default: 0 },
      esi: { type: Number, default: 0 },
      taxTds: { type: Number, default: 0 },
      otherDeductions: { type: Number, default: 0 },
      totalDeductions: { type: Number, default: 0 },
    },
    grossSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    netSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['Draft', 'Finalized', 'Paid'],
      default: 'Draft',
      index: true,
    },
    paymentDetails: {
      paymentDate: { type: Date },
      paymentMethod: {
        type: String,
        enum: ['Bank Transfer', 'Cheque', 'Cash', 'UPI', ''],
        default: '',
      },
      transactionReference: { type: String, trim: true, default: '' },
    },
    correctionReason: {
      type: String,
      trim: true,
      default: '',
    },
    finalizedAt: { type: Date },
    finalizedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    paidAt: { type: Date },
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate payroll records for the same employee and payroll period
payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

const Payroll = mongoose.model('Payroll', payrollSchema);

export default Payroll;
