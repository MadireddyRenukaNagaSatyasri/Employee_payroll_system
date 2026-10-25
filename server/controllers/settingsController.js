import Settings from '../models/Settings.js';

/**
 * @desc    Get system settings
 * @route   GET /api/settings
 * @access  Private (Admin)
 */
export const getSettings = async (req, res, next) => {
  try {
    const settings = await Settings.getSettings();
    res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update system settings
 * @route   PUT /api/settings
 * @access  Private (Admin)
 */
export const updateSettings = async (req, res, next) => {
  try {
    const {
      companyName,
      companyAddress,
      taxId,
      contactEmail,
      currency,
      currencySymbol,
      standardWorkingDays,
      defaultHraPercent,
      defaultDaPercent,
      defaultPfPercent,
      defaultEsiPercent,
    } = req.body;

    const settings = await Settings.getSettings();

    if (companyName) settings.companyName = companyName;
    if (companyAddress) settings.companyAddress = companyAddress;
    if (taxId) settings.taxId = taxId;
    if (contactEmail) settings.contactEmail = contactEmail;
    if (currency) settings.currency = currency;
    if (currencySymbol) settings.currencySymbol = currencySymbol;
    if (standardWorkingDays !== undefined) settings.standardWorkingDays = Number(standardWorkingDays);
    if (defaultHraPercent !== undefined) settings.defaultHraPercent = Number(defaultHraPercent);
    if (defaultDaPercent !== undefined) settings.defaultDaPercent = Number(defaultDaPercent);
    if (defaultPfPercent !== undefined) settings.defaultPfPercent = Number(defaultPfPercent);
    if (defaultEsiPercent !== undefined) settings.defaultEsiPercent = Number(defaultEsiPercent);

    await settings.save();

    res.status(200).json({
      success: true,
      message: 'System settings updated successfully',
      settings,
    });
  } catch (error) {
    next(error);
  }
};
