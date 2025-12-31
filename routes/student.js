const express = require('express');
const Class = require('../models/Class');
const AttendanceSession = require('../models/AttendanceSession');
const AttendanceRecord = require('../models/AttendanceRecord');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All student routes require authentication and student role
router.use(authenticate);
router.use(authorize('student'));

// Scan QR code and mark attendance
router.post('/attendance/scan', [
  require('express-validator').body('sessionToken').notEmpty(),
  require('express-validator').body('encryptedData').notEmpty(),
], async (req, res) => {
  try {
    const { sessionToken, encryptedData } = req.body;

    // Find session
    const session = await AttendanceSession.findOne({ sessionToken, isActive: true });
    if (!session) {
      return res.status(404).json({ message: 'Invalid or expired QR code' });
    }

    // Check if session is still valid
    if (new Date() > session.endTime) {
      session.isActive = false;
      await session.save();
      return res.status(400).json({ message: 'QR code has expired' });
    }

    // Decrypt and verify session data
    const decryptedData = AttendanceSession.decryptSession(encryptedData);
    if (!decryptedData || decryptedData.classId !== session.classId.toString()) {
      return res.status(400).json({ message: 'Invalid QR code data' });
    }

    // Verify student is enrolled in the class
    const classData = await Class.findById(session.classId);
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const isEnrolled = classData.enrolledStudents.some(
      studentId => studentId.toString() === req.user._id.toString()
    );

    if (!isEnrolled) {
      return res.status(403).json({ message: 'You are not enrolled in this class' });
    }

    // Check for duplicate attendance
    const existingRecord = await AttendanceRecord.findOne({
      studentId: req.user._id,
      sessionId: session._id
    });

    if (existingRecord) {
      return res.status(400).json({ message: 'Attendance already marked for this session' });
    }

    // Create attendance record
    const record = new AttendanceRecord({
      studentId: req.user._id,
      classId: session.classId,
      sessionId: session._id,
      status: 'present'
    });

    await record.save();

    res.json({
      message: 'Attendance marked successfully',
      record: {
        id: record._id,
        date: record.date,
        status: record.status,
        class: {
          subject: classData.subject,
          branch: classData.branch,
          semester: classData.semester,
          section: classData.section
        }
      }
    });
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ message: 'Error marking attendance' });
  }
});

// Get student's attendance history
router.get('/attendance/history', async (req, res) => {
  try {
    const { classId, startDate, endDate } = req.query;

    const match = { studentId: req.user._id };
    if (classId) match.classId = classId;
    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate);
      if (endDate) match.date.$lte = new Date(endDate);
    }

    const attendance = await AttendanceRecord.find(match)
      .populate('classId', 'subject branch semester section')
      .populate('sessionId', 'startTime endTime')
      .sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attendance history' });
  }
});

// Get student's enrolled classes
router.get('/classes', async (req, res) => {
  try {
    const classes = await Class.find({
      enrolledStudents: req.user._id
    })
      .populate('teacherId', 'name email')
      .sort({ createdAt: -1 });

    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching classes' });
  }
});

// Get attendance statistics
router.get('/attendance/statistics', async (req, res) => {
  try {
    const { classId } = req.query;

    const match = { studentId: req.user._id };
    if (classId) match.classId = classId;

    const totalRecords = await AttendanceRecord.countDocuments(match);
    const presentRecords = await AttendanceRecord.countDocuments({ ...match, status: 'present' });
    const absentRecords = await AttendanceRecord.countDocuments({ ...match, status: 'absent' });
    const lateRecords = await AttendanceRecord.countDocuments({ ...match, status: 'late' });

    const percentage = totalRecords > 0 ? ((presentRecords / totalRecords) * 100).toFixed(2) : 0;

    // Get class-wise statistics
    const classStats = await AttendanceRecord.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$classId',
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } }
        }
      }
    ]);

    const classDetails = await Class.populate(classStats, { path: '_id', select: 'subject branch semester section' });

    res.json({
      overall: {
        total: totalRecords,
        present: presentRecords,
        absent: absentRecords,
        late: lateRecords,
        percentage: parseFloat(percentage)
      },
      byClass: classDetails.map(stat => ({
        class: stat._id,
        total: stat.total,
        present: stat.present,
        absent: stat.absent,
        late: stat.late,
        percentage: stat.total > 0 ? ((stat.present / stat.total) * 100).toFixed(2) : 0
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching statistics' });
  }
});

module.exports = router;

