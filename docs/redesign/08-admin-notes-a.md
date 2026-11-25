# 08 — Admin Panel Part A Discovery Notes (Phase 6A)

**Branch:** `redesign/ui-v2`  
**Route Guard:** `<AdminRoute>` in `client/src/App.jsx` (`user && isAdmin`, redirects to `/login` or `/`).

---

## 1. Admin Route Classification (Part A vs Part B)

| Route | Component | Part | Status |
| --- | --- | --- | --- |
| `/admin` (shell) | `AdminLayout` | **Part A** | In scope |
| `/admin` (index) | `DashboardHome` | **Part A** | In scope |
| `/admin/bookings` | `ManageBookings` | **Part A** | In scope |
| `/admin/users` | `ManageUsers` | **Part A** | In scope |
| `/admin/services` | `ManageServices` | **Part B** | Out of scope (untouched) |
| Slots / Payments / Reports / Settings / Content / Roles | — | **Part B** | Missing (not created) |

---

## 2. Part A APIs, Payloads & Table Logic
1. **`DashboardHome.jsx`:**
   - `GET /api/admin/dashboard` → `res.data.data` (`totalBookings`, `completedBookings`, `totalRevenue`, `totalUsers`, `monthlyBookings`, `weeklyBookings`, `recentBookings`).
2. **`ManageBookings.jsx`:**
   - `GET /api/admin/bookings` (query param `status` when `statusFilter !== 'all'`)
   - `GET /api/admin/technicians`
   - **Status Change:** `PUT /api/admin/bookings/:id` with `{ status: newStatus }`
   - **Assign Technician:** `PUT /api/admin/bookings/:id` with `{ technician: techId }`
   - **Client-side Filtering:** `sourceFilter` (`all | website | whatsapp`) + `searchQuery` (`user.name`, `user.email`, `service.name`, `externalBookingId`). No pagination exists today.
   - **Socket.IO:** Connects with `auth: { token: localStorage.getItem('airfix_token') }` and listens to `new_whatsapp_booking` (plays audio + toast + refreshes bookings).
3. **`ManageUsers.jsx`:**
   - `GET /api/admin/users` (query param `role` when `roleFilter` is set: `user | technician | admin`)
   - **Role Change:** `PUT /api/admin/users/:id/role` with `{ role: newRole }`
   - **Client-side Search:** `searchQuery` (`name`, `email`, `phone`). No pagination exists today.
