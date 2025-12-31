# Setup Guide - Student Attendance Management System

This guide will walk you through setting up and running the Student Attendance Management System step by step.

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v14 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **MongoDB** 
   - Option 1: Local MongoDB installation
     - Download from: https://www.mongodb.com/try/download/community
     - Follow installation instructions for your OS
   - Option 2: MongoDB Atlas (Cloud)
     - Sign up at: https://www.mongodb.com/cloud/atlas
     - Create a free cluster

3. **npm** (comes with Node.js)
   - Verify: `npm --version`

4. **Git** (optional, for cloning)
   - Download from: https://git-scm.com/

## Step-by-Step Setup

### Step 1: Project Setup

1. Navigate to your project directory:
   ```bash
   cd SE-APP
   ```

2. Verify you're in the correct directory (should contain `package.json`, `server.js`, etc.)

### Step 2: Install Dependencies

Run the following command to install all required packages:

```bash
npm install
```

This will install:
- Express.js (web framework)
- Mongoose (MongoDB ODM)
- bcryptjs (password hashing)
- jsonwebtoken (JWT authentication)
- qrcode (QR code generation)
- jsQR (QR code scanning - loaded via CDN in frontend)
- xlsx (Excel export)
- pdfkit (PDF export)
- And other dependencies

**Expected output:** You should see a `node_modules` folder created.

### Step 3: Configure Environment Variables

1. Create a `.env` file in the root directory (same level as `package.json`)

2. Copy the following content into `.env`:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/attendance-system
JWT_SECRET=change-this-to-a-random-secret-key-in-production
JWT_EXPIRE=7d
QR_SESSION_DURATION=300000
```

3. **Important Security Note:**
   - Replace `JWT_SECRET` with a strong random string
   - You can generate one using: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - Or use an online generator

4. **MongoDB Configuration:**
   - For **local MongoDB**: Use `mongodb://localhost:27017/attendance-system`
   - For **MongoDB Atlas**: Use your connection string from Atlas dashboard
     - Format: `mongodb+srv://username:password@cluster.mongodb.net/attendance-system`

### Step 4: Start MongoDB

#### For Local MongoDB:

**Windows:**
```bash
# If MongoDB is installed as a service, it should start automatically
# Or run manually:
mongod
```

**macOS:**
```bash
# Using Homebrew:
brew services start mongodb-community

# Or manually:
mongod --config /usr/local/etc/mongod.conf
```

**Linux:**
```bash
sudo systemctl start mongod
# Or
sudo service mongod start
```

**Verify MongoDB is running:**
```bash
# Open a new terminal and run:
mongosh
# Or older versions:
mongo
```

If you see the MongoDB shell prompt, you're good to go!

#### For MongoDB Atlas:

1. Log in to your Atlas account
2. Create a cluster (free tier is fine)
3. Create a database user
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get your connection string and update `.env`

### Step 5: Run the Application

#### Development Mode (with auto-reload):

```bash
npm run dev
```

This uses `nodemon` to automatically restart the server when you make changes.

#### Production Mode:

```bash
npm start
```

**Expected output:**
```
MongoDB connected successfully
Server running on port 3000
```

### Step 6: Access the Application

Open your web browser and navigate to:

```
http://localhost:3000
```

You should see the login page.

## Creating Your First User

### Option 1: Register via UI

1. Click on the "Register" link on the login page
2. Select your role (Admin, Teacher, or Student)
3. Fill in the registration form
4. Click "Register"

### Option 2: Create Admin via MongoDB

If you need to create an admin user directly in the database:

1. Open MongoDB shell:
   ```bash
   mongosh
   # Or: mongo
   ```

2. Switch to the database:
   ```javascript
   use attendance-system
   ```

3. Create an admin user (password will be hashed automatically on first save):
   ```javascript
   db.users.insertOne({
     name: "Admin User",
     email: "admin@example.com",
     password: "$2a$10$YourHashedPasswordHere", // Use bcrypt to hash
     role: "admin",
     isActive: true,
     createdAt: new Date()
   })
   ```

   **Note:** For password hashing, you can use an online bcrypt generator or create a small Node.js script.

## Testing the System

### Test as Admin:

1. Login with admin credentials
2. Create a teacher user
3. Create a student user
4. View statistics

### Test as Teacher:

1. Login with teacher credentials
2. Create a class (e.g., "Data Structures", "CSE", "3", "A")
3. Generate a QR code for attendance
4. View the QR code (it will be displayed on screen)
5. View reports

### Test as Student:

1. Login with student credentials
2. Use a mobile device or another browser window
3. Scan the QR code generated by the teacher
4. View attendance history and statistics

## Troubleshooting

### Issue: "MongoDB connection error"

**Solutions:**
- Ensure MongoDB is running: `mongosh` or `mongo` should work
- Check `MONGODB_URI` in `.env` file
- For Atlas: Verify connection string, username, password, and IP whitelist
- Check MongoDB logs for errors

### Issue: "Port 3000 already in use"

**Solutions:**
- Change `PORT` in `.env` to a different port (e.g., 3001)
- Or stop the process using port 3000:
  - Windows: `netstat -ano | findstr :3000` then `taskkill /PID <pid> /F`
  - macOS/Linux: `lsof -ti:3000 | xargs kill`

### Issue: "Cannot find module"

**Solutions:**
- Run `npm install` again
- Delete `node_modules` and `package-lock.json`, then run `npm install`
- Check Node.js version: `node --version` (should be v14+)

### Issue: "Camera not working"

**Solutions:**
- Ensure you're using HTTPS (required for camera access in most browsers)
- For local development, use `http://localhost` (works for localhost)
- Grant camera permissions in browser settings
- Try a different browser (Chrome, Firefox, Edge)

### Issue: "QR code not scanning"

**Solutions:**
- Ensure good lighting
- Hold camera steady
- Check if QR code has expired (they expire after the set duration)
- Verify QR code is fully visible in camera view

### Issue: "JWT token errors"

**Solutions:**
- Check `JWT_SECRET` in `.env` file
- Ensure token is being sent in Authorization header
- Check token expiration (default: 7 days)
- Try logging in again to get a new token

## Development Tips

1. **Database Reset:**
   - To clear all data: `mongosh` → `use attendance-system` → `db.dropDatabase()`

2. **View Database:**
   - Use MongoDB Compass (GUI) or mongosh shell
   - Collections: `users`, `classes`, `attendancesessions`, `attendancerecords`

3. **Debug Mode:**
   - Check server console for error messages
   - Use browser developer tools (F12) for frontend debugging
   - Check Network tab for API requests/responses

4. **Hot Reload:**
   - Use `npm run dev` for automatic server restart on file changes
   - Frontend changes require manual page refresh

## Production Deployment

For production deployment:

1. **Environment Variables:**
   - Use strong `JWT_SECRET`
   - Use secure MongoDB connection string
   - Set appropriate `PORT`

2. **Security:**
   - Enable HTTPS
   - Use environment-specific configurations
   - Implement rate limiting
   - Add input sanitization
   - Regular security updates

3. **Database:**
   - Use MongoDB Atlas or managed MongoDB service
   - Enable authentication
   - Regular backups

4. **Hosting:**
   - Deploy backend to services like Heroku, Railway, or AWS
   - Deploy frontend to Netlify, Vercel, or similar
   - Or use a full-stack hosting solution

## Next Steps

1. Create your first admin account
2. Create teacher and student accounts
3. Set up classes
4. Test QR code generation and scanning
5. Explore all features

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review error messages in console
3. Check MongoDB connection
4. Verify environment variables
5. Review API documentation

---

**Happy coding! 🚀**

