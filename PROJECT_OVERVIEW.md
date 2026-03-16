# Notebook Hub - Project Overview

## 📋 Introduction
Notebook Hub is a full-stack e-commerce platform enabling buyers and sellers to trade products with real-time tracking and payment integration.

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Framework**: React 18+ with Vite
- **Styling**: Tailwind CSS
- **State Management**: Context API (Auth, Cart, Order, Product, Review, Wishlist)
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: Pre-built shadcn/ui components

### Backend (Node.js + Express)
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB (implied from models)
- **Authentication**: OTP-based with JWT
- **Real-time**: WebSocket support for live features
- **Services**: SMS integration, Payment processing

## 📦 Key Features

### User Management
- User registration & login with OTP verification
- Buyer and seller dashboards
- Profile management
- Login attempt tracking

### Shopping Experience
- Product catalog with categories
- Product search and filtering
- Shopping cart management
- Wishlist functionality
- Product reviews

### Orders & Payments
- Order creation and management
- Real-time order tracking
- Payment integration
- Invoice generation and download
- Order history

### Notifications
- Real-time notifications
- SMS alerts
- Notification management

### Seller Dashboard
- Product management
- Order fulfillment
- Sales analytics

## 📁 Project Structure

```
notebook-hub/
├── frontend/          # React TypeScript application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── context/       # Global state management
│   │   └── hooks/         # Custom React hooks
│   └── vite.config.ts    # Build configuration
│
└── backend/           # Express.js server
    ├── src/
    │   ├── models/        # Database schemas
    │   ├── routes/        # API endpoints
    │   ├── middleware/    # Auth & validation
    │   ├── services/      # Business logic
    │   └── lib/           # Database & utilities
    └── test/              # Test files
```

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **Backend** | Node.js, Express.js, MongoDB |
| **Real-time** | WebSocket |
| **Payments** | Stripe/PayPal integration (likely) |
| **SMS** | Twilio/SMS service |
| **Authentication** | JWT + OTP |

## 🔌 API Routes

- `/auth` - Login, register, OTP verification
- `/products` - Product CRUD and listing
- `/orders` - Order management
- `/orderTrackings` - Real-time order tracking
- `/payments` - Payment processing
- `/users` - User profile management
- `/notifications` - Notification management
- `/invoices` - Invoice generation

## 🎯 Getting Started

### Setup Instructions
Refer to [DEV_SETUP.md](DEV_SETUP.md) for detailed setup steps.

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
npm install
npm run start
```

## 📝 Documentation
- [Backend Documentation](BACKEND.md)
- [Development Setup](DEV_SETUP.md)
- [README](README.md)

## 👥 User Roles
- **Buyers**: Browse, purchase, track orders, manage wishlist
- **Sellers**: List products, manage inventory, track sales
- **Admin**: System management (implied)

---

*Last Updated: February 2026*
