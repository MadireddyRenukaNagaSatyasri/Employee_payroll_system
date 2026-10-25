/**
 * Format numeric value to Currency (defaults to INR / ₹)
 * @param {number} amount
 * @param {string} currencyCode
 * @returns {string}
 */
export const formatCurrency = (amount, currencyCode = 'INR') => {
  const num = Number(amount) || 0;

  if (currencyCode === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(num);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(num);
};

export default formatCurrency;
