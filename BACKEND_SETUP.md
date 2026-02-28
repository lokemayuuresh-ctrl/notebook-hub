# Backend Setup & API Error Fixes

## 🔴 Current Errors

| Error | Status | Cause | Fix |
|-------|--------|-------|-----|
| `/api/auth/verify` 401 | ✅ Expected | Guest user not logged in | Normal behavior |
| `/api/orders` 401 | ✅ Expected | Guest user not logged in | Normal behavior |
| `/api/products` 500 | ❌ Backend Issue | Database connection failed | See below |

---

## 🔧 Fixing the 500 Products Error

### Root Cause
Backend is having trouble connecting to MongoDB and seeding product data.

### Solution 1: Install Missing Dependencies (Most Likely Fix)

```bash
cd backend
npm install
npm start
```

**Look for this in the console output:**
```
✅ GOOD: Connected to local MongoDB at mongodb://127.0.0.1:27017/...
✅ GOOD: Inserted seed products into DB (count: XX)
✅ GOOD: Server listening on port 5000

❌ BAD: MongoDB connection error...
❌ BAD: Error connecting to database
```

If you see an error, continue to Solution 2.

---

### Solution 2: Check MongoDB Installation

MongoDB needs to be installed and running.

#### **Option A: Use MongoDB Cloud Atlas (Recommended)**

1. **Create free account**
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up for free tier

2. **Create cluster and get connection string**
   - Create database → Get connection string
   - Should look like: `mongodb+srv://user:pass@cluster.mongodb.net/dbname`

3. **Set environment variable**
   ```bash
   # In backend/.env file, add:
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/notebook-hub
   ```

4. **Start backend**
   ```bash
   cd backend
   npm start
   ```

#### **Option B: Use Local MongoDB**

**Windows:**
```bash
# 1. Install MongoDB Community Edition
# Download from: https://www.mongodb.com/try/download/community

# 2. Start MongoDB service
net start MongoDB
# or use MongoDB Compass GUI

# 3. Start backend
cd backend
npm start
```

**Mac:**
```bash
# 1. Install MongoDB via Homebrew
brew tap mongodb/brew
brew install mongodb-community

# 2. Start MongoDB
brew services start mongodb-community

# 3. Start backend
cd backend
npm start
```

**Linux (Ubuntu):**
```bash
# 1. Install MongoDB
sudo apt-get install -y mongodb

# 2. Start MongoDB
sudo systemctl start mongodb

# 3. Start backend
cd backend
npm start
```

#### **Option C: Use In-Memory MongoDB (Development Only)**

If you don't want to install MongoDB, the backend auto-falls back to in-memory:

```bash
cd backend
npm install mongodb-memory-server  # Install if missing
npm start
# Backend will use in-memory DB (data lost on restart)
```

---

## ✅ Verify Backend is Working

### Test 1: Check Server is Running
```bash
# Open a new terminal
curl http://localhost:5000

# Should respond (not timeout or connection refused)
```

### Test 2: Test Products Endpoint
```bash
curl http://localhost:5000/api/products

# Should return JSON array of products (not 500 error)
# If empty array [], that's fine (but you should have seed data)
```

### Test 3: Check Backend Console
Look at the terminal where you ran `npm start`. Should see:

```
✅ Connected to MongoDB at [connection string]
✅ Inserted seed products into DB (count: 8)
✅ Server listening on port 5000
```

If you see errors, check:
- Database connection string
- MongoDB service is running
- Port 5000 isn't already in use

---

## 🚀 Complete Fresh Start Procedure

### Step 1: Terminal A - Backend
```bash
cd backend
rm -r node_modules              # Remove old dependencies
npm cache clean --force         # Clear cache
npm install                     # Fresh install
npm start                       # Start server

# Wait for: "Server listening on port 5000"
```

### Step 2: Terminal B - Frontend
```bash
cd frontend
npm run dev

# Wait for: "Local: http://localhost:5173"
```

### Step 3: Browser
```
1. Go to http://localhost:5173
2. Open DevTools (F12)
3. Go to Console tab
4. Should see no errors about /api/products
5. Products should load on home page
```

---

## 🔍 Detailed Error Diagnosis

### If you still see 500 on products:

```bash
# 1. Check backend console for specific error
# Look for lines starting with:
# - "Get products error"
# - "MongoDB connection error"
# - Other error messages

# 2. If database error, check:
# - Is MongoDB running? (netstat -an | findstr 27017)
# - Is connection string correct? (check backend/.env)
# - Are you connected to internet? (for MongoDB Atlas)

# 3. If code error, look for:
# - Syntax errors in Product model
# - Missing require() statements
# - Typos in field names
```

---

## 📝 Backend Environment Setup

Create `backend/.env` file:

```env
# Database
MONGODB_URI=mongodb://127.0.0.1:27017/notebook-hub
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/notebook-hub

# Server
PORT=5000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:8080
VITE_API_URL=http://localhost:5000

# JWT Secret
JWT_SECRET=your_secret_key_here

# SMS (optional, for OTP)
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_FROM_NUMBER=+1234567890
```

---

## ✅ Quick Verification Checklist

- [ ] Backend installed: `npm list` shows all packages
- [ ] Backend running: Port 5000 listening
- [ ] Database connected: See connection message in console
- [ ] Products seeded: "Inserted seed products into DB"
- [ ] No syntax errors: Backend console clean
- [ ] Frontend can reach backend: Network tab shows 200 responses

---

## 🆘 If Nothing Works

```bash
# Nuclear option: Complete reset

# 1. Kill all Node processes
taskkill /IM node.exe /F  # Windows
# killall node              # Mac/Linux

# 2. Clean everything
cd backend
rm -r node_modules
rm package-lock.json
npm cache clean --force
npm install

cd ../frontend
rm -r node_modules
rm package-lock.json
npm cache clean --force
npm install

# 3. Start fresh
# Terminal A
cd backend && npm start

# Terminal B
cd frontend && npm run dev

# Browser: Ctrl+Shift+Delete (clear all cache/storage)
#         Ctrl+Shift+R (hard refresh)
```

---

## 📞 Support

Check backend console for the exact error:
1. Look for `Get products error` message
2. Read the full error stack
3. Search error message online
4. Most common: MongoDB not running or connection string wrong

**Expected backend startup output:**
```
No MONGODB_URI set, attempting to connect to local MongoDB...
Connected to local MongoDB at mongodb://127.0.0.1:27017/Notebook-hub-main
Inserted seed products into DB (count: 8)
Server listening on port 5000
```

---

**Version:** 1.0  
**Last Updated:** February 16, 2026
