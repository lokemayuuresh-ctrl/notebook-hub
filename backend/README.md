# Notebook Hub Server

Simple Express + MongoDB backend for the Notebook Hub app.

Setup:

1. cd server
2. npm install
3. copy .env.example to .env and set MONGODB_URI (or use the in-memory option below)

Seeding the DB:
- For a real MongoDB instance: `npm run seed` (requires `MONGODB_URI` in `.env`)
- For a temporary local in-memory DB (no config): `npm run seed:memory`

Run server:
- `npm run dev` (development)
- `npm start` (production)
