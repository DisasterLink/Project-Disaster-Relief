# DisasterLink: Disaster Relief Coordination Platform

A real-time, full-stack disaster relief system connecting people who need help with volunteers and admins.

## Key Features
- JWT authentication with MongoDB-backed users
- Role-based access control (`user`, `volunteer`, `admin`)
- SOS lifecycle (create, assign, track, resolve)
- Real-time updates via Socket.IO
- Admin resource and volunteer management

## Tech Stack
- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + Mongoose + Socket.IO
- Database: MongoDB Atlas

## Project Structure
- `server/models`: Mongoose schemas
- `server/controllers`: route handlers
- `server/routes`: API routes
- `server/middleware`: auth and RBAC guards
- `client/src/api`: API client + interceptors
- `client/src/context`: auth state management
- `client/src/hooks`: socket hook

## Environment Setup

### 1) Backend `.env` (`server/.env`)
Use your own Atlas URI and secure JWT secret:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>/<db>?retryWrites=true&w=majority
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### 2) Frontend `.env` (`client/.env`)

```env
VITE_API_URL=http://localhost:5000
```

You can also omit `VITE_API_URL` to use Vite proxy (`/api` and `/socket.io`).

## Run Locally

### Backend
```bash
cd server
npm install
npm run dev
```

### Frontend (new terminal)
```bash
cd client
npm install
npm run dev
```

## Seed Admin (Optional)
This project does not rely on demo users. Use seed to create an admin account:

```bash
cd server
npm run seed
```

Optional env vars for seeding:
- `SEED_ADMIN_NAME`
- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`
- `SEED_DEMO=true` (adds sample user/volunteer/data)

## Auth API
- `POST /api/auth/register` (roles allowed from public: `user`, `volunteer`)
- `POST /api/auth/login`
- `GET /api/auth/me` (JWT required)
- `PATCH /api/auth/availability` (`volunteer` only)

## Admin APIs
- `PATCH /api/users/:id/promote` (`admin` only)
- `GET /api/users`
- `GET /api/users/volunteers`

## Troubleshooting
- Atlas `ECONNREFUSED` or `querySrv` errors:
  - verify `MONGO_URI`
  - whitelist your current IP in Atlas Network Access
  - ensure Atlas cluster is active
- Vite proxy errors:
  - ensure backend is running on port `5000`
  - ensure `CLIENT_URL` in backend `.env` matches frontend URL
- Socket reconnect issues:
  - ensure `/socket.io` is reachable through Vite proxy or `VITE_API_URL`
  - check backend logs for connect/disconnect reasons