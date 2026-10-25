import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      default: 'Acme Corporation Pvt. Ltd.',
      trim: true,
    },
    companyAddress: {
      type: String,
      default: '123 Business Avenue, Tech Hub, Bangalore - 560001',
      trim: true,
    },
    taxId: {
      type: String,
      default: 'GSTIN: 29AABCU9603R1ZM',
      trim: true,
    },
    contactEmail: {
      type: String,
      default: 'hr@payroll.com',
      trim: true,
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
    },
    currencySymbol: {
      type: String,
      default: '₹',
      trim: true,
    },
    standardWorkingDays: {
      type: Number,
      default: 26,
      min: 1,
      max: 31,
    },
    defaultHraPercent: {
      type: Number,
      default: 20,
      min: 0,
      max: 100,
    },
    defaultDaPercent: {
      type: Number,
      default: 10,
      min: 0,
      max: 100,
    },
    defaultPfPercent: {
      type: Number,
      default: 12,
      min: 0,
      max: 100,
    },
    defaultEsiPercent: {
      type: Number,
      default: 0.75,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

// Helper static method to get or initialize singleton settings document
settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;
