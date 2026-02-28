# Error Troubleshooting Guide - Notebook Hub

## 🔍 Error Categories & Solutions

### Category 1: 401 Unauthorized Errors
**Error Message:** `Failed to load resource: the server responded with a status of 401 (Unauthorized)`

**Affected Endpoints:**
- `/api/auth/verify`
- `/api/orders` (multiple requests)

**Root Causes:**
```
1. Backend server not running
2. User not authenticated (no JWT token)
3. JWT token expired or invalid
4. Missing Authorization header in request
5. Backend authentication middleware issue
```

**Solutions:**

1. **Check if Backend is Running**
   ```bash
   # Terminal 1: Start backend
   cd backend
   npm start
   # Should see: "Server running on port 5000"
   ```

2. **Check LocalStorage for Auth Token**
   ```javascript
   // Open DevTools Console and run:
   localStorage.getItem('authToken')
   localStorage.getItem('currentUser')
   // If null/empty, user needs to login
   ```

3. **Verify Backend Authentication**
   ```bash
   # Check backend/src/middleware/auth.js
   # Ensure JWT token validation is correct
   ```

4. **Clear Auth State and Login Again**
   ```javascript
   // In browser console:
   localStorage.clear()
   // Then login again
   ```

---

### Category 2: 500 Internal Server Error
**Error Message:** `Failed to load resource: the server responded with a status of 500 (Internal Server Error)`

**Affected Endpoints:**
- `/api/auth/login`
- `/api/products`
- `src/components/home/HeroSection.tsx` (hot module reload)

**Root Causes:**
```
1. Backend code syntax error
2. Database connection issue
3. Missing environment variables
4. Unhandled exception in route handler
5. Module import error in backend
```

**Solutions:**

1. **Check Backend Logs**
   ```bash
   # Look for error messages in backend terminal
   # Check for:
   # - Syntax errors
   # - Database connection errors
   # - Missing dependencies
   ```

2. **Verify Backend Dependencies**
   ```bash
   cd backend
   npm install  # Reinstall dependencies
   ```

3. **Check Environment Variables**
   ```bash
   # Create backend/.env if missing
   # Required vars:
   DATABASE_URL=mongodb://localhost:27017/notebookhub
   JWT_SECRET=your_secret_key
   PORT=5000
   ```

4. **Restart Backend Server**
   ```bash
   cd backend
   # Kill existing process (Ctrl+C)
   npm start  # Fresh start
   ```

5. **Check Product Route**
   ```javascript
   // backend/src/routes/products.js
   // Ensure it's:
   // - Properly exported
   // - Has correct error handling
   // - Queries database correctly
   ```

---

### Category 3: 404 Not Found - Routes
**Error Message:** `404 Error: User attempted to access non-existent route: /shipping`

**Affected Routes:**
- `/shipping`
- `/returns`
- `/contact`
- `/faq`

**Root Cause:**
```
Routes created but app hasn't reloaded browser cache
```

**Solutions:**

1. **Hard Refresh Browser (Most Important)**
   ```
   Windows/Linux: Ctrl+Shift+R
   Mac: Cmd+Shift+R
   ```

2. **Clear Application Cache**
   ```
   1. Press F12 (DevTools)
   2. Go to "Application" tab
   3. Left sidebar → Local Storage
   4. Right-click → Clear All
   5. Go to "Cache Storage"
   6. Delete all entries
   ```

3. **Restart Frontend Dev Server**
   ```bash
   cd frontend
   # Press Ctrl+C to stop
   npm run dev  # Restart
   # Wait for "Local: http://localhost:5173"
   ```

4. **Verify Routes in App.tsx**
   ```typescript
   // Check that routes exist in frontend/src/App.tsx:
   <Route path="/faq" element={<GuestRoute><FAQ /></GuestRoute>} />
   <Route path="/shipping" element={<GuestRoute><ShippingInfo /></GuestRoute>} />
   <Route path="/returns" element={<GuestRoute><ReturnsPolicy /></GuestRoute>} />
   <Route path="/contact" element={<GuestRoute><Contact /></GuestRoute>} />
   ```

---

### Category 4: 404 Not Found - Favicon
**Error Message:** `Failed to load resource: the server responded with a status of 404 (Not Found) favicon.ico`

**Impact:** Minor (cosmetic issue only)

**Solution:**
```bash
# Add favicon to frontend/public/favicon.ico
# Or add to index.html head:
<link rel="icon" type="image/svg+xml" href="/logo.svg" />
```

---

## 🚀 Complete Startup Procedure

Follow this for fresh start:

### Step 1: Terminal 1 - Start Backend
```bash
cd backend
npm install      # If first time
npm start        # Should say "Server running on port 5000"
```

### Step 2: Terminal 2 - Start Frontend
```bash
cd frontend
npm install      # If first time  
npm run dev      # Should say "Local: http://localhost:5173"
```

### Step 3: Browser
```
1. Go to http://localhost:5173
2. Press Ctrl+Shift+Del (Clear cache)
3. Press Ctrl+Shift+R (Hard refresh)
4. Open DevTools (F12)
5. Check Console for errors
```

### Step 4: Test Authentication
```
1. Click "Login"
2. Use test credentials
3. Check localStorage has token:
   localStorage.getItem('authToken')
```

### Step 5: Test API Calls
```javascript
// In browser console:
fetch('http://localhost:5000/api/products')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

---

## 🔧 Debugging Commands

### Check Backend Status
```bash
# Test if backend is responding
curl http://localhost:5000

# Test products endpoint
curl http://localhost:5000/api/products

# Test auth endpoint
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password"}'
```

### Check Frontend Errors
```javascript
// In browser DevTools Console
// See all errors
console.error.toString()

// Check auth state
console.table(JSON.parse(localStorage.getItem('currentUser')))

// Check cart
console.table(JSON.parse(localStorage.getItem('cart')))
```

### Check Network Requests
```
1. Open DevTools (F12)
2. Go to "Network" tab
3. Filter: XHR/Fetch
4. Look at headers and response
5. Check status code (should be 200/201)
```

---

## 📝 Error Reference

| Status | Meaning | Action |
|--------|---------|--------|
| **200/201** | Success | ✅ Working |
| **400** | Bad Request | Check request parameters |
| **401** | Unauthorized | User not logged in or token invalid |
| **403** | Forbidden | User doesn't have permission |
| **404** | Not Found | Route/resource doesn't exist |
| **500** | Server Error | Backend crashed/syntax error |
| **503** | Service Unavailable | Server is down |

---

## ✅ Verification Checklist

- [ ] Backend server running on port 5000
- [ ] Frontend dev server running on port 5173
- [ ] Browser localStorage cleared
- [ ] Hard refresh done (Ctrl+Shift+R)
- [ ] No 500 errors in backend console
- [ ] User can login successfully
- [ ] Orders API returns 200 (when logged in)
- [ ] All routes accessible (/faq, /shipping, /returns, /contact)
- [ ] No HMR failures in console

---

## 🆘 Emergency Fixes

If nothing works:

```bash
# 1. Kill all Node processes
taskkill /IM node.exe /F

# 2. Clear all node_modules and caches
cd frontend
rm -r node_modules
npm cache clean --force
npm install

cd ../backend
rm -r node_modules
npm cache clean --force
npm install

# 3. Start fresh
# Terminal 1
cd backend
npm start

# Terminal 2
cd frontend
npm run dev

# 3. In browser
# Clear everything: Ctrl+Shift+Delete
# Hard reload: Ctrl+Shift+R
```

---

**Last Updated:** February 16, 2026
**Version:** 1.0
