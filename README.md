# Fair Aircon — Full-Stack AC Service & Repair Booking Platform

A full-stack MERN web application for booking air conditioning services, managing technicians and daily operations, tracking live technician locations, processing Razorpay payments, and generating PDF service receipts.

---

## Key Features

- **Customer Booking & Auth Flow**
  - Service catalog browsing, date/time slot selection, and Mumbai/India address validation.
  - OTP-verified signup & login (`JWT` + `bcryptjs`) with forgot/reset password support.
  - Profile dashboard with booking history, live technician tracking, service ratings/reviews, and downloadable **PDFKit** receipts.
- **Secure Razorpay Payments**
  - Server-side order creation (`POST /api/payments/create-order`) computing payable amounts strictly from database records.
  - Cryptographic `HMAC-SHA256` verification (`POST /api/payments/verify`) with booking ownership and order-binding checks (prevents amount-swap and replay tampering).
  - Raw-body webhook handler (`POST /api/payments/webhook`) for `payment.captured` and `payment.failed` events with idempotency and per-user rate limiting.
- **Real-Time Technician Tracking**
  - Live booking status updates and technician location sharing powered by **Socket.IO** (`Tracking` and `TechnicianDashboard`).
- **Role-Based Dashboards**
  - **Admin Panel:** Manage bookings, services, technicians, customers, and view analytics charts (`Recharts`).
  - **Technician Portal:** View assigned jobs, update job statuses, and share live location.
- **Notifications & Automation**
  - Email notifications via **Nodemailer**, optional SMS/WhatsApp alerts via **Twilio**, and **n8n** workflow integration (`n8n json/`).

---

## Tech Stack

- **Frontend:** React 19, Vite, React Router, Axios, Socket.IO Client, Recharts, Leaflet / Google Maps, React Hot Toast
- **Backend:** Node.js, Express, MongoDB & Mongoose, Socket.IO, Razorpay SDK, PDFKit, JWT, Helmet, Express Validator, Nodemailer, Cloudinary
- **Deployment:** Vercel (Frontend) + Render (Backend)

---

## Project Structure

```text
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/     # Shared layout & UI components
│   │   ├── context/        # AuthContext
│   │   ├── features/       # Admin & Technician dashboards
│   │   ├── pages/          # Public, Auth, Booking, Profile & Tracking pages
│   │   └── services/       # Axios API & Socket helpers
│   └── .env.example
├── server/                 # Node.js + Express backend
│   ├── src/
│   │   ├── config/         # DB & Socket.IO config
│   │   ├── controllers/    # Auth, Booking, Payment, Receipt, Admin, Technician
│   │   ├── middleware/     # JWT auth, rate limiters, error handler
│   │   ├── models/         # Mongoose schemas (User, Booking, Service, Review)
│   │   ├── routes/         # REST API routes
│   │   └── utils/          # Email, WhatsApp & seed utilities
│   └── .env.example
├── scripts/                # Security test guides (payment-security-tests.md)
└── n8n json/               # n8n WhatsApp workflow exports
```

---

## Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/R1T1KK/FairAircon.git
cd FairAircon
```

### 2. Configure Backend (`server/`)
```bash
cd server
npm install
cp .env.example .env
```
Update `server/.env` with your MongoDB URI, `JWT_SECRET`, email credentials, and Razorpay **Test Mode** keys (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`).

Start the backend server:
```bash
npm run dev
```
*(Optional: run `npm run seed` to seed initial services/data.)*

### 3. Configure Frontend (`client/`)
```bash
cd ../client
npm install
cp .env.example .env
```
Update `client/.env` (`VITE_API_URL`, `VITE_SOCKET_URL`, `VITE_RAZORPAY_KEY_ID`) and start Vite:
```bash
npm run dev
```

---

## Security & Verification

- Payment security test cases (amount-swap, tampered signature, cross-user authorization, invalid webhook signature, duplicate verify, cancelled booking) are documented in `scripts/payment-security-tests.md`.
- Build & lint checks:
  ```bash
  cd client && npm run build && npm run lint
  ```
