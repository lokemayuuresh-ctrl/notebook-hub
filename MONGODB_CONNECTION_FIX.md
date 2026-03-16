# MongoDB Connection Fix Guide

## 🔴 Current Problem

Your backend is trying to connect to **MongoDB Atlas** but can't reach it:

```
querySrv ENOTFOUND _mongodb._tcp.cluster0.mongodb.net
```

**Causes:**
- ❌ MongoDB Atlas connection string is incomplete or wrong
- ❌ No internet connection
- ❌ IP not whitelisted in MongoDB Atlas
- ❌ Wrong username/password

---

## ✅ Solution (Choose One)

### **Option 1: Fix MongoDB Atlas (Recommended if you have internet)**

#### Step 1: Get Correct Connection String
1. Go to https://cloud.mongodb.com/
2. Login to your account
3. Click "Connect" on your cluster
4. Choose "Drivers"
5. Copy the connection string (should look like):
   ```
   mongodb+srv://username:password@cluster0.mongodb.net/notebook-hub
   ```

#### Step 2: Update `.env` File
`backend/.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/notebook-hub
PORT=5000
NODE_ENV=development
```

**Replace:**
- `username` - Your MongoDB Atlas username
- `password` - Your MongoDB Atlas password (URL encode special chars: `@` → `%40`, `:` → `%3A`)
- `cluster0` - Your actual cluster name
- `notebook-hub` - Your database name

#### Step 3: Restart Backend
```bash
cd backend
npm start
```

**Expected output:**
```
Connected to MongoDB at mongodb+srv://...
Inserted seed products into DB (count: 8)
Server listening on port 5000
```

---

### **Option 2: Use Local MongoDB (Easiest for Development)**

#### Step 1: Install MongoDB

**Windows:**
- Download: https://www.mongodb.com/try/download/community
- Run installer
- MongoDB will start automatically

**Mac:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux (Ubuntu):**
```bash
sudo apt-get install -y mongodb
sudo systemctl start mongodb
```

#### Step 2: Update `.env` File
`backend/.env`:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/notebook-hub
PORT=5000
NODE_ENV=development
```

#### Step 3: Verify MongoDB is Running
```bash
# Test if MongoDB is responding
mongosh --eval "db.adminCommand('ping')"
# Should output: { ok: 1 }
```

#### Step 4: Restart Backend
```bash
cd backend
npm start
```

**Expected output:**
```
Connected to MongoDB at mongodb://127.0.0.1:27017/notebook-hub
Inserted seed products into DB (count: 8)
Server listening on port 5000
```

---

### **Option 3: Auto-Fallback to In-Memory DB (Quickest)**

This requires no database setup - perfect for quick testing:

#### Step 1: Update `.env` File
`backend/.env`:
```env
MONGODB_URI=
PORT=5000
NODE_ENV=development
```

Leave `MONGODB_URI` empty. The backend will auto-fallback to in-memory MongoDB.

#### Step 2: Restart Backend
```bash
cd backend
npm start
```

**Expected output:**
```
No MONGODB_URI set, attempting to connect to local MongoDB...
[if local fails] Falling back to in-memory MongoDB
Inserted seed products into DB (count: 8)
Server listening on port 5000
```

**Note:** Data is lost when server restarts, but perfect for development/testing.

---

## 🔍 Diagnose Your Issue

Look at your `backend/.env` file and check:

```bash
cat backend/.env
```

**Look for these problems:**

| Issue | Example | Fix |
|-------|---------|-----|
| Invalid URL | `mongodb+srv://cluster0.mongodb.net` (no credentials) | Add username:password |
| Typo in host | `clustor0.mongodb.net` | Fix hostname spelling |
| No database | `mongodb+srv://user:pass@cluster0.mongodb.net` | Add `/notebook-hub` at end |
| Special chars not encoded | Password with `@` or `:` | URL encode them |

---

## ✅ Verification Steps

After fixing the connection:

### Step 1: Check Backend Logs
Look for these SUCCESS messages in backend terminal:
```
✅ Connected to MongoDB at [your-connection-string]
✅ Inserted seed products into DB (count: 8)
✅ Server listening on port 5000
```

### Step 2: Test Products API
```bash
curl http://localhost:5000/api/products
```

Should return JSON array (not 500 error):
```json
[
  {
    "_id": "...",
    "name": "Notebook 1",
    "price": 299,
    ...
  },
  ...
]
```

### Step 3: Test in Browser
1. Go to http://localhost:5173
2. Open DevTools (F12)
3. Go to Console
4. Should see NO "500" errors on products
5. Products should load on home page

---

## 📝 Complete Backend `.env` Template

```env
# CHOOSE ONE connection method:

# Option A: MongoDB Atlas (Cloud)
MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/notebook-hub

# Option B: Local MongoDB
# MONGODB_URI=mongodb://127.0.0.1:27017/notebook-hub

# Option C: In-Memory (leave empty)
# MONGODB_URI=

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:8080

# JWT Secret (for auth)
JWT_SECRET=your-secret-key-here

# Optional: SMS service (if needed)
# TWILIO_ACCOUNT_SID=
# TWILIO_AUTH_TOKEN=
# TWILIO_FROM_NUMBER=
```

---

## 🆘 Still Not Working?

### Check 1: Is MongoDB connection string URL-encoded?
```
Special characters need encoding:
@ → %40
: → %3A
Example: password "p@ss:word" → "p%40ss%3Aword"
```

### Check 2: Is MongoDB Atlas cluster active?
- Go to MongoDB Cloud Console
- Check if your cluster is "Running" (not paused)

### Check 3: Is your IP whitelisted?
- MongoDB Atlas → Network Access
- Add your IP to whitelist (or allow 0.0.0.0/0 for development)

### Check 4: Do you have internet connection?
- Test: `ping google.com`
- If no internet, use Local MongoDB (Option 2)

### Check 5: Kill old processes
```bash
# Windows
taskkill /IM node.exe /F

# Mac/Linux
killall node
```

Then restart backend fresh.

---

## 🎯 Recommended Setup

**For Development:**
```bash
# Use Local MongoDB (fastest, no internet needed)
# backend/.env
MONGODB_URI=mongodb://127.0.0.1:27017/notebook-hub
```

**For Production:**
```bash
# Use MongoDB Atlas (secure, cloud-hosted)
# backend/.env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/notebook-hub
```

---

## ✅ Quick Fix Checklist

- [ ] Check `backend/.env` file exists
- [ ] `MONGODB_URI` is set (or empty for in-memory)
- [ ] MongoDB is running (if using local)
- [ ] Connection string is valid (test with mongosh)
- [ ] Backend restarts cleanly without errors
- [ ] See "Server listening on port 5000" in logs
- [ ] See "Inserted seed products into DB" in logs
- [ ] Products API returns data (not 500)

---

## 📞 Next Steps

1. **Choose your database option** (Atlas or Local)
2. **Update backend/.env** with correct connection string
3. **Restart backend**: `cd backend && npm start`
4. **Check logs** for success messages
5. **Test in browser** - should see products loading

**Then all errors should be gone!** 🎉

---

**Created:** February 16, 2026
