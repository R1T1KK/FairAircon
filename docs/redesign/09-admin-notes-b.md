# 09 — Admin Panel Part B Discovery Notes (Phase 6B)

**Branch:** `redesign/ui-v2`  
**Route Guard:** `<AdminRoute>` (`client/src/App.jsx`).

---

## 1. Part B Route Inventory
- **Existing (CRITICAL — feeds live customer `Home`, `ServicesPage`, `Booking`):**
  - `/admin/services` → `client/src/features/admin/pages/ManageServices.jsx`
- **Missing (Not Created):**
  - Slots / availability management
  - Payments ledger
  - Reports / analytics exports (beyond `DashboardHome` in 6A)
  - Settings
  - Content / FAQ / Testimonials manager
  - Notifications

## 2. `ManageServices.jsx` APIs & Exact Payload
- **Fetch:** `GET /api/services` → `res.data.services`
- **Create / Update (`POST /api/admin/services` | `PUT /api/admin/services/:id`):**
  ```json
  {
    "name": "string",
    "description": "string",
    "category": "repair | installation | gas-refill | maintenance | cleaning",
    "basePrice": 499,
    "discountPrice": 399,
    "duration": 90,
    "features": ["Feature 1", "Feature 2"]
  }
  ```
- **Delete:** `DELETE /api/admin/services/:id`
- **Validation:** Requires `form.name`, `form.description`, `form.basePrice`.
- **Uploads / Exports / n8n:** None in `ManageServices.jsx`.
