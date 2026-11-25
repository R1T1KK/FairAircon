# 10 — Final QA & Responsive Audit Notes (Phase 7)

**Branch:** `redesign/ui-v2`  
**Viewports Audited:** `360px`, `768px`, `1024px`, `1440px`

---

## 1. Issues Found & Severity

| Severity | Area | Issue | Action |
| --- | --- | --- | --- |
| **Major** | Shared CSS (`index.css` / `Services.css`) | `.page-header-band` and `.breadcrumb` are used by `ServicesPage`, `Booking`, `Profile`, and `Tracking`, but defined only in `Services.css`. | Move `.page-header-band` and `.breadcrumb` into `index.css` as shared primitives. |
| **Major** | Accessibility (`index.css`) | `prefers-reduced-motion: reduce` was only in `Home.css`, not global across `Booking`, `Profile`, `Tracking`, `Admin`, `Technician`. | Add global `@media (prefers-reduced-motion: reduce)` in `index.css`. |
| **Minor** | Admin Mobile (`Admin.css`) | `.table-action-btn` and `.admin-role-select` inside `.admin-mobile-cards` had `min-height: 36px` on `<= 768px` screens. | Increase to `min-height: 44px` inside `@media (max-width: 768px)`. |
| **Minor** | Unused Legacy Files | `client/src/components/3d/HeroAC3D.jsx` and `ACExplodedScroll.jsx` are not imported anywhere (`Select-String` verified). | Left untouched per rule; listed for owner approval before deletion. |
| **Info (Needs Approval)** | Role Guard (`/technician`) | `/technician` uses `<ProtectedRoute>` (checks login only) instead of a dedicated `TechnicianRoute` checking `user.role === 'technician'`. Backend `/api/technician/*` already enforces `403`. | Not changed (behavior change); listed under "Needs Approval". |

---

## 2. Regression & Bundle Check
- **Token Key:** `airfix_token` verified in `AuthContext.jsx`, `api.js`, `Tracking.jsx`, `TechnicianDashboard.jsx`, `ManageBookings.jsx`.
- **Socket Connections:** Single `socketRef` with full `socket.off` + `disconnect()` cleanup in `Tracking.jsx` and `TechnicianDashboard.jsx`.
- **Bundle Size Comparison:**
  - Before `framer-motion` removal in `Profile.jsx`: `1,101.79 kB` JS (`331.10 kB` gzip)
  - After Phase 7: measured in final `vite build` output.
