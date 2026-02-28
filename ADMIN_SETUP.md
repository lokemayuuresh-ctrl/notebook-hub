# Admin Dashboard Setup Guide

## Overview
The admin dashboard provides comprehensive platform management capabilities including:
- **Dashboard Stats**: View total users, orders, revenue, and products
- **User Management**: List all registered users with their roles and join dates
- **Order Management**: Monitor all orders and update their status
- **Product Management**: View and manage product listings

---

## Creating Admin Users

### Method 1: Using Admin Creation API (Recommended)

First admin can be created via the development API endpoint:

```bash
curl -X POST http://localhost:5000/api/admin/create-first-admin \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@notebook-hub.com",
    "password": "SecurePassword123!"
  }'
```

**Response:**
```json
{
  "user": {
    "_id": "...",
    "name": "Admin User",
    "email": "admin@notebook-hub.com",
    "role": "admin"
  },
  "token": "eyJ..."
}
```

### Method 2: Using Backend Script

Run the seed script to create admin:

```bash
cd backend
node -e "
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');

mongoose.connect('mongodb://127.0.0.1:27017/Notebook-hub-main').then(async () => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('admin123', salt);
  
  const admin = await User.create({
    name: 'Admin',
    email: 'admin@notebook-hub.com',
    passwordHash: hash,
    role: 'admin',
    phone: '9999999999',
    phoneVerified: true
  });
  
  console.log('Admin created:', admin);
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
"
```

### Method 3: Manual Database Insertion

Use MongoDB Compass or mongo shell:

```javascript
db.users.insertOne({
  name: "Admin",
  email: "admin@notebook-hub.com",
  passwordHash: "$2a$10$...", // bcrypt hash of password
  role: "admin",
  phone: "9999999999",
  phoneVerified: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

---

## Logging In as Admin

1. Go to http://localhost:5173/login
2. Enter admin email and password
3. Complete OTP verification (check backend console for OTP code)
4. Navigate to http://localhost:5173/admin
5. Access dashboard, users, and orders tabs

---

## API Endpoints

### Authentication
- `POST /api/auth/register-otp` - Send OTP to phone
- `POST /api/auth/verify-otp` - Verify OTP and register
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify session

### Admin (Protected - requires admin role)

**Dashboard Stats**
```
GET /api/admin/stats
Response: {
  totalUsers: number,
  totalOrders: number,
  totalRevenue: number,
  totalProducts: number,
  pendingOrders: number,
  activeUsers: number
}
```

**User Management**
```
GET /api/admin/users
Response: User[]

GET /api/admin/users/:id
Response: User

DELETE /api/admin/users/:id
Response: { message: "User deleted successfully" }
```

**Order Management**
```
GET /api/admin/orders
Response: Order[]

GET /api/admin/orders/:id
Response: Order

PATCH /api/admin/orders/:id/status
Body: { status: "pending|confirmed|shipped|delivered|cancelled" }
Response: Order (updated)
```

**Product Management**
```
GET /api/admin/products
Response: Product[]

PATCH /api/admin/products/:id
Body: { name?, price?, stock?, ... }
Response: Product

DELETE /api/admin/products/:id
Response: { message: "Product deleted successfully" }
```

---

## Admin Dashboard Features

### Dashboard Tab
- **Total Users**: Count of all registered users
- **Active Users**: Users active in the last 7 days
- **Total Orders**: Count of all placed orders
- **Pending Orders**: Orders awaiting fulfillment
- **Total Revenue**: Sum of all delivered orders
- **Products**: Total product listings
- **Growth Chart**: Platform performance overview

### Users Tab
- View all registered users
- See user name, email, role (buyer/seller), and join date
- Delete users if needed
- Sort by creation date (newest first)

### Orders Tab
- View all customer orders
- See order ID, customer name, amount, status, and date
- Update order status (pending → confirmed → shipped → delivered)
- Filter orders by status

---

## Frontend Integration

The Admin component (`src/pages/Admin.tsx`) provides:

1. **Role-based Access Control**
   - Only users with role='admin' can access /admin
   - Non-admin users are redirected to home page
   - Unauthenticated users are redirected to login

2. **Three-Tab Interface**
   - Dashboard (stats overview)
   - Users (user management)
   - Orders (order management)

3. **Real-time Data**
   - Data refreshes when switching tabs
   - Auto-fetches latest stats, users, and orders

4. **UI Components**
   - Stat cards with icons and trends
   - Data tables with sorting
   - Status badges with color coding
   - Responsive layout for mobile/desktop

---

## Environment Variables

Ensure your backend `.env` includes:

```
MONGODB_URI=mongodb://127.0.0.1:27017/Notebook-hub-main
NODE_ENV=development
JWT_SECRET=your_secret_key_here
PORT=5000
FRONTEND_URL=http://localhost:5173
```

---

## Troubleshooting

**Admin page shows "Not authorized"**
- Verify user has `role: "admin"` in database
- Check JWT token is valid
- Ensure cookies are being sent with requests

**API returns 401 Unauthorized**
- User not logged in - redirect to `/login`
- Token expired - need to login again
- Check CORS credentials are enabled

**Users/Orders not loading**
- Verify backend is running on port 5000
- Check MONGODB_URI is correct
- Ensure admin role is set in database

**OTP not sending during login**
- Check backend console for simulated OTP codes
- SMS service requires Twilio configuration in .env
- For development, codes are printed to console

---

## Security Notes

- Admin role is required and verified on backend
- All admin endpoints require valid JWT authentication
- Password hashing uses bcrypt with 10 salt rounds
- Sensitive data (passwords, payment info) is excluded from API responses
- CORS is configured to prevent unauthorized access

---

## Next Steps

1. Create your first admin user using one of the methods above
2. Login with admin credentials at /login
3. Navigate to admin dashboard at /admin
4. Monitor platform activity and manage content
5. Create additional admin users as needed

For more details, see [BACKEND_SETUP.md](BACKEND_SETUP.md) and [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md).
