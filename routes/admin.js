const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Class = require('../models/Class');
const AttendanceRecord = require('../models/AttendanceRecord');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication
router.use(authenticate);

// Get users endpoint - allow teachers too (for enrollment)
router.get('/users', async (req, res) => {
  try {
    // Allow both admin and teacher to access
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { role, isActive } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Other admin routes require admin role
router.use(authorize('admin'));

// Get user by ID
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user' });
  }
});

// Create user
router.post('/users', [
  body('name').trim().notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['admin', 'teacher', 'student']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role, studentId, branch, semester, section } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    if (role === 'student' && studentId) {
      const existingStudent = await User.findOne({ studentId });
      if (existingStudent) {
        return res.status(400).json({ message: 'Student ID already exists' });
      }
    }

    const user = new User({
      name,
      email,
      password,
      role,
      studentId: role === 'student' ? studentId : undefined,
      branch: role === 'student' ? branch : undefined,
      semester: role === 'student' ? semester : undefined,
      section: role === 'student' ? section : undefined
    });

    await user.save();
    res.status(201).json({ message: 'User created successfully', user: user.toObject({ transform: (doc, ret) => { delete ret.password; return ret; } }) });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user' });
  }
});

// Update user
router.put('/users/:id', async (req, res) => {
  try {
    const { name, email, role, studentId, branch, semester, section, isActive } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (studentId) user.studentId = studentId;
    if (branch !== undefined) user.branch = branch;
    if (semester !== undefined) user.semester = semester;
    if (section !== undefined) user.section = section;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();
    res.json({ message: 'User updated successfully', user: user.toObject({ transform: (doc, ret) => { delete ret.password; return ret; } }) });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    await user.deleteOne();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// Get all classes
router.get('/classes', async (req, res) => {
  try {
    const classes = await Class.find().populate('teacherId', 'name email').populate('enrolledStudents', 'name studentId').sort({ createdAt: -1 });
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching classes' });
  }
});

// Get statistics
router.get('/statistics', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalClasses = await Class.countDocuments();
    const totalAttendance = await AttendanceRecord.countDocuments();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAttendance = await AttendanceRecord.countDocuments({ date: { $gte: today } });

    res.json({
      totalUsers,
      totalTeachers,
      totalStudents,
      totalClasses,
      totalAttendance,
      todayAttendance
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching statistics' });
  }
});

module.exports = router;
