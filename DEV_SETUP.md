# Developer setup (Frontend + Backend)

1. Install root dependencies and run frontend:

```bash
npm install
npm run dev
```

2. Start backend in a separate terminal (optional):

```bash
cd server
npm install
# Use a real MongoDB instance (set MONGODB_URI in server/.env) or use in-memory DB
npm run seed:memory
npm run dev
```

3. From the project root you can use convenience scripts added:

- `npm run dev:server` — start the backend dev server
- `npm run seed:server` — seed the backend with `MONGODB_URI` (if set)
- `npm run seed:server:memory` — seed an in-memory DB (no config required)

4. Configure frontend to point at backend (optional):

Create `.env` at project root and add:
```
VITE_API_URL=http://localhost:5000
```

The frontend will try to fetch products from `${VITE_API_URL}/api/products` and fall back to the bundled static dataset if the API is unreachable.

Backend required/optional environment variables (backend/.env):

- `MONGODB_URI` — (optional) MongoDB connection string. If not set, an in-memory MongoDB will be used in development.
- `JWT_SECRET` — (optional) secret for JWT token signing (default: `devsecret`).
- `OTP_TTL_MIN` — (optional) OTP validity in minutes (default: 5).

Optional (for real SMS delivery):
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`

When Twilio creds are not provided the backend will log OTPs to the server console for local development/testing.
