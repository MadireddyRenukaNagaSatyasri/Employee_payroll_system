import Payroll from '../models/Payroll.js';
import Employee from '../models/Employee.js';
import { calculateEmployeePayroll, roundMoney } from '../services/payrollService.js';

/**
 * @desc    Generate or calculate monthly payroll for all active employees
 * @route   POST /api/payroll/generate
 * @access  Private (Admin)
 */
export const generateMonthlyPayroll = async (req, res, next) => {
  try {
    const { year, month } = req.body;

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both year and month for payroll generation',
      });
    }

    const m = parseInt(month, 10);
    const y = parseInt(year, 10);

    // Fetch all active employees
    const employees = await Employee.find({ status: 'Active' });

    if (employees.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active employees found to generate payroll for',
      });
    }

    let createdCount = 0;
    let updatedDraftCount = 0;
    let skippedFinalizedCount = 0;

    for (const emp of employees) {
      // Check existing record
      const existing = await Payroll.findOne({
        employee: emp._id,
        month: m,
        year: y,
      });

      // Do not overwrite finalized or paid payrolls
      if (existing && existing.status !== 'Draft') {
        skippedFinalizedCount++;
        continue;
      }

      // Calculate fresh payroll details
      const calculated = await calculateEmployeePayroll(emp, y, m);

      if (existing) {
        // Update existing draft
        Object.assign(existing, calculated);
        await existing.save();
        updatedDraftCount++;
      } else {
        // Create new draft
        await Payroll.create({
          ...calculated,
          status: 'Draft',
        });
        createdCount++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Payroll generation completed: ${createdCount} created, ${updatedDraftCount} updated drafts, ${skippedFinalizedCount} finalized/paid records preserved.`,
      period: `${y}-${String(m).padStart(2, '0')}`,
      stats: {
        created: createdCount,
        updatedDrafts: updatedDraftCount,
        skippedFinalized: skippedFinalizedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all payroll records with filters and pagination
 * @route   GET /api/payroll
 * @access  Private (Admin)
 */
export const getPayrollList = async (req, res, next) => {
  try {
    const {
      year,
      month,
      status,
      department,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    if (year) query.year = parseInt(year, 10);
    if (month && month !== 'All') query.month = parseInt(month, 10);
    if (status && status !== 'All') query.status = status;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Build population filter if department or search is requested
    const employeeMatch = {};
    if (department && department !== 'All') {
      employeeMatch.department = department;
    }
    if (search) {
      employeeMatch.$or = [
        { fullName: { $regex: search.trim(), $options: 'i' } },
        { employeeId: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const payrolls = await Payroll.find(query)
      .populate({
        path: 'employee',
        match: employeeMatch,
        select: 'fullName employeeId department designation basicSalary bankDetails',
      })
      .populate('finalizedBy', 'name')
      .populate('paidBy', 'name')
      .sort({ createdAt: -1 });

    // Filter out records where employee population failed due to match filter
    const filtered = payrolls.filter((p) => p.employee !== null);

    const paginatedRecords = filtered.slice(skip, skip + limitNum);

    // Compute period summary totals
    let totalGross = 0;
    let totalNet = 0;
    let totalDeductions = 0;
    let draftCount = 0;
    let finalizedCount = 0;
    let paidCount = 0;

    filtered.forEach((p) => {
      totalGross += p.grossSalary;
      totalNet += p.netSalary;
      totalDeductions += p.deductions?.totalDeductions || 0;
      if (p.status === 'Draft') draftCount++;
      else if (p.status === 'Finalized') finalizedCount++;
      else if (p.status === 'Paid') paidCount++;
    });

    res.status(200).json({
      success: true,
      count: paginatedRecords.length,
      total: filtered.length,
      page: pageNum,
      totalPages: Math.ceil(filtered.length / limitNum) || 1,
      summary: {
        totalGross: roundMoney(totalGross),
        totalNet: roundMoney(totalNet),
        totalDeductions: roundMoney(totalDeductions),
        draftCount,
        finalizedCount,
        paidCount,
      },
      payrolls: paginatedRecords,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single payroll record by ID
 * @route   GET /api/payroll/:id
 * @access  Private (Admin)
 */
export const getPayrollById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payroll = await Payroll.findById(id)
      .populate('employee')
      .populate('finalizedBy', 'name email')
      .populate('paidBy', 'name email');

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found',
      });
    }

    res.status(200).json({
      success: true,
      payroll,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update draft payroll adjustments
 * @route   PUT /api/payroll/:id
 * @access  Private (Admin)
 */
export const updateDraftPayroll = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { allowances, bonuses, overtime, deductions } = req.body;

    const payroll = await Payroll.findById(id).populate('employee');
    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found',
      });
    }

    // Protect finalized/paid payrolls from accidental edit
    if (payroll.status !== 'Draft') {
      return res.status(400).json({
        success: false,
        message: `Cannot edit payroll with status '${payroll.status}'. Reopen it first if corrections are required.`,
      });
    }

    // Recalculate with updated manual components
    const customInputs = {
      allowances: allowances || payroll.allowances,
      bonuses: bonuses || payroll.bonuses,
      overtime: overtime || payroll.overtime,
      deductions: deductions || payroll.deductions,
    };

    const updatedComponents = await calculateEmployeePayroll(
      payroll.employee,
      payroll.year,
      payroll.month,
      customInputs
    );

    Object.assign(payroll, updatedComponents);
    await payroll.save();

    res.status(200).json({
      success: true,
      message: 'Draft payroll updated successfully',
      payroll,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Finalize payroll record (Locks from edits)
 * @route   PATCH /api/payroll/:id/finalize
 * @access  Private (Admin)
 */
export const finalizePayroll = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payroll = await Payroll.findById(id);

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found',
      });
    }

    if (payroll.status === 'Finalized') {
      return res.status(400).json({
        success: false,
        message: 'Payroll record is already finalized',
      });
    }

    if (payroll.status === 'Paid') {
      return res.status(400).json({
        success: false,
        message: 'Payroll record is already paid',
      });
    }

    payroll.status = 'Finalized';
    payroll.finalizedAt = new Date();
    payroll.finalizedBy = req.admin._id;
    await payroll.save();

    res.status(200).json({
      success: true,
      message: 'Payroll finalized successfully. Record is now locked for payout.',
      payroll,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reopen finalized payroll for authorized corrections
 * @route   PATCH /api/payroll/:id/reopen
 * @access  Private (Admin)
 */
export const reopenPayroll = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an authorized reason for reopening finalized payroll',
      });
    }

    const payroll = await Payroll.findById(id);
    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found',
      });
    }

    if (payroll.status === 'Paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot reopen payroll that has already been marked as Paid.',
      });
    }

    payroll.status = 'Draft';
    payroll.correctionReason = `Reopened on ${new Date().toISOString()}: ${reason.trim()}`;
    await payroll.save();

    res.status(200).json({
      success: true,
      message: 'Payroll record reopened as Draft for corrections',
      payroll,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark payroll as Paid with payment details
 * @route   PATCH /api/payroll/:id/pay
 * @access  Private (Admin)
 */
export const markPayrollPaid = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { paymentMethod, paymentDate, transactionReference } = req.body;

    const payroll = await Payroll.findById(id);
    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found',
      });
    }

    if (payroll.status === 'Draft') {
      return res.status(400).json({
        success: false,
        message: 'Payroll must be reviewed and finalized before being marked as paid.',
      });
    }

    payroll.status = 'Paid';
    payroll.paymentDetails = {
      paymentDate: paymentDate || new Date(),
      paymentMethod: paymentMethod || 'Bank Transfer',
      transactionReference: transactionReference || '',
    };
    payroll.paidAt = new Date();
    payroll.paidBy = req.admin._id;

    await payroll.save();

    res.status(200).json({
      success: true,
      message: 'Payroll marked as Paid successfully',
      payroll,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete draft payroll record
 * @route   DELETE /api/payroll/:id
 * @access  Private (Admin)
 */
export const deletePayroll = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payroll = await Payroll.findById(id);

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found',
      });
    }

    if (payroll.status !== 'Draft') {
      return res.status(400).json({
        success: false,
        message: `Cannot delete payroll with status '${payroll.status}'. Reopen to draft first if necessary.`,
      });
    }

    await payroll.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Draft payroll deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
