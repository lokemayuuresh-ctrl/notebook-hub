# Backend quick start

A simple Express + MongoDB backend has been added under `server/`.

Steps:
1. cd server
2. npm install
3. copy `.env.example` to `.env` and set `MONGODB_URI` (or omit to use the in-memory DB in development)
4. `npm run seed` (or `npm run seed:memory` to seed an in-memory DB)
5. `npm run dev` to run the backend (defaults to port 5000)

Notes:
- For the frontend, set `VITE_API_URL=http://localhost:5000` in a `.env` file at project root or rely on the default.
- The server starts an in-memory MongoDB automatically when `MONGODB_URI` is not set and seeds the products collection for convenience.
