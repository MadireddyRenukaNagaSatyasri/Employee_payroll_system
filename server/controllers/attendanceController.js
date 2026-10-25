import Attendance from '../models/Attendance.js';
import Employee from '../models/Employee.js';

// Helper to normalize date to start of UTC day
const normalizeDate = (dateStr) => {
  const d = dateStr ? new Date(dateStr) : new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

/**
 * @desc    Record or update attendance for an employee
 * @route   POST /api/attendance
 * @access  Private (Admin)
 */
export const recordAttendance = async (req, res, next) => {
  try {
    const { employeeId, date, status, notes } = req.body;

    if (!employeeId || !status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide employeeId and status',
      });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    const targetDate = normalizeDate(date);

    // Upsert (update if exists, insert if not)
    const attendance = await Attendance.findOneAndUpdate(
      { employee: employee._id, date: targetDate },
      { status, notes: notes || '' },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).populate('employee', 'fullName employeeId department designation');

    res.status(200).json({
      success: true,
      message: 'Attendance recorded successfully',
      attendance,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Record or update bulk attendance for a specific date
 * @route   POST /api/attendance/batch
 * @access  Private (Admin)
 */
export const recordBatchAttendance = async (req, res, next) => {
  try {
    const { date, records } = req.body;

    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of attendance records',
      });
    }

    const targetDate = normalizeDate(date);

    const bulkOps = records.map((rec) => ({
      updateOne: {
        filter: { employee: rec.employeeId, date: targetDate },
        update: {
          $set: {
            employee: rec.employeeId,
            date: targetDate,
            status: rec.status,
            notes: rec.notes || '',
          },
        },
        upsert: true,
      },
    }));

    await Attendance.bulkWrite(bulkOps);

    res.status(200).json({
      success: true,
      message: `Processed attendance for ${records.length} employees`,
      date: targetDate,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get attendance for all active employees for a given date
 * @route   GET /api/attendance/date
 * @access  Private (Admin)
 */
export const getAttendanceByDate = async (req, res, next) => {
  try {
    const { date } = req.query;
    const targetDate = normalizeDate(date);

    // Get all active employees
    const employees = await Employee.find({ status: { $ne: 'Terminated' } })
      .select('fullName employeeId department designation status')
      .sort({ employeeId: 1 });

    // Next day for query range
    const nextDate = new Date(targetDate);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);

    const records = await Attendance.find({
      date: { $gte: targetDate, $lt: nextDate },
    });

    const recordMap = new Map();
    records.forEach((r) => {
      recordMap.set(r.employee.toString(), r);
    });

    // Merge employees with their attendance status
    const attendanceList = employees.map((emp) => {
      const record = recordMap.get(emp._id.toString());
      return {
        employee: emp,
        attendanceId: record ? record._id : null,
        date: targetDate,
        status: record ? record.status : 'Not Marked',
        notes: record ? record.notes : '',
      };
    });

    res.status(200).json({
      success: true,
      date: targetDate,
      totalEmployees: employees.length,
      attendance: attendanceList,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get monthly attendance summary for all active employees
 * @route   GET /api/attendance/summary
 * @access  Private (Admin)
 */
export const getMonthlyAttendanceSummary = async (req, res, next) => {
  try {
    const now = new Date();
    const year = parseInt(req.query.year, 10) || now.getFullYear();
    const month = parseInt(req.query.month, 10) || now.getMonth() + 1; // 1-indexed

    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));
    const daysInMonth = new Date(year, month, 0).getDate();

    // Calculate standard working days (Mon-Fri or Mon-Sat, default 26 working days or exclude Sundays)
    let workingDaysCount = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dayOfWeek = new Date(Date.UTC(year, month - 1, d)).getUTCDay();
      if (dayOfWeek !== 0) {
        // Exclude Sundays
        workingDaysCount++;
      }
    }

    const employees = await Employee.find({ status: { $ne: 'Terminated' } })
      .select('fullName employeeId department designation basicSalary status')
      .sort({ employeeId: 1 });

    const attendanceRecords = await Attendance.find({
      date: { $gte: startDate, $lte: endDate },
    });

    // Group records by employee
    const employeeRecordsMap = new Map();
    attendanceRecords.forEach((r) => {
      const empId = r.employee.toString();
      if (!employeeRecordsMap.has(empId)) {
        employeeRecordsMap.set(empId, []);
      }
      employeeRecordsMap.get(empId).push(r);
    });

    const summary = employees.map((emp) => {
      const records = employeeRecordsMap.get(emp._id.toString()) || [];

      let presentDays = 0;
      let absentDays = 0;
      let halfDays = 0;
      let leaveDays = 0;

      records.forEach((r) => {
        if (r.status === 'Present') presentDays++;
        else if (r.status === 'Absent') absentDays++;
        else if (r.status === 'Half-Day') halfDays++;
        else if (r.status === 'Leave') leaveDays++;
      });

      // Total payable days = present + leaves + (halfDays * 0.5)
      const payableDays = presentDays + leaveDays + halfDays * 0.5;
      const totalMarkedDays = presentDays + absentDays + halfDays + leaveDays;
      const attendancePercentage =
        totalMarkedDays > 0 ? ((payableDays / totalMarkedDays) * 100).toFixed(1) : 0;

      return {
        employee: emp,
        month,
        year,
        totalDaysInMonth: daysInMonth,
        standardWorkingDays: workingDaysCount,
        presentDays,
        absentDays,
        halfDays,
        leaveDays,
        payableDays,
        attendancePercentage: Number(attendancePercentage),
      };
    });

    res.status(200).json({
      success: true,
      month,
      year,
      standardWorkingDays: workingDaysCount,
      summary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get attendance history for an individual employee
 * @route   GET /api/attendance/employee/:employeeId
 * @access  Private (Admin)
 */
export const getEmployeeAttendanceHistory = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { year, month } = req.query;

    const query = { employee: employeeId };

    if (year && month) {
      const y = parseInt(year, 10);
      const m = parseInt(month, 10);
      query.date = {
        $gte: new Date(Date.UTC(y, m - 1, 1, 0, 0, 0)),
        $lte: new Date(Date.UTC(y, m, 0, 23, 59, 59)),
      };
    }

    const records = await Attendance.find(query).sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      records,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update single attendance record by ID
 * @route   PUT /api/attendance/:id
 * @access  Private (Admin)
 */
export const updateAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const record = await Attendance.findById(id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found',
      });
    }

    if (status) record.status = status;
    if (notes !== undefined) record.notes = notes;

    await record.save();

    res.status(200).json({
      success: true,
      message: 'Attendance record updated successfully',
      attendance: record,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete single attendance record by ID
 * @route   DELETE /api/attendance/:id
 * @access  Private (Admin)
 */
export const deleteAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const record = await Attendance.findById(id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found',
      });
    }

    await record.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Attendance record deleted',
    });
  } catch (error) {
    next(error);
  }
};
