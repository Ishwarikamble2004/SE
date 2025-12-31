# Project Structure

```
SE-APP/
│
├── server.js                 # Main Express server entry point
├── package.json              # Node.js dependencies and scripts
├── .env                      # Environment variables (create this)
├── .gitignore               # Git ignore file
│
├── models/                   # MongoDB Mongoose models
│   ├── User.js              # User model (Admin, Teacher, Student)
│   ├── Class.js             # Class model
│   ├── AttendanceSession.js # QR session model
│   └── AttendanceRecord.js  # Attendance record model
│
├── routes/                   # Express route handlers
│   ├── auth.js              # Authentication routes (register, login)
│   ├── admin.js             # Admin routes (user management, statistics)
│   ├── teacher.js           # Teacher routes (classes, QR, reports)
│   └── student.js           # Student routes (scan, history, stats)
│
├── middleware/               # Express middleware
│   └── auth.js              # JWT authentication & authorization
│
├── public/                   # Frontend static files
│   ├── index.html           # Main HTML file (all dashboards)
│   ├── styles.css           # CSS styling
│   └── app.js               # Frontend JavaScript
│
└── Documentation/
    ├── README.md            # Main documentation
    ├── API_DOCUMENTATION.md # Complete API reference
    ├── SETUP_GUIDE.md       # Detailed setup instructions
    ├── QUICK_START.md       # Quick start guide
    └── PROJECT_STRUCTURE.md # This file
```

## File Descriptions

### Backend Files

**server.js**
- Express server configuration
- MongoDB connection
- Route mounting
- Static file serving

**models/User.js**
- User schema with roles (admin, teacher, student)
- Password hashing (bcrypt)
- Student-specific fields (studentId, branch, semester, section)

**models/Class.js**
- Class schema (subject, branch, semester, section)
- Teacher reference
- Enrolled students array

**models/AttendanceSession.js**
- QR session schema
- Encrypted session data generation
- Session decryption methods
- Time-based expiration

**models/AttendanceRecord.js**
- Attendance record schema
- Prevents duplicate entries (unique index)
- Status tracking (present, absent, late)

**routes/auth.js**
- User registration
- User login
- Get current user info

**routes/admin.js**
- User management (CRUD)
- Class viewing
- System statistics

**routes/teacher.js**
- Class creation and management
- QR code generation
- Session management
- Attendance reports
- Export functionality (CSV, Excel, PDF)

**routes/student.js**
- QR code scanning
- Attendance marking
- Attendance history
- Statistics viewing

**middleware/auth.js**
- JWT token verification
- Role-based authorization
- User authentication

### Frontend Files

**public/index.html**
- Single-page application
- Login/Register forms
- Student dashboard
- Teacher dashboard
- Admin dashboard

**public/styles.css**
- Modern, responsive design
- Dark mode support
- Mobile-friendly styles

**public/app.js**
- Frontend JavaScript logic
- API communication
- QR code scanning (jsQR library)
- Camera access
- Dynamic content rendering

## Database Collections

1. **users** - All users (admin, teacher, student)
2. **classes** - Class information
3. **attendancesessions** - Active QR sessions
4. **attendancerecords** - Attendance records

## Key Features by File

### Security
- `models/User.js` - Password hashing
- `models/AttendanceSession.js` - Encrypted QR data
- `middleware/auth.js` - JWT authentication
- `routes/*.js` - Role-based access control

### QR Code Functionality
- `routes/teacher.js` - QR generation
- `models/AttendanceSession.js` - Session encryption
- `routes/student.js` - QR scanning & validation
- `public/app.js` - Camera access & QR scanning

### Reporting
- `routes/teacher.js` - Report generation
- Export formats: CSV, Excel, PDF

## Environment Variables

Required in `.env`:
- `PORT` - Server port (default: 3000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRE` - Token expiration (default: 7d)
- `QR_SESSION_DURATION` - Default QR duration in ms

## Dependencies

### Backend
- express - Web framework
- mongoose - MongoDB ODM
- bcryptjs - Password hashing
- jsonwebtoken - JWT authentication
- qrcode - QR code generation
- xlsx - Excel export
- pdfkit - PDF export
- express-validator - Input validation
- cors - CORS support
- dotenv - Environment variables

### Frontend (CDN)
- jsQR - QR code scanning library

## API Endpoints Summary

### Authentication
- POST `/api/auth/register` - Register user
- POST `/api/auth/login` - Login user
- GET `/api/auth/me` - Get current user

### Teacher
- POST `/api/teacher/classes` - Create class
- GET `/api/teacher/classes` - Get classes
- POST `/api/teacher/sessions/generate` - Generate QR
- GET `/api/teacher/reports` - Get reports
- GET `/api/teacher/reports/export` - Export reports

### Student
- POST `/api/student/attendance/scan` - Scan QR
- GET `/api/student/attendance/history` - Get history
- GET `/api/student/attendance/statistics` - Get stats

### Admin
- GET `/api/admin/users` - Get users
- POST `/api/admin/users` - Create user
- GET `/api/admin/statistics` - Get statistics

## Development Workflow

1. **Backend Changes:**
   - Edit files in `routes/`, `models/`, or `middleware/`
   - Server auto-reloads with `npm run dev`

2. **Frontend Changes:**
   - Edit files in `public/`
   - Refresh browser to see changes

3. **Database Changes:**
   - Modify schemas in `models/`
   - Restart server
   - Clear database if needed: `db.dropDatabase()` in mongosh

## Testing Checklist

- [ ] User registration (all roles)
- [ ] User login (all roles)
- [ ] Admin: Create users
- [ ] Teacher: Create class
- [ ] Teacher: Generate QR code
- [ ] Student: Scan QR code
- [ ] Student: View attendance history
- [ ] Teacher: View reports
- [ ] Teacher: Export reports
- [ ] Admin: View statistics
- [ ] Security: Duplicate attendance prevention
- [ ] Security: QR code expiration

## Production Considerations

1. **Security:**
   - Change JWT_SECRET
   - Use HTTPS
   - Enable MongoDB authentication
   - Add rate limiting
   - Input sanitization

2. **Performance:**
   - Database indexing
   - Caching
   - CDN for static files
   - Database connection pooling

3. **Monitoring:**
   - Error logging
   - Performance monitoring
   - User activity tracking

4. **Backup:**
   - Regular database backups
   - Environment variable backup
   - Code version control

---

**Last Updated:** 2024

