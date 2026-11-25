# 04 — Phased Implementation Plan

Every phase is implemented on branch `redesign/ui-v2` with **one git commit per phase** for clean rollback (`git revert <commit>` or `git reset --hard <prev-commit>`).

| Phase | Scope | Files Likely Touched | Risk | What Could Break | Verification |
| --- | --- | --- | --- | --- | --- |
| **Phase 1: Design System & Shell** | CSS tokens, typography, buttons, badges, inputs, skeletons, Navbar, Footer | `client/src/index.css`, `Navbar.jsx/.css`, `Footer.jsx/.css` | Low | Global class overrides affecting downstream pages | `npm run build`, `npm run lint`, check all public routes at 360px & 1440px |
| **Phase 2: Public Homepage** | Hero, verifiable highlights bar, Services preview, How It Works, Reviews polish, CTA | `Home.jsx`, `Home.css`, `ReviewSection.jsx/.css` | Low | Layout break on mobile, broken `/booking` links | `npm run build`, visual check 360px/768px/1024px/1440px |
| **Phase 3: Public Services & Legal** | Services catalog cards, category filter tabs, skeletons/empty/error states, Privacy/Terms alignment | `ServicesPage.jsx`, `Services.css`, `Legal.css` | Low | Category filter state | `npm run build`, test category filters & empty state |
| **Phase 4: Auth & Booking Flow** | Login, OTP Login, Signup, Forgot/Reset Password, 4-step Booking wizard | `Auth.css`, `Login.jsx`, `OtpLogin.jsx`, `Signup.jsx`, `ForgotPassword.jsx`, `ResetPassword.jsx`, `Booking.jsx`, `Booking.css` | Med | OTP input focus, 10-digit phone check, `POST /bookings` payload | `npm run build`, manual test login + OTP + full 4-step booking |
| **Phase 5: Customer Profile & Live Tracking** | Profile, booking history cards, review modal, Live Tracking map + timeline | `Profile.jsx`, `Profile.css`, `Tracking.jsx`, `Tracking.css` | High | Socket.IO `location_update`/`status_update`, Leaflet map container resize, PDF receipt download | `npm run build`, manual test tracking socket + receipt download |
| **Phase 6: Technician Field Dashboard** | Mobile-first field UI, large tap targets, CSS module/classes replacing inline styles, resume location button | `TechnicianDashboard.jsx`, `TechnicianDashboard.css` (new) | High | Geolocation `watchPosition`, Socket `update_location`, status transitions | `npm run build`, manual test on 360px mobile viewport + live tracking |
| **Phase 7: Admin Panel** | Fix sidebar contrast, responsive drawer, mobile card view for tables, clean chart & modal styling | `Admin.css`, `AdminLayout.jsx`, `DashboardHome.jsx`, `ManageBookings.jsx`, `ManageServices.jsx`, `ManageUsers.jsx` | Med | Recharts sizing, WhatsApp socket alert, technician assignment dropdown | `npm run build`, manual test all 4 `/admin/*` routes at 360px & 1440px |
| **Phase 8: Final Responsive & QA Pass** | Cross-browser/viewport sweep (`360px`, `768px`, `1024px`, `1440px`), keyboard focus, contrast & bundle check | Minor CSS/JSX polish across touched files | Low | Regressions | `npm run build`, `npm run lint`, full route checklist |

