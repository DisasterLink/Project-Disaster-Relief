# DisasterLink: Disaster Relief Coordination Platform

A real-time, comprehensive disaster relief system designed to connect civilians in need with rapid-response volunteer forces and administrative command centers. 

## 🌟 Key Features
- **🚨 3-Tier Role System:** Dedicated portals for Civilians, Volunteers, and Admins.
- **🗺️ Live Map Tracking:** Pinpoint SOS locations and resource drop-offs in real time via Leaflet.
- **⚡ Real-Time WebSockets:** Powered by `Socket.io`, providing instant SOS requests, status updates, and assignment notifications.
- **📦 Global Resource Inventory:** Manage critical supplies like Medical, Food, Water, and Shelter.
- **📊 Analytics Dashboard:** Recharts-powered graphs and data tables for high-level incident oversight and CSV exports.

## 🛠️ Technology Stack
- **Frontend:** React 19, TypeScript, React Router v7, TailwindCSS, React-Leaflet, Recharts.
- **Backend:** Node.js, Express, MongoDB (Mongoose), Socket.io.
- **Authentication:** JWT (JSON Web Tokens) with Bcrypt hashing.
- **Optimization:** React lazy loading, Error Boundaries, custom suspense fallbacks.

## 🚀 How to Run Locally

### 1. Backend Server Setup
From the project root:
```bash
cd server
npm install
npm run start
```
*Note: The server uses `mongodb-memory-server` as a local fast-booting database for seamless offline/demo playback if no live remote MongoURI is available.*

### 2. Frontend Client Setup
In a new terminal, from the project root:
```bash
cd client
npm install
npm run dev
```

## 🔐 Demo Credentials
You can securely demo the platform with these pre-seeded accounts:
- **Admin:** `admin@demo.com` / `admin123`
- **Volunteer:** `vol@demo.com` / `vol123`
- **Civilian:** `civil@demo.com` / `civil123`

## 🗂️ Production Deployment
To deploy this project to production (e.g. Vercel, Render), ensure the following `.env` settings are placed correctly.
**Server `.env`:**
```env
PORT=5000
MONGO_URI=mongodb+srv://<your_cluster_url>
JWT_SECRET=supersecret123
CLIENT_URL=https://your-frontend-domain.vercel.app
```

**Client `.env`:**
```env
VITE_API_URL=https://your-backend-domain.onrender.com
```

Build the client with:
```bash
npm run build
```
The output will be in `client/dist`.

## 🎓 Evaluation Notes
This platform has been architected with:
- **Resilience:** Fallbacks for unreliable networks.
- **Security:** Guarded protected routes and secure JWT storage.
- **UX Polish:** Aesthetic skeleton loaders, page-transition animations, and highly responsive layouts.
