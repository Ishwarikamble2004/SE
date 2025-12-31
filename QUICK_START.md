# Quick Start Guide

Get up and running in 5 minutes!

## 1. Install Dependencies

```bash
npm install
```

## 2. Create `.env` File

Create a `.env` file in the root directory:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/attendance-system
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d
QR_SESSION_DURATION=300000
```

## 3. Start MongoDB

**Windows:**
```bash
mongod
```

**macOS/Linux:**
```bash
sudo systemctl start mongod
# or
brew services start mongodb-community
```

## 4. Run the Application

```bash
npm start
# or for development with auto-reload:
npm run dev
```

## 5. Open Browser

Navigate to: `http://localhost:3000`

## 6. Register Your First User

1. Click "Register"
2. Select role (Admin, Teacher, or Student)
3. Fill in the form
4. Click "Register"

## That's it! 🎉

You're ready to use the system. For detailed setup instructions, see `SETUP_GUIDE.md`.

## Common Commands

```bash
# Install dependencies
npm install

# Start server (production)
npm start

# Start server (development with auto-reload)
npm run dev

# Check MongoDB connection
mongosh
# Then: use attendance-system
```

## Default Configuration

- **Port:** 3000
- **Database:** attendance-system
- **QR Duration:** 5 minutes (300000 ms)
- **JWT Expiry:** 7 days

## Need Help?

- See `SETUP_GUIDE.md` for detailed instructions
- See `README.md` for feature overview
- See `API_DOCUMENTATION.md` for API details

