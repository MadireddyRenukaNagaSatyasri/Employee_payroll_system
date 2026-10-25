import Employee from '../models/Employee.js';
import Payroll from '../models/Payroll.js';
import generateEmployeeId from '../utils/generateEmployeeId.js';
import { calculateEmployeePayroll } from '../services/payrollService.js';

/**
 * @desc    Create a new employee
 * @route   POST /api/employees
 * @access  Private (Admin)
 */
export const createEmployee = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      phone,
      department,
      designation,
      joiningDate,
      status,
      basicSalary,
      bankDetails,
    } = req.body;

    // Check duplicate email
    const existingEmployee = await Employee.findOne({ email: email.toLowerCase() });
    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: 'An employee with this email already exists',
      });
    }

    // Auto-generate unique Employee ID
    const employeeId = await generateEmployeeId();

    const employee = await Employee.create({
      employeeId,
      fullName,
      email: email.toLowerCase(),
      phone,
      department,
      designation,
      joiningDate: joiningDate || Date.now(),
      status: status || 'Active',
      basicSalary: Number(basicSalary),
      bankDetails: bankDetails || {},
    });

    // Automatically generate current month's Draft payroll for the new active employee
    if (employee.status === 'Active') {
      try {
        const now = new Date();
        const curYear = now.getFullYear();
        const curMonth = now.getMonth() + 1;
        const calculated = await calculateEmployeePayroll(employee, curYear, curMonth);
        await Payroll.create({
          ...calculated,
          status: 'Draft',
        });
      } catch (payrollErr) {
        console.warn(`Notice: Could not auto-generate initial payroll draft: ${payrollErr.message}`);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      employee,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all employees with search, filter, and pagination
 * @route   GET /api/employees
 * @access  Private (Admin)
 */
export const getEmployees = async (req, res, next) => {
  try {
    const {
      search,
      department,
      designation,
      status,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const query = {};

    // Search by name or employeeId
    if (search) {
      query.$or = [
        { fullName: { $regex: search.trim(), $options: 'i' } },
        { employeeId: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    // Filter by department
    if (department && department !== 'All') {
      query.department = department;
    }

    // Filter by designation
    if (designation && designation !== 'All') {
      query.designation = { $regex: designation.trim(), $options: 'i' };
    }

    // Filter by status
    if (status && status !== 'All') {
      query.status = status;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;
    const sortOrder = order === 'asc' ? 1 : -1;

    const total = await Employee.countDocuments(query);
    const employees = await Employee.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: employees.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      employees,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get employee details by ID
 * @route   GET /api/employees/:id
 * @access  Private (Admin)
 */
export const getEmployeeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Search by mongo _id or employeeId
    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
    const employee = isObjectId
      ? await Employee.findById(id)
      : await Employee.findOne({ employeeId: id.toUpperCase() });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    res.status(200).json({
      success: true,
      employee,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update employee details
 * @route   PUT /api/employees/:id
 * @access  Private (Admin)
 */
export const updateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      fullName,
      email,
      phone,
      department,
      designation,
      joiningDate,
      status,
      basicSalary,
      bankDetails,
    } = req.body;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // If email is changing, check if another employee uses it
    if (email && email.toLowerCase() !== employee.email.toLowerCase()) {
      const emailExists = await Employee.findOne({
        email: email.toLowerCase(),
        _id: { $ne: id },
      });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'An employee with this email already exists',
        });
      }
      employee.email = email.toLowerCase();
    }

    if (fullName) employee.fullName = fullName;
    if (phone) employee.phone = phone;
    if (department) employee.department = department;
    if (designation) employee.designation = designation;
    if (joiningDate) employee.joiningDate = joiningDate;
    if (status) employee.status = status;
    if (basicSalary !== undefined) employee.basicSalary = Number(basicSalary);
    if (bankDetails) {
      employee.bankDetails = {
        ...employee.bankDetails,
        ...bankDetails,
      };
    }

    const updatedEmployee = await employee.save();

    // If active, sync any current month Draft payroll with the updated salary/details
    if (updatedEmployee.status === 'Active') {
      try {
        const now = new Date();
        const curYear = now.getFullYear();
        const curMonth = now.getMonth() + 1;
        const currentDraft = await Payroll.findOne({
          employee: updatedEmployee._id,
          year: curYear,
          month: curMonth,
          status: 'Draft',
        });
        if (currentDraft) {
          const freshCalc = await calculateEmployeePayroll(updatedEmployee, curYear, curMonth);
          Object.assign(currentDraft, freshCalc);
          await currentDraft.save();
        }
      } catch (syncErr) {
        console.warn(`Draft sync notice: ${syncErr.message}`);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      employee: updatedEmployee,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle or set employee status (Active/Inactive)
 * @route   PATCH /api/employees/:id/status
 * @access  Private (Admin)
 */
export const toggleEmployeeStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    employee.status = status || (employee.status === 'Active' ? 'Inactive' : 'Active');
    await employee.save();

    res.status(200).json({
      success: true,
      message: `Employee status updated to ${employee.status}`,
      employee,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete employee
 * @route   DELETE /api/employees/:id
 * @access  Private (Admin)
 */
export const deleteEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    await employee.deleteOne();

    res.status(200).json({
      success: true,
      message: `Employee ${employee.fullName} (${employee.employeeId}) deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};
