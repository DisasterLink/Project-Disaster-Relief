# DisasterLink: Disaster Relief Coordination Platform 🌍🤝

A real-time, highly-scalable, full-stack disaster relief coordination system designed to connect civilians in distress with nearby volunteers and emergency administrators. Built with a focus on real-world practicalities, reliability, and modern UI/UX standards.

---

## 🌟 Core Features & System Architecture

### 1. 🚑 Smart Auto-Dispatch System
A real-world automated emergency dispatch engine replacing traditional manual assignments.
- **Radius Expansion Algorithm:** When an SOS is triggered, the system automatically pings eligible volunteers in a `5km` radius. If no one accepts within 45 seconds, the radius expands to `10km`, then `20km`.
- **First-Accept-Wins Concurrency:** Enforces strict atomic assignments (via MongoDB `findOneAndUpdate`) to prevent race conditions where multiple volunteers try to accept the same task.
- **Admin Escalation:** If all 3 rounds time out, the system escalates the request to the Admin Dashboard for manual intervention.

### 2. 🗺️ Nearest Reachable Point Routing (Road Snapping)
Solves a critical real-world problem: victims are often trapped off-road (e.g., fields, mountains, collapsed buildings), causing standard routing APIs to fail.
- **OSRM Integration:** The backend seamlessly integrates the **Open Source Routing Machine (OSRM)** `nearest` API to instantly snap raw off-road GPS coordinates to the closest accessible road network.
- **Dual-Path Navigation Map:** Volunteers receive a sophisticated route display:
  - 🔵 **Solid Blue Line:** Driveable path from the volunteer to the nearest road point.
  - 🟠 **Dotted Orange Line:** The final "on-foot" approach distance from the road to the actual victim.
- **Google Maps Handoff:** Volunteers are provided with direct Google Maps deep-links to the *road-snapped* destination, guaranteeing that navigation calculation never fails.

### 3. 📍 Real-Time Live Tracking & Connectivity
- **WebSockets (Socket.IO):** Fully real-time bi-directional communication.
- **Live Location Sync:** Civilian and volunteer locations are broadcasted and updated live on the map.
- **Instant Alerts:** Dispatch requests, assignment confirmations, and status updates appear instantly without page reloads.

### 4. 📊 Role-Based Dashboards
- **Civilian Dashboard:** Quick SOS generation, live tracking of the assigned volunteer, and timeline updates.
- **Volunteer Dashboard:** Live task queues, pulsating auto-dispatch notifications, map navigation, and toggleable availability status.
- **Admin Dashboard:** God-eye view of all ongoing operations, historical incident metrics via Recharts, and manual override capabilities.

---

## 💻 Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind-like custom CSS (Glassmorphism UI), Recharts
- **Map & Routing:** Leaflet, React-Leaflet, Open Source Routing Machine (OSRM), Google Maps Intents
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas, Mongoose (with geospatial indexing)
- **Real-time:** Socket.IO
- **Time Management:** Custom zero-dependency human-readable time formatters

---

## 📁 Project Structure

```text
├── client/
│   ├── src/
│   │   ├── api/            # Axios API client and interceptors
│   │   ├── components/     # Reusable UI (Map, Modals, ThemeToggle, DispatchNotification)
│   │   ├── context/        # React Context (Auth)
│   │   ├── hooks/          # Custom hooks (useSocket, useLiveLocationTracking, etc.)
│   │   ├── pages/          # Dashboards (Admin, Volunteer, Civilian, Auth)
│   │   └── utils/          # Shared utilities (timeAgo, exportCSV)
├── server/
│   ├── controllers/        # Request, User, Route, and Task controllers
│   ├── middleware/         # JWT Auth and Role-Based Access Control (RBAC)
│   ├── models/             # Mongoose schemas (User, Request, Task)
│   ├── routes/             # Express API routers
│   ├── services/           # Background services (dispatchService.js)
│   ├── utils/              # Backend utilities (geo.js for OSRM)
│   └── server.js           # Express + Socket.io entry point
```

---

## 🚀 Environment Setup & Installation

### 1. Backend `.env` (`server/.env`)
Create a `.env` file in the `server` directory. Use your own MongoDB Atlas URI and secure JWT secret:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>/<db>?retryWrites=true&w=majority
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### 2. Frontend `.env` (`client/.env`)
Create a `.env` file in the `client` directory:

```env
VITE_API_URL=http://localhost:5000
```
*(Note: You can optionally omit `VITE_API_URL` to let Vite's proxy handle `/api` and `/socket.io` routing.)*

---

## 🏃‍♂️ Running the Application Locally

### Start Backend
```bash
cd server
npm install
npm run dev
```

### Start Frontend (in a new terminal)
```bash
cd client
npm install
npm run dev
```

---

## 🔐 Seeding the Database (Optional)

To test Admin functionalities quickly, you can seed the database:

```bash
cd server
npm run seed
```

**Optional Environment Variables for Seeding:**
- `SEED_ADMIN_NAME`
- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`
- `SEED_DEMO=true` *(Generates mock users, volunteers, and sample incidents)*

---

## 🛠️ API Reference Quick Look

- **Auth:** `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- **Volunteers:** `PATCH /api/auth/availability` (Toggle duty status)
- **Incidents (SOS):** `POST /api/requests` (Triggers OSRM snap & Auto-dispatch), `GET /api/requests`
- **Admin:** `PATCH /api/users/:id/promote`

---

## ⚠️ Troubleshooting Guide

- **MongoDB `ECONNREFUSED` or `querySrv` errors:**
  - Double-check your `MONGO_URI`.
  - Ensure your current IP address is whitelisted in MongoDB Atlas Network Access.
- **Vite Proxy Errors (Frontend cannot reach Backend):**
  - Verify the backend is running on port `5000`.
  - Check that `CLIENT_URL` in the backend matches the frontend's local host.
- **WebSockets / Live Tracking not updating:**
  - Ensure `/socket.io` path is correctly proxied in `vite.config.ts`.
  - Check browser console for connection drops.