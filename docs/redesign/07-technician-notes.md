# 07 — Technician Dashboard Discovery Notes (Phase 5)

**Branch:** `redesign/ui-v2`  
**Files Traced:** `client/src/features/technician/TechnicianDashboard.jsx`, `server/src/routes/technician.routes.js`, `server/src/config/socket.js`, `client/src/App.jsx`

---

## 1. Route, Auth & Role Guards
- **Frontend Route:** `/technician` wrapped in `<ProtectedRoute>` (`client/src/App.jsx`), isolated layout without Navbar/Footer.
- **Backend Guards (`technician.routes.js`):** `protect` (JWT `airfix_token`) + `authorizeTech` (`req.user.role === 'technician'`, returns `403` otherwise).

## 2. API Endpoints & Job Status Transitions
- **Fetch Assigned Jobs:** `GET /api/technician/jobs` → `{ jobs: [...] }` (scoped to logged-in technician).
- **Update Status:** `PUT /api/technician/jobs/:id/status` with `{ status }`:
  - `assigned` → `on-the-way` (triggers `startTracking(job._id)`)
  - `on-the-way` → `completed` (triggers `stopTracking()`)

## 3. Location Sharing & Socket.IO Lifecycle
- **Socket Connection:** Single `socketRef` to `VITE_SOCKET_URL || 'http://localhost:5000'` with `auth: (cb) => cb({ token: localStorage.getItem('airfix_token') })`.
- **Auth Error Handling:** `connect_error` on `'Authentication error'`, `'User not found'`, or missing `airfix_token` disables reconnection, disconnects, toasts session expired, calls `logout()`, and navigates to `/login`.
- **Geolocation:** `navigator.geolocation.watchPosition` (`{ enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }`).
- **Emit Event:** `update_location` with `{ bookingId: jobId, lat: latitude, lng: longitude }` when `socketRef.current?.connected`.
- **Cleanup:** Unmount clears `watchIdRef.current` via `clearWatch`, removes socket listeners (`socket.off`), and calls `socket.disconnect()`.
- **Background/Screen-Lock Behavior:** Browser `watchPosition` pauses or throttles when the tab is backgrounded or phone screen locks (no Wake Lock or Service Worker is used).
