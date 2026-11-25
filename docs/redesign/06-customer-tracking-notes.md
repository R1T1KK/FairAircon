# 06 — Customer Panel & Live Tracking Discovery Notes (Phase 4)

**Branch:** `redesign/ui-v2`  
**Files Traced:** `client/src/pages/Profile.jsx`, `Profile.css`, `Tracking.jsx`, `Tracking.css`, `Login.jsx`, `OtpLogin.jsx`, `Signup.jsx`, `ForgotPassword.jsx`, `ResetPassword.jsx`, `Auth.css`, `context/AuthContext.jsx`, `services/api.js`

---

## 1. Token & Auth Verification
- **JWT Storage Key:** `airfix_token` in `localStorage` — verified across `AuthContext.jsx`, `api.js`, and `Tracking.jsx`.
- **Route Guards (`App.jsx`):** `/profile` and `/tracking/:bookingId` are wrapped in `<ProtectedRoute>`.

## 2. Customer Profile (`/profile`)
- **APIs Used:**
  - `GET /api/bookings/my` → returns `res.data.bookings`
  - `PUT /api/auth/profile` (`updateProfile(form)`) → updates `{ name, phone, address }`
  - `PUT /api/auth/avatar` (`updateAvatar(formData)`) → 2MB client-side limit
  - `POST /api/reviews` → `{ bookingId, rating, comment }`
  - `GET /api/bookings/:id/receipt` (`responseType: 'blob'`) → PDF receipt download
- **Note:** `Finalize Payment` button currently shows a toast (`Redirecting to checkout...`) — preserved without altering payment logic.

## 3. Live Tracking (`/tracking/:bookingId`)
- **API Used:** `GET /api/bookings/:bookingId` → returns `res.data.booking` (populates `service` and `technician` including `technician.currentLocation`).
- **Socket.IO Lifecycle:**
  - **Connection:** Single `socketRef` connected to `VITE_SOCKET_URL || 'http://localhost:5000'`.
  - **Auth:** `auth: (cb) => cb({ token: localStorage.getItem('airfix_token') })`.
  - **Events:** Emits `join_booking` (`bookingId`) on `connect`; listens to `status_update` (`{ status, technician }`), `location_update` (`{ lat, lng }`), and `connect_error` (disconnects, disables reconnection, calls `logout()`, redirects to `/login` on auth errors).
  - **Cleanup:** `socket.off` for all 4 listeners + `socket.disconnect()` + `socketRef.current = null` on unmount.
- **Map Library:** `leaflet` + OpenStreetMap tiles (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`). Updates marker via `markerRef.current.setLatLng(coords)` and `mapInstanceRef.current.panTo(coords, { animate: true })`.
- **ETA Note:** Backend does NOT provide an ETA; the previous hardcoded `"12-15 Mins"` string will be removed so no invented ETA is displayed.
