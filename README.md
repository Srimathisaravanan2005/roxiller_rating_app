# Roxillar Store Rating Platform

A role-based store directory and rating app built with React, Express, and MySQL. Administrators manage accounts and stores, normal users search stores and submit one updateable rating per store, and store owners see ratings for stores assigned to their account.

## Requirements

- Node.js 20.19+ or 22.12+
- MySQL 8+
- npm

## Setup

1. Create the database and tables by running `backend/schema.sql` with a MySQL account that can create databases.
2. Copy `backend/.env.example` to `backend/.env` and set `DB_HOST`, `DB_PORT`, `DB_USER`, and `DB_PASSWORD` for your local MySQL instance. The database name is `roxillar_ratings`.
3. Install dependencies with `npm install` in both `backend` and `frontend`.
4. Start the API with `npm run dev` from `backend`.
5. Start the UI with `npm run dev` from `frontend`.

During development, Vite proxies `/api` to `http://localhost:5000`, keeping session cookies same-origin. Set `VITE_API_URL` in the frontend environment to use a separately hosted API. The API accepts a `FRONTEND_ORIGIN` setting for credentialed CORS. For a cross-site production deployment, set `COOKIE_SAME_SITE=none` and serve the API over HTTPS.

## Authentication and roles

All roles use the same login endpoint and page. The API hashes passwords with Node's `scrypt` and returns a random session token in an HttpOnly cookie; only a SHA-256 hash of that token is stored in MySQL. Roles are `admin`, `user`, and `store_owner`. Public signup always creates a normal user. Create the initial administrator by inserting an account through a controlled local bootstrap script or by temporarily registering and changing its role directly in MySQL; do not expose administrator role selection publicly.

Passwords must be 8-16 characters and include an uppercase letter and a special character. Names must be 20-60 characters. Addresses are limited to 400 characters. Ratings are integers from 1 to 5, and the database enforces one rating per user/store pair.

## API overview

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`, `PATCH /api/auth/password`
- `GET /api/stores?search=&sortBy=&direction=` (authenticated; owner role is restricted to their stores)
- `PUT /api/ratings/:storeId` (normal user; inserts or updates the current user's rating)
- `GET /api/ratings/owner` (store owner; their store summaries and rating contributors)
- `GET /api/admin/stats`, `/api/admin/stores`, `/api/admin/users`, `/api/admin/users/:userId`
- `POST /api/admin/stores`, `POST /api/admin/users`
- `GET /api/health`

Admin listing endpoints support `search`, allowlisted `sortBy`, and `direction=asc|desc`; user listings also support `role`.

## Testing

- Backend validation tests: `npm test` from `backend`.
- Frontend production build: `npm run build` from `frontend`.

Database-backed workflows require a running MySQL server initialized with `backend/schema.sql`. The repository does not include credentials or seeded accounts. Register a normal account, then use a controlled local database operation to create administrator and store-owner accounts for role testing.

## Security notes

Keep `.env` files out of version control. Production deployments must use HTTPS, a narrowly configured `FRONTEND_ORIGIN`, and a strong database account. No administrator bootstrap endpoint is exposed publicly.