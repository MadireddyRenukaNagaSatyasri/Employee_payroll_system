import Employee from '../models/Employee.js';

/**
 * Generate next sequential unique Employee ID (e.g. EMP-1001, EMP-1002...)
 */
export const generateEmployeeId = async () => {
  try {
    // Find the employee with the highest employeeId
    const lastEmployee = await Employee.findOne(
      { employeeId: { $regex: /^EMP-\d+$/ } },
      {},
      { sort: { employeeId: -1 } }
    );

    if (!lastEmployee || !lastEmployee.employeeId) {
      return 'EMP-1001';
    }

    const currentNumber = parseInt(lastEmployee.employeeId.replace('EMP-', ''), 10);
    const nextNumber = isNaN(currentNumber) ? 1001 : currentNumber + 1;

    return `EMP-${nextNumber}`;
  } catch (error) {
    console.error('Error in generateEmployeeId:', error);
    // Fallback using timestamp in case of error
    return `EMP-${Date.now().toString().slice(-4)}`;
  }
};

export default generateEmployeeId;
