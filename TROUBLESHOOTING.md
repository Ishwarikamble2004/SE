# Troubleshooting Guide

## Registration Issues

### Issue: "Can't register" or Registration not working

#### Step 1: Check Browser Console
1. Open browser Developer Tools (F12)
2. Go to "Console" tab
3. Try to register again
4. Look for any red error messages
5. Share the error message you see

#### Step 2: Check Network Tab
1. Open Developer Tools (F12)
2. Go to "Network" tab
3. Try to register
4. Look for the `/api/auth/register` request
5. Click on it and check:
   - Status code (should be 201 for success, 400 for error)
   - Response tab - see what the server returned

#### Step 3: Check Server Console
Look at your terminal where the server is running. You should see:
- Any error messages
- "Registration error:" messages

#### Step 4: Common Issues

**A. Validation Errors:**
- Make sure all required fields are filled
- For students: Student ID, Branch, Semester, Section are required
- Password must be at least 6 characters
- Email must be valid format

**B. Duplicate Email:**
- Error: "User already exists with this email"
- Solution: Use a different email address

**C. Duplicate Student ID:**
- Error: "Student ID already exists"
- Solution: Use a different Student ID

**D. MongoDB Connection:**
- Make sure MongoDB is running
- Check `.env` file has correct `MONGODB_URI`

**E. Server Not Running:**
- Make sure server is running on port 4000
- Check terminal for "Server running on port 4000"

### Quick Fixes

1. **Clear browser cache and reload:**
   - Press Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

2. **Check if server is running:**
   ```powershell
   # Should see "Server running on port 4000"
   ```

3. **Check MongoDB:**
   ```powershell
   mongosh
   # Should connect successfully
   ```

4. **Try a different browser:**
   - Chrome, Firefox, Edge

5. **Check .env file:**
   - Make sure it exists
   - Check MONGODB_URI is correct

## Still Having Issues?

1. **Check the exact error message** in browser console
2. **Check server logs** in terminal
3. **Verify:**
   - Server is running
   - MongoDB is running
   - Port 4000 is accessible
   - No firewall blocking

## Test Registration with cURL

You can test the registration API directly:

```powershell
# For Admin/Teacher
curl -X POST http://localhost:4000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"name\":\"Test User\",\"email\":\"test@example.com\",\"password\":\"password123\",\"role\":\"admin\"}'

# For Student
curl -X POST http://localhost:4000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"name\":\"Test Student\",\"email\":\"student@example.com\",\"password\":\"password123\",\"role\":\"student\",\"studentId\":\"STU001\",\"branch\":\"CSE\",\"semester\":3,\"section\":\"A\"}'
```

This will show you the exact error from the server.

