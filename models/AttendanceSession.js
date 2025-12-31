const mongoose = require('mongoose');
const crypto = require('crypto');

const attendanceSessionSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionToken: {
    type: String,
    required: true,
    unique: true
  },
  encryptedData: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    default: 300000 // 5 minutes in milliseconds
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate session token and encrypted data
attendanceSessionSchema.statics.generateSession = function(classId, teacherId, duration = 300000) {
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const data = {
    classId: classId.toString(),
    teacherId: teacherId.toString(),
    timestamp: Date.now(),
    duration: duration
  };
  
  const algorithm = 'aes-256-cbc';
  const secret = process.env.JWT_SECRET || 'default-secret';
  const key = crypto.scryptSync(secret, 'salt', 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Combine IV with encrypted data
  const encryptedData = iv.toString('hex') + ':' + encrypted;
  
  return {
    sessionToken,
    encryptedData: encryptedData,
    endTime: new Date(Date.now() + duration)
  };
};

// Decrypt session data
attendanceSessionSchema.statics.decryptSession = function(encryptedData) {
  try {
    const algorithm = 'aes-256-cbc';
    const secret = process.env.JWT_SECRET || 'default-secret';
    const key = crypto.scryptSync(secret, 'salt', 32);
    
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch (error) {
    return null;
  }
};

module.exports = mongoose.model('AttendanceSession', attendanceSessionSchema);

