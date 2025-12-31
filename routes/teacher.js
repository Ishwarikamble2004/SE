const express = require('express');
const QRCode = require('qrcode');
const { body, validationResult } = require('express-validator');
const Class = require('../models/Class');
const AttendanceSession = require('../models/AttendanceSession');
const AttendanceRecord = require('../models/AttendanceRecord');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');

const router = express.Router();

// All teacher routes require authentication and teacher role
router.use(authenticate);
router.use(authorize('teacher'));

// Create class
router.post('/classes', [
  body('subject').trim().notEmpty(),
  body('branch').trim().notEmpty(),
  body('semester').isInt({ min: 1, max: 8 }),
  body('section').trim().notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { subject, branch, semester, section } = req.body;

    // Check if class already exists
    const existingClass = await Class.findOne({ subject, branch, semester, section, teacherId: req.user._id });
    if (existingClass) {
      return res.status(400).json({ message: 'Class already exists' });
    }

    const newClass = new Class({
      subject,
      branch,
      semester,
      section,
      teacherId: req.user._id
    });

    await newClass.save();
    res.status(201).json({ message: 'Class created successfully', class: newClass });
  } catch (error) {
    res.status(500).json({ message: 'Error creating class' });
  }
});

// Get teacher's classes
router.get('/classes', async (req, res) => {
  try {
    const classes = await Class.find({ teacherId: req.user._id })
      .populate('enrolledStudents', 'name studentId email')
      .sort({ createdAt: -1 });
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching classes' });
  }
});

// Get class by ID
router.get('/classes/:id', async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id)
      .populate('teacherId', 'name email')
      .populate('enrolledStudents', 'name studentId email branch semester section');
    
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    if (classData.teacherId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(classData);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching class' });
  }
});

// Enroll students in class
router.post('/classes/:id/enroll', async (req, res) => {
  try {
    const { studentIds } = req.body;
    const classData = await Class.findById(req.params.id);

    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    if (classData.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Add students if not already enrolled
    studentIds.forEach(studentId => {
      if (!classData.enrolledStudents.includes(studentId)) {
        classData.enrolledStudents.push(studentId);
      }
    });

    await classData.save();
    res.json({ message: 'Students enrolled successfully', class: classData });
  } catch (error) {
    res.status(500).json({ message: 'Error enrolling students' });
  }
});

// Remove student from class
router.delete('/classes/:id/enroll/:studentId', async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id);

    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    if (classData.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    classData.enrolledStudents = classData.enrolledStudents.filter(
      id => id.toString() !== req.params.studentId
    );

    await classData.save();
    res.json({ message: 'Student removed successfully', class: classData });
  } catch (error) {
    res.status(500).json({ message: 'Error removing student' });
  }
});

// Generate QR code for attendance session
router.post('/sessions/generate', [
  body('classId').notEmpty(),
  body('duration').optional().isInt({ min: 60000, max: 3600000 }), // 1 min to 1 hour
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { classId, duration = 300000 } = req.body; // Default 5 minutes

    // Verify class belongs to teacher
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    if (classData.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Generate session
    const sessionData = AttendanceSession.generateSession(classId, req.user._id, duration);
    
    const session = new AttendanceSession({
      classId,
      teacherId: req.user._id,
      ...sessionData
    });

    await session.save();

    // Generate QR code
    const qrData = {
      sessionToken: session.sessionToken,
      encryptedData: session.encryptedData,
      classId: classId.toString()
    };

    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData));

    res.json({
      message: 'QR code generated successfully',
      session: {
        id: session._id,
        sessionToken: session.sessionToken,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.duration
      },
      qrCode: qrCodeDataURL
    });
  } catch (error) {
    console.error('QR generation error:', error);
    res.status(500).json({ message: 'Error generating QR code' });
  }
});

// Get active sessions
router.get('/sessions/active', async (req, res) => {
  try {
    const sessions = await AttendanceSession.find({
      teacherId: req.user._id,
      isActive: true,
      endTime: { $gt: new Date() }
    })
      .populate('classId', 'subject branch semester section')
      .sort({ createdAt: -1 });

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sessions' });
  }
});

// Stop session
router.post('/sessions/:id/stop', async (req, res) => {
  try {
    const session = await AttendanceSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (session.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    session.isActive = false;
    await session.save();

    res.json({ message: 'Session stopped successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error stopping session' });
  }
});

// Get attendance for a session
router.get('/sessions/:id/attendance', async (req, res) => {
  try {
    const session = await AttendanceSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (session.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const attendance = await AttendanceRecord.find({ sessionId: session._id })
      .populate('studentId', 'name studentId email')
      .sort({ markedAt: -1 });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attendance' });
  }
});

// Manually add attendance
router.post('/attendance/manual', [
  body('studentId').notEmpty(),
  body('classId').notEmpty(),
  body('sessionId').notEmpty(),
  body('status').isIn(['present', 'absent', 'late']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { studentId, classId, sessionId, status } = req.body;

    // Verify session belongs to teacher
    const session = await AttendanceSession.findById(sessionId);
    if (!session || session.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if already exists
    const existing = await AttendanceRecord.findOne({ studentId, sessionId });
    if (existing) {
      existing.status = status;
      existing.isManual = true;
      existing.markedBy = req.user._id;
      await existing.save();
      return res.json({ message: 'Attendance updated successfully', record: existing });
    }

    const record = new AttendanceRecord({
      studentId,
      classId,
      sessionId,
      status,
      isManual: true,
      markedBy: req.user._id
    });

    await record.save();
    res.json({ message: 'Attendance added successfully', record });
  } catch (error) {
    res.status(500).json({ message: 'Error adding attendance' });
  }
});

// Remove attendance
router.delete('/attendance/:id', async (req, res) => {
  try {
    const record = await AttendanceRecord.findById(req.params.id).populate('sessionId');
    
    if (!record) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    if (record.sessionId.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await record.deleteOne();
    res.json({ message: 'Attendance removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing attendance' });
  }
});

// Get attendance reports
router.get('/reports', async (req, res) => {
  try {
    const { classId, startDate, endDate } = req.query;

    const match = {};
    if (classId) {
      match.classId = classId;
      // Verify class belongs to teacher
      const classData = await Class.findById(classId);
      if (!classData || classData.teacherId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate);
      if (endDate) match.date.$lte = new Date(endDate);
    }

    const attendance = await AttendanceRecord.find(match)
      .populate('studentId', 'name studentId email')
      .populate('classId', 'subject branch semester section')
      .populate('sessionId', 'startTime endTime')
      .sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reports' });
  }
});

// Export attendance as CSV/Excel
router.get('/reports/export', authenticate, authorize('teacher'), async (req, res) => {
  try {
    const { classId, startDate, endDate, format = 'xlsx' } = req.query;

    const match = {};
    if (classId) {
      match.classId = classId;
      const classData = await Class.findById(classId);
      if (!classData || classData.teacherId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate);
      if (endDate) match.date.$lte = new Date(endDate);
    }

    const attendance = await AttendanceRecord.find(match)
      .populate('studentId', 'name studentId email')
      .populate('classId', 'subject branch semester section')
      .populate('sessionId', 'startTime endTime')
      .sort({ date: -1 });

    const data = attendance.map(record => ({
      'Student Name': record.studentId.name,
      'Student ID': record.studentId.studentId,
      'Subject': record.classId.subject,
      'Branch': record.classId.branch,
      'Semester': record.classId.semester,
      'Section': record.classId.section,
      'Date': record.date.toISOString().split('T')[0],
      'Status': record.status,
      'Marked At': record.markedAt.toISOString()
    }));

    if (format === 'csv') {
      const csv = [
        Object.keys(data[0] || {}).join(','),
        ...data.map(row => Object.values(row).join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=attendance.csv');
      res.send(csv);
    } else {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=attendance.xlsx');
      res.send(buffer);
    }
  } catch (error) {
    res.status(500).json({ message: 'Error exporting attendance' });
  }
});

// Export as PDF
router.get('/reports/export/pdf', authenticate, authorize('teacher'), async (req, res) => {
  try {
    const { classId, startDate, endDate } = req.query;

    const match = {};
    if (classId) {
      match.classId = classId;
      const classData = await Class.findById(classId);
      if (!classData || classData.teacherId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate);
      if (endDate) match.date.$lte = new Date(endDate);
    }

    const attendance = await AttendanceRecord.find(match)
      .populate('studentId', 'name studentId email')
      .populate('classId', 'subject branch semester section')
      .sort({ date: -1 });

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=attendance.pdf');
    doc.pipe(res);

    doc.fontSize(20).text('Attendance Report', { align: 'center' });
    doc.moveDown();

    attendance.forEach((record, index) => {
      doc.fontSize(12)
        .text(`${index + 1}. ${record.studentId.name} (${record.studentId.studentId})`, { continued: false })
        .text(`   Subject: ${record.classId.subject} | Date: ${record.date.toISOString().split('T')[0]} | Status: ${record.status}`, { indent: 20 });
      doc.moveDown(0.5);
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ message: 'Error generating PDF' });
  }
});

module.exports = router;

