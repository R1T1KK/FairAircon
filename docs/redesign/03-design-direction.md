# 03 — Design Direction Proposal & Unslop Findings

*Methodology credit: Based on **unslop** by Damir Sokolovsky ([@heydamir](https://x.com/heydamir)), CC BY 4.0.*

---

## Unslop Audit Findings (What Looks AI-Made Today)

1. **Surfaces & Color:** Multi-hue purple/cyan/pink radial mesh background + two 600px animated blurred orbs in `index.css`, three more `.hero-orb` elements in `Home.jsx`, and `.glass-card` with sweeping white hover sheen everywhere.
2. **Typography:** Overweight `800–900` headings, gradient-clipped text (`.hero-highlight`), and broken `--gray-800`/`--gray-900` tokens (`#000000`) causing contrast failures in `Admin.css`.
3. **Icons:** Three mixed icon libraries (`Fa*` solid, `Fi*` outline, `Bs*`) with inconsistent stroke/fill weights.
4. **Hero & Copy:** `#1 AC Service Platform` pill badge, floating 3-card stack (`.hero-card-stack`), unverified stats (`5,000+ Happy Customers`, `12,000+ Services`, `25+ Cities`, `4.9/5 from 2,000+ reviews`), exclamation mark (`Service Done!`), and decorative snowflakes in the CTA.
5. **Motion:** Continuous `floatGlobal` and `float` orb animations, `hover:scale` / `-8px` card lift, and `transition-all`.

---

## 5-Line Unslop Direction

- **Product:** **Fair Aircon** — on-demand AC repair, installation, gas refill, deep cleaning, and AMC booking for homes and offices in Mumbai, with live technician tracking.
- **Character:** `dependable, crisp, unhurried`
- **World:** Clean cool air, brushed aluminum fins, commercial HVAC service sheets, and Mumbai daylight — an **Ink-tinted light neutral ramp** paired with **Navy (`#0F2942`)** and **Cobalt Blue (`#1E6FD9`)**.
- **Moments:**
  1. **Home Hero:** One real **Live Service Dispatch & Tracking Preview** (coded with real Fair Aircon service/slot/ETA data, or paired with a verified photo from `client/src/assets/hero.png` / `ac-premium.png` if approved).
  2. **Live Tracking (`/tracking/:bookingId`):** The interactive **Leaflet OpenStreetMap** + live technician status timeline.
- **Signature:** Tabular-numeric service metadata (`₹399`, `90 min`, `3-month warranty`, `2-hr response`) paired with a crisp 6px live status dot (`#16A34A` / `#1E6FD9`) — used consistently across service cards, booking summary, technician jobs, and live tracking.

---

## Design System Specification (Step 3)

### a) Color Palette (Navy + White Commercial HVAC, WCAG AA Verified)
- **Primary Navy:** `#0F2942` (used for primary headings, primary CTA on light, navbar brand/footer dark surface; contrast vs `#FFFFFF` = **14.3:1** AAA)
- **Accent Cobalt Blue:** `#1E6FD9` (interactive links, active states, selected service border, focus ring; contrast vs `#FFFFFF` = **4.96:1** AA; `#1557B0` hover = **6.8:1** AA)
- **Secondary / Tint:** `#EEF4FB` (subtle selected card/badge tint; paired with `#0F2942` text = **12.9:1**)
- **Neutrals (Ink-tinted Light Ramp):**
  - Page Background: `#F5F7FA`
  - Card / Surface: `#FFFFFF`
  - Raised / Input / Table Header: `#ECEFF4`
  - Hairline Border: `rgba(15, 41, 66, 0.10)` (1px solid)
  - Primary Text: `#0F172A` (contrast on `#FFFFFF` = **17.8:1**)
  - Secondary Text: `#475569` (contrast on `#FFFFFF` = **7.5:1**)
  - Muted Text / Meta: `#64748B` (contrast on `#FFFFFF` = **4.7:1** AA)
- **Admin Sidebar Dark Surface:** `#0B192C` with `#E2E8F0` primary text (**14.2:1**) and `#94A3B8` inactive nav text (**6.8:1**) — fixes the current `#334155` on `#000000` contrast bug.
- **Semantic Colors (toned to ramp):**
  - Success: `#16A34A` / tint `#DCFCE7` / text `#166534`
  - Warning: `#D97706` / tint `#FEF3C7` / text `#92400E`
  - Error: `#DC2626` / tint `#FEE2E2` / text `#991B1B`

### b) Typography
- **Font Pairing:** Keep `Inter` (already loaded, fast, zero new font weight) with weights **400, 500, 600** only (drop 300, 700, 800, 900 to reduce font payload and remove heavy AI-heading look). Use `tabular-nums` (`font-variant-numeric: tabular-nums`) on all prices (`₹399`), durations, dates, and dashboard figures.
- **Type Scale:**
  - Hero Headline: `44px–52px` desktop / `32px–36px` mobile, weight `600`, line-height `1.08`, tracking `-0.025em`
  - Page / Section Title: `28px–32px`, weight `600`, line-height `1.2`, tracking `-0.015em`
  - Card Title: `18px`, weight `600`, line-height `1.3`
  - Body / Nav: `15px`, weight `400–500`, line-height `1.55`
  - Meta / Captions / Table Headers: `12px–13px`, weight `500`, sentence case (no `UPPERCASE` wide-tracked labels)

### c) Spacing, Radius, Shadow & Border Scale
- **Spacing (4px Grid):** `4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96`
  - Card padding: `20px` (compact) / `24px` (standard)
  - Section vertical padding: `72px` desktop / `48px` mobile
- **Radius (Nested Math):**
  - Small controls / badges / inputs: `8px`
  - Buttons: `8px` (controls) / `10px` (hero CTA) — no full pills everywhere
  - Cards: `12px`
  - Panels / Modals: `16px`
- **Shadows & Borders:**
  - Cards rest on `1px solid rgba(15, 41, 66, 0.10)` + `0 1px 2px rgba(15, 23, 42, 0.04)`
  - Floating popovers/modals: `0 8px 24px rgba(15, 23, 42, 0.08)`
  - Zero colored shadows, zero `backdrop-filter` blur cards.

### d) Core Components
- **Unified Iconography:** Standardize on `react-icons/fi` (Feather line icons, `16px` or `18px`, stroke `1.5–2`, inheriting text color) across the entire app. Remove `Fa*` and `Bs*` mixes and emoji icons.
- **Buttons:** `.btn` base (`height: 40px` standard, `48px` hero, `36px` nav; `8px` radius; `primary` navy fill, `accent` cobalt fill, `secondary` white + hairline, `ghost`).
- **Inputs & Selects:** `44px` height, `1px solid` hairline border, `8px` radius, clear `2px solid #1E6FD9` `:focus-visible` ring.
- **Navbar:** Quiet white bar (`64px` height) with hairline bottom border, `Fair Aircon` wordmark + simple geometric mark, max 3–4 links, quiet `Log in` text link + 1 primary `Book Service` button. Mobile drawer at `< 768px`.
- **Footer:** Deep Navy (`#0F2942`) clean 4-column grid (remove decorative SVG wave).

### e) Page Layout Patterns
- **Public Pages:** Max-width `1200px` container, `24px` mobile / `32px` desktop side padding. Asymmetric split Hero (left: crisp value prop + 2 actions; right: real service/tracking preview or approved photo).
- **Admin Dashboard:** `240px` fixed dark-navy sidebar on desktop; collapses into a top bar + slide-over drawer below `1024px`.
- **Customer Profile:** Clean 2-column grid (left: account details + edit; right: active & past bookings with Track / Receipt / Review actions).

### f) States (Every Data-Driven Page)
- **Loading:** Neutral `#ECEFF4` skeleton blocks matching card/row heights (no plain `"Loading..."` text).
- **Empty:** Quiet icon + 1-line explanation + 1 clear next action (e.g., `"No bookings yet"` → `"Book a service"`).
- **Error:** Inline alert banner with retry button (never silent console-only errors).
- **Success:** Clean confirmation card + toast.
- **Disabled:** `opacity: 0.55`, `cursor: not-allowed`, no hover shift.

### g) Admin Tables on Mobile (`ManageBookings`, `ManageUsers`)
- **Choice:** **Card View below `768px`** + clean horizontal scroll fallback between `768px–1024px`.
- **Justification:** Admin booking rows contain customer name, phone, service, WhatsApp badge, technician dropdown, and status selector. Horizontal scrolling on a `360px` phone hides action dropdowns off-screen; transforming each `<tr>` into a structured stacked card with labeled fields makes status updates and technician assignment effortless on mobile.

### h) Technician Dashboard on Mobile (`/technician`)
- Technicians use this on phones in the field (often one-handed):
  - Sticky top header (`56px`) with Refresh icon button (`44x44px` tap target).
  - Full-width primary action button (`height: 48px`) at the **bottom of each job card** (`Start Travel (On the Way)` / `Mark Job Completed`) for easy thumb reach.
  - Dedicated **"Start / Resume Live Location"** button whenever status is `on-the-way` and GPS watch isn't active.
  - Large `44px`-tall `Call Customer` and `Open in Maps` buttons side-by-side.

### i) Customer Live Tracking Page (`/tracking/:bookingId`)
- **Desktop:** 2-column split — Left (60%): Leaflet map (`min-height: 460px`, `12px` radius, quiet hairline) with a compact top-left status/ETA bar; Right (40%): Vertical status timeline + Technician card with one-tap `Call` button.
- **Mobile (`360px`):** Map on top (`300px` height) so live location is immediately visible without scrolling, followed by Technician card and Service Progress timeline.
- **When `techLocation` is null:** Clean informational card showing booking status, scheduled date/slot, and service address instead of a bare gray box.

### j) Motion
- **One easing curve:** `cubic-bezier(0.22, 1, 0.36, 1)`
- **Hover / Focus:** `150ms` background/border/color transition only (no `translateY(-8px)` or `scale(1.02)`).
- **Press:** `transform: scale(0.98)` over `120ms`.
- **Banned:** All looping background orb animations, shimmer sweeps, and scroll parallax.

---

## Content & Asset Rules
- **Verified Business Info Found in Codebase:**
  - Brand Name: `Fair Aircon`
  - Phone: `+91 9829454487`
  - Email: `Fairaircon777@gmail.com`
  - Location: `Mumbai, Maharashtra`
  - Services & Prices (from `seedData.js`): AC Repair (`₹399`, `90 min`), AC Installation (`₹1,399`, `180 min`), Gas Refill (`₹3,500`, `60 min`), Annual Maintenance (`₹1,500`, `120 min`), Deep Cleaning (`₹650`, `90 min`), Emergency Repair (`₹349`, `60 min`), 3-month warranty, 2-hour emergency response.
- **Missing / Removed:**
  - Unverified stats (`5,000+`, `12,000+`, `25+ cities`, `4.9/5 from 2,000+ reviews`) → replaced with verifiable service guarantees (`3-Month Warranty`, `2-Hr Emergency Response`, `Upfront Pricing`, `Mumbai Coverage`).
  - **NEEDS INPUT FROM OWNER:** Exact Mumbai office street address (currently only `"Mumbai, Maharashtra"` in Footer), social media URLs (currently `#` in Footer), and whether `client/src/assets/hero.png` / `ac-premium.png` are real brand photos to use or replace.

