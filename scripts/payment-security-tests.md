# Razorpay Payment Security Test Guide (Test Mode Only)

Run these `curl` checks against your local/dev server (`http://localhost:5000`). Replace `<USER_A_TOKEN>`, `<USER_B_TOKEN>`, `<BOOKING_A_ID>`, `<BOOKING_B_ID>`, `<ORDER_A_ID>`, `<PAYMENT_A_ID>`, `<VALID_SIG_A>`, and `<CANCELLED_BOOKING_ID>` with real dev test values.

---

## 1. Amount-Swap Attack on Verify
Submit Order A's valid `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature` against Booking B's `bookingId`:

```bash
curl -i -X POST http://localhost:5000/api/payments/verify \
  -H "Authorization: Bearer <USER_A_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "razorpay_order_id": "<ORDER_A_ID>",
    "razorpay_payment_id": "<PAYMENT_A_ID>",
    "razorpay_signature": "<VALID_SIG_A>",
    "bookingId": "<BOOKING_B_ID>"
  }'
```
- **Expected:** `400 Bad Request`
- **Response:** `{"success":false,"message":"Order ID does not match this booking"}`

---

## 2. Tampered Signature on Verify
Flip one character in `razorpay_signature`:

```bash
curl -i -X POST http://localhost:5000/api/payments/verify \
  -H "Authorization: Bearer <USER_A_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "razorpay_order_id": "<ORDER_A_ID>",
    "razorpay_payment_id": "<PAYMENT_A_ID>",
    "razorpay_signature": "0000000000000000000000000000000000000000000000000000000000000000",
    "bookingId": "<BOOKING_A_ID>"
  }'
```
- **Expected:** `400 Bad Request`
- **Response:** `{"success":false,"message":"Payment verification failed"}`

---

## 3. Paying / Verifying Another User's Booking
Call `/create-order` (or `/verify`) using User B's token for User A's booking:

```bash
curl -i -X POST http://localhost:5000/api/payments/create-order \
  -H "Authorization: Bearer <USER_B_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"bookingId": "<BOOKING_A_ID>"}'
```
- **Expected:** `403 Forbidden`
- **Response:** `{"success":false,"message":"Not authorized to pay for this booking"}`

---

## 4. Webhook Invalid Signature
Send a webhook payload with an invalid `X-Razorpay-Signature`:

```bash
curl -i -X POST http://localhost:5000/api/payments/webhook \
  -H "Content-Type: application/json" \
  -H "X-Razorpay-Signature: deadbeef" \
  -d '{"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_test_1","order_id":"<ORDER_A_ID>","amount":39900}}}}'
```
- **Expected:** `400 Bad Request`
- **Response:** `{"success":false,"message":"Invalid webhook signature"}`

---

## 5. Duplicate Verify (Idempotency)
Call `/verify` a second time with the same valid payload after Booking A is already `paid`:

```bash
curl -i -X POST http://localhost:5000/api/payments/verify \
  -H "Authorization: Bearer <USER_A_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "razorpay_order_id": "<ORDER_A_ID>",
    "razorpay_payment_id": "<PAYMENT_A_ID>",
    "razorpay_signature": "<VALID_SIG_A>",
    "bookingId": "<BOOKING_A_ID>"
  }'
```
- **Expected:** `200 OK` (no duplicate email, no error)
- **Response:** `{"success":true,"message":"Payment already verified","booking":{...}}`

---

## 6. Cancelled Booking Create-Order
Attempt to create a Razorpay order for a `cancelled` booking:

```bash
curl -i -X POST http://localhost:5000/api/payments/create-order \
  -H "Authorization: Bearer <USER_A_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"bookingId": "<CANCELLED_BOOKING_ID>"}'
```
- **Expected:** `400 Bad Request`
- **Response:** `{"success":false,"message":"Cannot pay for a cancelled booking"}`
