# Next Steps - Getting Started with Your Attendance System

## ✅ Current Status
- ✅ Server is running on port **4000**
- ✅ MongoDB is connected successfully
- ✅ All dependencies installed

## 🚀 Immediate Next Steps

### Step 1: Open the Application in Browser

Open your web browser and navigate to:
```
http://localhost:4000
```

You should see the login page with role selector buttons (Student, Teacher, Admin).

---

### Step 2: Create Your First Admin Account

1. **Click "Register"** on the login page
2. **Select "Admin"** role
3. Fill in the registration form:
   - Name: Your name
   - Email: admin@example.com (or your email)
   - Password: Choose a strong password
4. **Click "Register"**

You'll be automatically logged in and redirected to the Admin Dashboard.

---

### Step 3: Create Teacher and Student Accounts

#### Option A: Via Admin Dashboard (Recommended)
1. Once logged in as Admin, you'll see the Admin Dashboard
2. Click **"Create User"** button
3. Create a Teacher:
   - Name: Teacher Name
   - Email: teacher@example.com
   - Password: (choose password)
   - Role: Teacher
4. Create Students:
   - Name: Student Name
   - Email: student@example.com
   - Password: (choose password)
   - Role: Student
   - Student ID: STU001 (unique for each student)
   - Branch: CSE (or your branch)
   - Semester: 3 (1-8)
   - Section: A (or your section)

#### Option B: Via Registration Page
- Students and Teachers can also register themselves
- Go back to login page and click "Register"
- Select appropriate role and fill the form

---

### Step 4: Test as Teacher

1. **Logout** from Admin account
2. **Login** with Teacher credentials
3. **Create a Class:**
   - Subject: Data Structures
   - Branch: CSE
   - Semester: 3
   - Section: A
   - Click "Create Class"

4. **Generate QR Code:**
   - Select the class you just created
   - Set duration (default: 5 minutes)
   - Click "Generate QR Code"
   - A QR code will appear on screen

5. **Display QR Code:**
   - Keep the QR code visible on screen
   - Or print it out
   - Students will scan this to mark attendance

---

### Step 5: Test as Student

1. **Open a new browser window/tab** (or use mobile device)
2. Navigate to: `http://localhost:4000`
3. **Login** with Student credentials
4. **Scan QR Code:**
   - Click "Start Camera" button
   - Point camera at the QR code displayed by teacher
   - Attendance will be marked automatically
   - You'll see a success message

5. **View Attendance:**
   - Check "Attendance History" section
   - View "Statistics" for attendance percentage

---

### Step 6: View Reports (Teacher)

1. **Login as Teacher**
2. **View Reports:**
   - Select class (optional)
   - Select date range (optional)
   - Click "View Report"
   - See attendance records

3. **Export Reports:**
   - Click "Export Excel" for .xlsx file
   - Click "Export CSV" for .csv file
   - Click "Export PDF" for .pdf file

---

## 📱 Testing QR Code Scanning

### Using Mobile Device:
1. Make sure your mobile device is on the same network
2. Find your computer's IP address:
   - Windows: `ipconfig` (look for IPv4 Address)
   - Example: `192.168.1.100`
3. On mobile browser, go to: `http://192.168.1.100:4000`
4. Login as student
5. Scan the QR code from teacher's screen

### Using Same Computer:
- Open the app in two browser windows
- One for Teacher (generate QR)
- One for Student (scan QR)

---

## 🎯 Quick Test Checklist

- [ ] Server running on port 4000
- [ ] MongoDB connected
- [ ] Can access `http://localhost:4000`
- [ ] Created Admin account
- [ ] Created Teacher account
- [ ] Created Student account
- [ ] Teacher can create class
- [ ] Teacher can generate QR code
- [ ] Student can scan QR code
- [ ] Attendance is marked successfully
- [ ] Student can view attendance history
- [ ] Teacher can view reports
- [ ] Teacher can export reports

---

## 🔧 Common Issues & Solutions

### Issue: Can't access the application
**Solution:** 
- Check if server is running (should see "Server running on port 4000")
- Try `http://127.0.0.1:4000` instead
- Check firewall settings

### Issue: Camera not working for QR scanning
**Solution:**
- Grant camera permissions in browser
- Use HTTPS or localhost (camera works on localhost)
- Try different browser (Chrome, Firefox, Edge)

### Issue: QR code not scanning
**Solution:**
- Ensure good lighting
- Hold camera steady
- Check if QR code expired (they expire after set duration)
- Make sure QR code is fully visible

### Issue: "Not enrolled in this class"
**Solution:**
- Teacher needs to enroll students in the class
- Or students need to be added to `enrolledStudents` array

---

## 📚 Additional Resources

- **README.md** - Complete feature overview
- **API_DOCUMENTATION.md** - API reference for developers
- **SETUP_GUIDE.md** - Detailed setup instructions
- **QUICK_START.md** - Quick reference guide

---

## 🎉 You're All Set!

Your Student Attendance Management System is ready to use. Start by creating accounts and testing the QR code functionality. If you encounter any issues, refer to the troubleshooting section or check the documentation files.

**Happy teaching! 🎓**

