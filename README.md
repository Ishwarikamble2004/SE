# Student Attendance Management System

A complete web-based attendance management system using QR code scanning technology. This system allows teachers to generate time-limited QR codes for attendance sessions, and students can scan them using their device cameras to mark attendance automatically.

## 🎯 Features

### 👨‍💼 Admin Features
- User management (create, update, delete, enable/disable users)
- View all classes and statistics
- Overall system statistics dashboard

### 👩‍🏫 Teacher Features
- Create and manage classes (subject, branch, semester, section)
- Generate time-limited QR codes for attendance sessions
- Start and stop attendance sessions
- View real-time attendance lists
- Manually edit attendance (add/remove students)
- View attendance reports (daily, weekly, subject-wise)
- Export attendance as CSV, Excel, or PDF

### 🎓 Student Features
- Login with student credentials
- Scan QR codes using device camera
- Automatic attendance marking (with validation)
- View personal attendance history
- View attendance statistics and percentage

## 🛡️ Security Features

- Secure authentication with JWT tokens
- Password hashing using bcrypt
- Role-based access control
- Encrypted QR code session data
- Time-limited QR codes (auto-expire)
- Duplicate attendance prevention
- Student enrollment validation

## 🧱 Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla JS)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **QR Code**: QRCode library for generation, jsQR for scanning
- **Authentication**: JWT (JSON Web Tokens)
- **Export**: XLSX, PDFKit

## 📦 Installation & Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### Step 1: Clone/Download the Project

```bash
cd SE-APP
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Environment Configuration

Create a `.env` file in the root directory:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/attendance-system
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
QR_SESSION_DURATION=300000
```

**Important**: Change `JWT_SECRET` to a strong random string in production!

### Step 4: Start MongoDB

Make sure MongoDB is running on your system:

```bash
# Windows
mongod

# macOS/Linux
sudo systemctl start mongod
# or
mongod
```

### Step 5: Run the Application

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The application will be available at `http://localhost:3000`

## 📊 Database Schema

### User Model
- `name`: String (required)
- `email`: String (required, unique)
- `password`: String (required, hashed)
- `role`: Enum ['admin', 'teacher', 'student'] (required)
- `studentId`: String (for students, unique)
- `branch`: String (for students)
- `semester`: Number (1-8, for students)
- `section`: String (for students)
- `isActive`: Boolean (default: true)

### Class Model
- `subject`: String (required)
- `branch`: String (required)
- `semester`: Number (required, 1-8)
- `section`: String (required)
- `teacherId`: ObjectId (ref: User)
- `enrolledStudents`: Array of ObjectId (ref: User)

### AttendanceSession Model
- `classId`: ObjectId (ref: Class)
- `teacherId`: ObjectId (ref: User)
- `sessionToken`: String (unique, required)
- `encryptedData`: String (required)
- `startTime`: Date (default: now)
- `endTime`: Date (required)
- `duration`: Number (milliseconds, default: 300000 = 5 minutes)
- `isActive`: Boolean (default: true)

### AttendanceRecord Model
- `studentId`: ObjectId (ref: User)
- `classId`: ObjectId (ref: Class)
- `sessionId`: ObjectId (ref: AttendanceSession)
- `date`: Date (default: now)
- `status`: Enum ['present', 'absent', 'late'] (default: 'present')
- `markedAt`: Date (default: now)
- `isManual`: Boolean (default: false)
- `markedBy`: ObjectId (ref: User, for manual entries)

## 🔌 API Documentation

### Authentication Endpoints

#### POST `/api/auth/register`
Register a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "student",
  "studentId": "STU001",
  "branch": "CSE",
  "semester": 3,
  "section": "A"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "jwt_token_here",
  "user": { ... }
}
```

#### POST `/api/auth/login`
Login user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### GET `/api/auth/me`
Get current user (requires authentication).

---

### Teacher Endpoints

All teacher endpoints require authentication and teacher role.

#### POST `/api/teacher/classes`
Create a new class.

**Request Body:**
```json
{
  "subject": "Data Structures",
  "branch": "CSE",
  "semester": 3,
  "section": "A"
}
```

#### GET `/api/teacher/classes`
Get all classes created by the teacher.

#### POST `/api/teacher/sessions/generate`
Generate QR code for attendance session.

**Request Body:**
```json
{
  "classId": "class_id_here",
  "duration": 300000
}
```

**Response:**
```json
{
  "message": "QR code generated successfully",
  "session": { ... },
  "qrCode": "data:image/png;base64,..."
}
```

#### GET `/api/teacher/sessions/active`
Get all active sessions.

#### POST `/api/teacher/sessions/:id/stop`
Stop an active session.

#### GET `/api/teacher/sessions/:id/attendance`
Get attendance records for a session.

#### GET `/api/teacher/reports`
Get attendance reports with filters.

**Query Parameters:**
- `classId` (optional)
- `startDate` (optional, ISO format)
- `endDate` (optional, ISO format)

#### GET `/api/teacher/reports/export?format=xlsx&classId=...&startDate=...&endDate=...&token=...`
Export attendance as Excel/CSV.

**Query Parameters:**
- `format`: 'xlsx' or 'csv'
- `classId` (optional)
- `startDate` (optional)
- `endDate` (optional)
- `token`: JWT token for authentication

#### GET `/api/teacher/reports/export/pdf?classId=...&startDate=...&endDate=...&token=...`
Export attendance as PDF.

---

### Student Endpoints

All student endpoints require authentication and student role.

#### POST `/api/student/attendance/scan`
Scan QR code and mark attendance.

**Request Body:**
```json
{
  "sessionToken": "token_from_qr",
  "encryptedData": "encrypted_data_from_qr"
}
```

#### GET `/api/student/attendance/history`
Get attendance history.

**Query Parameters:**
- `classId` (optional)
- `startDate` (optional)
- `endDate` (optional)

#### GET `/api/student/classes`
Get enrolled classes.

#### GET `/api/student/attendance/statistics`
Get attendance statistics.

---

### Admin Endpoints

All admin endpoints require authentication and admin role.

#### GET `/api/admin/users`
Get all users.

**Query Parameters:**
- `role` (optional): Filter by role
- `isActive` (optional): Filter by active status

#### POST `/api/admin/users`
Create a new user.

#### PUT `/api/admin/users/:id`
Update a user.

#### DELETE `/api/admin/users/:id`
Delete a user.

#### GET `/api/admin/classes`
Get all classes.

#### GET `/api/admin/statistics`
Get system statistics.

## 🚀 Usage Guide

### For Teachers

1. **Login** with your teacher credentials
2. **Create a Class**: Fill in subject, branch, semester, and section
3. **Generate QR Code**: 
   - Select a class
   - Set duration (in minutes)
   - Click "Generate QR Code"
   - Display the QR code to students
4. **View Reports**: Filter by class and date range, export as needed

### For Students

1. **Login** with your student credentials
2. **Scan QR Code**:
   - Click "Start Camera"
   - Point camera at the QR code displayed by teacher
   - Attendance will be marked automatically
3. **View History**: Check your attendance records and statistics

### For Admins

1. **Login** with admin credentials
2. **Manage Users**: Create, update, enable/disable users
3. **View Statistics**: Monitor system-wide statistics
4. **View Classes**: See all classes in the system

## 🔒 Security Notes

1. **Change JWT_SECRET**: Use a strong, random secret in production
2. **HTTPS**: Use HTTPS in production for secure communication
3. **MongoDB**: Secure your MongoDB instance (use authentication)
4. **Rate Limiting**: Consider adding rate limiting for production
5. **Input Validation**: All inputs are validated, but review for your use case
6. **xlsx Package**: The `xlsx` package has known vulnerabilities (prototype pollution, ReDoS). For production, consider using an alternative like `exceljs` or `xlsx-populate`. The current implementation is relatively safe as it only exports controlled data, but be aware of this limitation.

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env` file
- Verify MongoDB port (default: 27017)

### Camera Not Working
- Ensure browser permissions for camera are granted
- Use HTTPS (required for camera access in most browsers)
- Try a different browser

### QR Code Not Scanning
- Ensure good lighting
- Hold camera steady
- Check if QR code has expired

## 📝 License

This project is open source and available for educational purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions, please open an issue in the repository.

---

**Built with ❤️ for efficient attendance management**

