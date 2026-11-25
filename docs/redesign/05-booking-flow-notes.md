# 05 — Booking Flow Discovery Notes (Phase 3)

**Branch:** `redesign/ui-v2`  
**Files Traced:** `client/src/pages/Booking.jsx`, `client/src/pages/Booking.css`, `server/src/controllers/booking.controller.js`, `client/src/App.jsx`

---

## 1. Route, Auth & Entry Points
- **Route:** `/booking` wrapped in `<ProtectedRoute>` (`client/src/App.jsx`). Unauthenticated users are redirected to `/login`.
- **Query Params / Route State:** None currently read by `Booking.jsx` (`useParams` / `useSearchParams` / `useLocation` are not used).
- **State Persistence:** Component-local `useState` only (`step`, `services`, `loading`, `form`, `selectedService`). No `localStorage` persistence is used for form state; navigating Back/Next between steps preserves `form` and `selectedService` in memory.

## 2. API Calls & Exact Payloads (Byte-for-Byte Contract)
1. **Load Services (`useEffect` on mount):**
   - `GET /api/services` → reads `res.data.services`
2. **Create Booking (`handleSubmit` on Step 4):**
   - `POST /api/bookings`
   - **Exact Request Payload:**
     ```json
     {
       "serviceId": "<Service._id>",
       "scheduledDate": "YYYY-MM-DD",
       "timeSlot": "09:00-10:00",
       "address": {
         "street": "string",
         "city": "string",
         "state": "string",
         "pincode": "string"
       },
       "notes": "string"
     }
     ```
   - **Response:** `{ success: true, booking: <populated Booking> }` (status `201`).
   - **Backend Side Effects Preserved:** Server computes `totalAmount` from `Service`, sends owner email, triggers WhatsApp/n8n notification (`sendWhatsApp`).

## 3. Existing Validation Rules & Time Slots
- **Time Slots (Client constant):** `['09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00', '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00']`
- **Step 1 → 2:** Requires `form.serviceId` (`"Please select a service"`).
- **Step 2 → 3:** Requires `form.scheduledDate` (`min={today}`) and `form.timeSlot` (`"Please select date and time"`).
- **Step 3 → 4:** Requires `street`, `city`, `state`, and `pincode` (`"Please fill all address fields"`).
- **Submit (Step 4 → 5):** Requires `user` (redirects `/login` if missing) and `user.phone` matching `/^[0-9]{10}$/` (redirects `/profile` if invalid/missing).

## 4. Payment & Post-Booking Flow
- Razorpay payment is **not** triggered inside `/booking`; Step 5 directs the user to `/profile` (`Pay Now / View Bookings`) or `/` (`Back to Home`).
