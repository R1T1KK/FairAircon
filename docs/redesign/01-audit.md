# 01 — Project Audit: Fair Aircon

**Branch:** `redesign/ui-v2`  
**Scope:** Read-only codebase audit before any UI/UX edits.

---

## 1.1 Tech Stack

### Frontend (`client/`)
- **Framework:** React `^19.2.4` (`react-dom` `^19.2.4`)
- **Build Tool:** Vite `^8.0.4` (`@vitejs/plugin-react` `^6.0.1`)
- **Routing:** `react-router-dom` `^7.14.1`
- **State Management:** React Context (`AuthContext` in `client/src/context/AuthContext.jsx`) + component-local `useState`/`useEffect`
- **Styling Approach:** Plain CSS with global CSS custom properties in `client/src/index.css` + per-page/feature CSS files (`Home.css`, `Navbar.css`, `Footer.css`, `Services.css`, `Booking.css`, `Profile.css`, `Tracking.css`, `Auth.css`, `Legal.css`, `ReviewSection.css`, `Admin.css`)
- **UI / Motion / 3D / Chart / Map Libraries:**
  - `react-hot-toast` `^2.6.0` (notifications)
  - `framer-motion` `^12.38.0` (used in `Profile.jsx`)
  - `gsap` `^3.15.0` (installed; used in `ACExplodedScroll.jsx`)
  - `three` `^0.184.0`, `@react-three/fiber` `^9.6.0`, `@react-three/drei` `^10.7.7` (installed; `HeroAC3D.jsx` exists but is not rendered in `Home.jsx`)
  - `recharts` `^3.8.1` (admin dashboard charts)
  - `leaflet` `^1.9.4` (live tracking map in `Tracking.jsx`)
  - `@react-google-maps/api` `^2.20.8` (installed in `package.json`, currently unused in favor of Leaflet + OpenStreetMap)
  - `socket.io-client` `^4.8.3` (real-time tracking & admin WhatsApp booking alerts)
  - `axios` `^1.15.0` (`client/src/services/api.js`)
- **Icon Sets Currently Used:** Mixed sets from `react-icons` `^5.6.0` — `react-icons/fa` (Font Awesome solid), `react-icons/fi` (Feather outline), `react-icons/bs` (Bootstrap).
- **Fonts Currently Used:** `Inter` (weights 300–900 via Google Fonts `@import` in `client/src/index.css`).

### Backend (`server/`)
- **Runtime & Framework:** Node.js + Express `^4.21.0`
- **Database:** MongoDB with Mongoose `^8.7.0` (`Booking`, `Otp`, `Review`, `Service`, `User`)
- **Auth Method:** JWT (`jsonwebtoken` `^9.0.2`) + `bcryptjs` `^2.4.3` + OTP verification (`Otp` model)
- **Payment Provider:** `razorpay` `^2.9.6` (mounted at `/api/payments`)
- **Real-time:** `socket.io` `^4.8.3` (`server/src/config/socket.js`)
- **WhatsApp / n8n Integration:** `/api/n8n` (`server/src/routes/n8n.routes.js`) + Socket.IO `new_whatsapp_booking` event emitted to admin room + `n8n json/ritiktest-workflows/AC-Chatbot.json`
- **Other Backend Services:** `nodemailer` (email), `twilio` (SMS/OTP), `cloudinary` + `multer-storage-cloudinary` (avatar/media uploads), `pdfkit` (booking PDF receipt `/api/bookings/:id/receipt`), `helmet`, `cors`, `morgan`.

---

## 1.2 Route & Page Inventory

### Public Website
| Route | Component | File | Notes |
| --- | --- | --- | --- |
| `/` | `Home` | `client/src/pages/Home.jsx` | Landing page (Hero, Stats, Services, How It Works, Reviews, CTA) |
| `/services` | `ServicesPage` | `client/src/pages/ServicesPage.jsx` | Filterable service catalog + `ReviewSection` |
| `/login` | `Login` | `client/src/pages/Login.jsx` | Email/password login |
| `/otp-login` | `OtpLogin` | `client/src/pages/OtpLogin.jsx` | Phone OTP login |
| `/signup` | `Signup` | `client/src/pages/Signup.jsx` | Registration |
| `/forgot-password` | `ForgotPassword` | `client/src/pages/ForgotPassword.jsx` | Password reset request |
| `/reset-password/:token` | `ResetPassword` | `client/src/pages/ResetPassword.jsx` | Password reset form |
| `/privacy` | `PrivacyPolicy` | `client/src/pages/PrivacyPolicy.jsx` | Legal page |
| `/terms` | `Terms` | `client/src/pages/Terms.jsx` | Legal page |

### Customer Panel (ProtectedRoute)
| Route | Component | File | Notes |
| --- | --- | --- | --- |
| `/booking` | `Booking` | `client/src/pages/Booking.jsx` | 4-step booking wizard + confirmation |
| `/profile` | `Profile` | `client/src/pages/Profile.jsx` | Profile edit, avatar upload, booking history, PDF receipt, review modal |
| `/tracking/:bookingId` | `Tracking` | `client/src/pages/Tracking.jsx` | Live Leaflet map + status timeline + technician card |

### Technician Dashboard (ProtectedRoute)
| Route | Component | File | Notes |
| --- | --- | --- | --- |
| `/technician` | `TechnicianDashboard` | `client/src/features/technician/TechnicianDashboard.jsx` | Isolated layout (no Navbar/Footer), assigned jobs, status updates, GPS sharing |

### Admin Panel (AdminRoute)
| Route | Component | File | Notes |
| --- | --- | --- | --- |
| `/admin` | `AdminLayout` + `DashboardHome` | `client/src/features/admin/AdminLayout.jsx`, `pages/DashboardHome.jsx` | Overview stats & Recharts |
| `/admin/bookings` | `ManageBookings` | `client/src/features/admin/pages/ManageBookings.jsx` | Booking table, filters, technician assignment, live WhatsApp alerts |
| `/admin/services` | `ManageServices` | `client/src/features/admin/pages/ManageServices.jsx` | Service CRUD |
| `/admin/users` | `ManageUsers` | `client/src/features/admin/pages/ManageUsers.jsx` | User list & role management |

### Extra / Unused / Flagged Items
- **Unused components:** `client/src/components/3d/HeroAC3D.jsx` and `client/src/components/ACExplodedScroll.jsx` exist in `components/` but are not imported in `App.jsx` or `Home.jsx`.
- **Unused assets:** `client/src/assets/ac-premium.png` and `client/src/assets/hero.png` exist; `Home.jsx` currently uses a CSS card stack instead of an image.
- **Role guard note:** `/technician` uses `ProtectedRoute` (checks login only, not `role === 'technician'`), whereas `/admin` uses `AdminRoute`. Keep auth behavior intact unless explicitly asked to change route guards.

---

## 1.3 Component Inventory

- **Layout:** `Navbar` (`Navbar.jsx`), `Footer` (`Footer.jsx`), `AdminLayout` (`AdminLayout.jsx`)
- **Auth:** `OtpInput` (`components/auth/OtpInput.jsx`), `ProtectedRoute` / `AdminRoute` (`components/common/ProtectedRoute.jsx`)
- **Reviews:** `ReviewSection` (`components/reviews/ReviewSection.jsx` — reused on `Home` and `ServicesPage`)
- **Unused/Legacy:** `HeroAC3D.jsx`, `ACExplodedScroll.jsx`
- **Duplicated / Inconsistent Patterns:**
  - Buttons (`.btn-primary-lg`, `.btn-outline-lg`, `.service-book-btn`, inline `<button style={{...}}>` in `TechnicianDashboard.jsx`) are defined inconsistently per file instead of one shared button system.
  - Inline styles are heavily used in `TechnicianDashboard.jsx` and `Tracking.jsx` instead of CSS classes/tokens.
  - Status badges exist in `index.css` (`.badge-*`), `Tracking.jsx`, and inline styles in `TechnicianDashboard.jsx` with different colors and shapes.

---

## 1.4 Preservation List (Must NOT Break)

1. **Auth Flow & JWT Storage:**
   - Files: `client/src/context/AuthContext.jsx`, `client/src/services/api.js`, `client/src/components/common/ProtectedRoute.jsx`
   - Preserve `localStorage` key `airfix_token`, `Authorization: Bearer <token>` interceptor, 401 redirect to `/login`, and all auth methods (`login`, `register`, `sendOtp`, `resendOtp`, `verifyPhoneOtp`, `verifyOtp`, `logout`, `updateProfile`, `updateAvatar`, `forgotPassword`, `resetPassword`).
2. **Role-Based Route Protection:**
   - Files: `client/src/App.jsx`, `client/src/components/common/ProtectedRoute.jsx`
   - Preserve `ProtectedRoute` and `AdminRoute` wrapping on `/admin/*`, `/technician`, `/booking`, `/profile`, `/tracking/:bookingId`.
3. **Booking Flow & Validation:**
   - File: `client/src/pages/Booking.jsx`
   - Preserve 4-step validation (`serviceId`, `scheduledDate`, `timeSlot`, `street/city/state/pincode`), 10-digit `user.phone` check, and `POST /api/bookings` payload.
4. **Payment & Receipt Integration:**
   - Files: `server/src/routes/payment.routes.js`, `client/src/pages/Profile.jsx`
   - Preserve `GET /api/bookings/:id/receipt` blob download and any Razorpay hooks.
5. **Socket.IO Live Tracking:**
   - Files: `client/src/pages/Tracking.jsx`, `client/src/features/technician/TechnicianDashboard.jsx`, `server/src/config/socket.js`
   - Preserve socket auth handshake (`{ token }`), room join `join_booking`, `status_update`, `location_update`, and technician `update_location` (`{ bookingId, lat, lng }`) + Leaflet map container/marker lifecycle.
6. **WhatsApp / n8n Integration:**
   - Files: `client/src/features/admin/pages/ManageBookings.jsx`, `server/src/routes/n8n.routes.js`
   - Preserve `new_whatsapp_booking` socket listener, notification toast, and auto-refresh.
7. **API Endpoints Used by Each Page:**
   - `AuthContext`: `/auth/profile` (GET/PUT), `/auth/login` (POST), `/auth/register` (POST), `/auth/send-otp` (POST), `/auth/resend-otp` (POST), `/auth/verify-otp` (POST), `/auth/avatar` (PUT), `/auth/forgot-password` (POST), `/auth/reset-password/:token` (PUT)
   - `ServicesPage` & `Booking`: `/services` (GET)
   - `Booking`: `/bookings` (POST)
   - `Profile`: `/bookings/my` (GET), `/reviews` (POST), `/bookings/:id/receipt` (GET blob)
   - `ReviewSection`: `/reviews` (GET/POST), `/services` (GET)
   - `Tracking`: `/bookings/:bookingId` (GET)
   - `TechnicianDashboard`: `/technician/jobs` (GET), `/technician/jobs/:id/status` (PUT)
   - `Admin`: `/admin/dashboard` (GET), `/admin/bookings` (GET/PUT), `/admin/technicians` (GET), `/services` (GET), `/admin/services` (POST/PUT/DELETE), `/admin/users` (GET), `/admin/users/:id/role` (PUT)

---

## 1.5 Current UI Problems

- **Background & Surface Noise:** `index.css` applies a multi-hue radial mesh gradient (purple, cyan, pink) with two 600px blurred animated orbs (`body::before`, `body::after`), plus 3 more `.hero-orb`s in `Home.jsx`. Glassmorphism (`.glass-card`) with sweeping white sheen on hover (`::before` left `-100%` to `100%`) reduces text legibility and feels templated.
- **Broken Neutral Tokens & Contrast:** In `index.css`, `--gray-800` and `--gray-900` are both `#000000`, while `--gray-400` is `#334155`. In `Admin.css`, `.admin-nav-link` uses `color: var(--gray-400)` (`#334155`) on `background: var(--gray-900)` (`#000000`), failing WCAG AA contrast severely.
- **Weak Typography Hierarchy:** Heavy `900` and `800` weights everywhere, negative tracking on headings, and mixed icon sets (`Fa*` + `Fi*` + `Bs*`).
- **Hero & Copy Issues:** `#1 AC Service Platform` pill badge, gradient text on `"Cool"`, unverified marketing numbers (`5,000+`, `12,000+`, `25+`, `2,000+ reviews`), exclamation mark (`Service Done!`), and decorative snowflakes in CTA.
- **Mobile & Field Usability:**
  - `Admin.css` uses a fixed `260px` sidebar (`margin-left: 260px` on `.admin-main`) and wide tables without a dedicated mobile card/drawer strategy.
  - `TechnicianDashboard.jsx` uses inline styles, small text links (`Stop` button is `0.8rem` underlined), and hides the location-start action if status was already set to `on-the-way` by Admin.
- **Heavy / Unused Bundle Assets:** `three`, `@react-three/fiber`, `@react-three/drei`, `gsap`, and `@react-google-maps/api` are in `package.json` even though `HeroAC3D` and `ACExplodedScroll` are not rendered on `Home`.

