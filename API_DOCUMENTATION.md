# API Documentation

## Base URL
```
http://localhost:3000/api
```

All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

Some export endpoints also accept token as query parameter for direct download links.

---

## Authentication Endpoints

### Register User
**POST** `/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "student",
  "studentId": "STU001",      // Required for students
  "branch": "CSE",            // Required for students
  "semester": 3,              // Required for students (1-8)
  "section": "A"              // Required for students
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "studentId": "STU001"
  }
}
```

**Error Responses:**
- `400`: Validation error or user already exists
- `500`: Server error

---

### Login
**POST** `/auth/login`

Authenticate and get JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "studentId": "STU001"
  }
}
```

**Error Responses:**
- `401`: Invalid credentials or account disabled

---

### Get Current User
**GET** `/auth/me`

Get authenticated user's information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "studentId": "STU001"
  }
}
```

---

## Teacher Endpoints

All teacher endpoints require authentication and teacher role.

### Create Class
**POST** `/teacher/classes`

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

**Response (201):**
```json
{
  "message": "Class created successfully",
  "class": {
    "_id": "class_id",
    "subject": "Data Structures",
    "branch": "CSE",
    "semester": 3,
    "section": "A",
    "teacherId": "teacher_id",
    "enrolledStudents": [],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### Get Teacher's Classes
**GET** `/teacher/classes`

Get all classes created by the authenticated teacher.

**Response (200):**
```json
[
  {
    "_id": "class_id",
    "subject": "Data Structures",
    "branch": "CSE",
    "semester": 3,
    "section": "A",
    "teacherId": "teacher_id",
    "enrolledStudents": [
      {
        "_id": "student_id",
        "name": "John Doe",
        "studentId": "STU001"
      }
    ]
  }
]
```

---

### Get Class by ID
**GET** `/teacher/classes/:id`

Get detailed information about a specific class.

**Response (200):**
```json
{
  "_id": "class_id",
  "subject": "Data Structures",
  "branch": "CSE",
  "semester": 3,
  "section": "A",
  "teacherId": {
    "_id": "teacher_id",
    "name": "Dr. Smith",
    "email": "smith@example.com"
  },
  "enrolledStudents": [...]
}
```

---

### Enroll Students
**POST** `/teacher/classes/:id/enroll`

Enroll students in a class.

**Request Body:**
```json
{
  "studentIds": ["student_id_1", "student_id_2"]
}
```

---

### Generate QR Code
**POST** `/teacher/sessions/generate`

Generate a time-limited QR code for attendance session.

**Request Body:**
```json
{
  "classId": "class_id",
  "duration": 300000  // Duration in milliseconds (default: 300000 = 5 minutes)
}
```

**Response (200):**
```json
{
  "message": "QR code generated successfully",
  "session": {
    "id": "session_id",
    "sessionToken": "random_token",
    "startTime": "2024-01-01T10:00:00.000Z",
    "endTime": "2024-01-01T10:05:00.000Z",
    "duration": 300000
  },
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

---

### Get Active Sessions
**GET** `/teacher/sessions/active`

Get all active attendance sessions.

**Response (200):**
```json
[
  {
    "_id": "session_id",
    "classId": {
      "_id": "class_id",
      "subject": "Data Structures"
    },
    "startTime": "2024-01-01T10:00:00.000Z",
    "endTime": "2024-01-01T10:05:00.000Z",
    "isActive": true
  }
]
```

---

### Stop Session
**POST** `/teacher/sessions/:id/stop`

Stop an active attendance session.

**Response (200):**
```json
{
  "message": "Session stopped successfully"
}
```

---

### Get Session Attendance
**GET** `/teacher/sessions/:id/attendance`

Get attendance records for a specific session.

**Response (200):**
```json
[
  {
    "_id": "record_id",
    "studentId": {
      "_id": "student_id",
      "name": "John Doe",
      "studentId": "STU001"
    },
    "status": "present",
    "markedAt": "2024-01-01T10:02:00.000Z"
  }
]
```

---

### Manual Attendance
**POST** `/teacher/attendance/manual`

Manually add or update attendance.

**Request Body:**
```json
{
  "studentId": "student_id",
  "classId": "class_id",
  "sessionId": "session_id",
  "status": "present"  // "present", "absent", or "late"
}
```

---

### Get Reports
**GET** `/teacher/reports`

Get attendance reports with optional filters.

**Query Parameters:**
- `classId` (optional): Filter by class
- `startDate` (optional): Start date (ISO format)
- `endDate` (optional): End date (ISO format)

**Response (200):**
```json
[
  {
    "_id": "record_id",
    "studentId": {
      "name": "John Doe",
      "studentId": "STU001"
    },
    "classId": {
      "subject": "Data Structures"
    },
    "date": "2024-01-01T00:00:00.000Z",
    "status": "present"
  }
]
```

---

### Export Reports
**GET** `/teacher/reports/export`

Export attendance as Excel or CSV.

**Query Parameters:**
- `format`: "xlsx" or "csv"
- `classId` (optional)
- `startDate` (optional)
- `endDate` (optional)
- `token`: JWT token (for direct download)

**Response:** File download (Excel or CSV)

---

### Export PDF
**GET** `/teacher/reports/export/pdf`

Export attendance as PDF.

**Query Parameters:**
- `classId` (optional)
- `startDate` (optional)
- `endDate` (optional)
- `token`: JWT token (for direct download)

**Response:** PDF file download

---

## Student Endpoints

All student endpoints require authentication and student role.

### Scan QR Code
**POST** `/student/attendance/scan`

Scan QR code and mark attendance.

**Request Body:**
```json
{
  "sessionToken": "token_from_qr_code",
  "encryptedData": "encrypted_data_from_qr_code"
}
```

**Response (200):**
```json
{
  "message": "Attendance marked successfully",
  "record": {
    "id": "record_id",
    "date": "2024-01-01T00:00:00.000Z",
    "status": "present",
    "class": {
      "subject": "Data Structures",
      "branch": "CSE",
      "semester": 3,
      "section": "A"
    }
  }
}
```

**Error Responses:**
- `400`: Invalid QR code, expired, duplicate attendance, or not enrolled
- `404`: Session not found

---

### Get Attendance History
**GET** `/student/attendance/history`

Get student's attendance history.

**Query Parameters:**
- `classId` (optional)
- `startDate` (optional)
- `endDate` (optional)

**Response (200):**
```json
[
  {
    "_id": "record_id",
    "classId": {
      "subject": "Data Structures",
      "branch": "CSE"
    },
    "date": "2024-01-01T00:00:00.000Z",
    "status": "present"
  }
]
```

---

### Get Enrolled Classes
**GET** `/student/classes`

Get all classes the student is enrolled in.

**Response (200):**
```json
[
  {
    "_id": "class_id",
    "subject": "Data Structures",
    "branch": "CSE",
    "semester": 3,
    "section": "A",
    "teacherId": {
      "name": "Dr. Smith",
      "email": "smith@example.com"
    }
  }
]
```

---

### Get Statistics
**GET** `/student/attendance/statistics`

Get attendance statistics.

**Query Parameters:**
- `classId` (optional): Get statistics for specific class

**Response (200):**
```json
{
  "overall": {
    "total": 50,
    "present": 45,
    "absent": 3,
    "late": 2,
    "percentage": 90.00
  },
  "byClass": [
    {
      "class": {
        "_id": "class_id",
        "subject": "Data Structures"
      },
      "total": 30,
      "present": 28,
      "absent": 1,
      "late": 1,
      "percentage": 93.33
    }
  ]
}
```

---

## Admin Endpoints

All admin endpoints require authentication and admin role.

### Get All Users
**GET** `/admin/users`

Get all users in the system.

**Query Parameters:**
- `role` (optional): Filter by role ("admin", "teacher", "student")
- `isActive` (optional): Filter by active status (true/false)

**Response (200):**
```json
[
  {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "studentId": "STU001",
    "isActive": true
  }
]
```

---

### Create User
**POST** `/admin/users`

Create a new user (admin can create any role).

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123",
  "role": "teacher"
}
```

---

### Update User
**PUT** `/admin/users/:id`

Update user information.

**Request Body:**
```json
{
  "name": "Updated Name",
  "isActive": false
}
```

---

### Delete User
**DELETE** `/admin/users/:id`

Delete a user from the system.

**Response (200):**
```json
{
  "message": "User deleted successfully"
}
```

---

### Get All Classes
**GET** `/admin/classes`

Get all classes in the system.

**Response (200):**
```json
[
  {
    "_id": "class_id",
    "subject": "Data Structures",
    "branch": "CSE",
    "semester": 3,
    "section": "A",
    "teacherId": {
      "name": "Dr. Smith",
      "email": "smith@example.com"
    },
    "enrolledStudents": [...]
  }
]
```

---

### Get Statistics
**GET** `/admin/statistics`

Get system-wide statistics.

**Response (200):**
```json
{
  "totalUsers": 150,
  "totalTeachers": 10,
  "totalStudents": 140,
  "totalClasses": 25,
  "totalAttendance": 5000,
  "todayAttendance": 120
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "message": "Validation error message",
  "errors": [...]  // For validation errors
}
```

### 401 Unauthorized
```json
{
  "message": "No token provided, authorization denied"
}
```

### 403 Forbidden
```json
{
  "message": "Access denied. Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Server error message"
}
```

---

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

Tokens are obtained from:
- `/api/auth/register` - Returns token on successful registration
- `/api/auth/login` - Returns token on successful login

Token expiration is configured via `JWT_EXPIRE` environment variable (default: 7 days).

---

## Rate Limiting

Currently, there is no rate limiting implemented. For production use, consider adding rate limiting middleware.

---

## Notes

1. All dates are in ISO 8601 format
2. Duration values are in milliseconds
3. QR codes expire automatically after the specified duration
4. Duplicate attendance entries are prevented at the database level
5. Student enrollment is validated before marking attendance

