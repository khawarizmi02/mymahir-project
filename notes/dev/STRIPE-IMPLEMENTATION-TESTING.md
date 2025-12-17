# Stripe Payment Implementation - Testing Guide

**Status:** Ready for End-to-End Testing ✅  
**Date:** December 14, 2025

## What's Been Implemented

### Frontend Changes
- ✅ Fixed `StripeService.createPayment()` to call correct endpoint (`POST /payments`)
- ✅ Updated `PaymentMethod` enum to match backend (STRIPE, MANUAL, BANK_TRANSFER)
- ✅ Created unified payment form with two-step sequential flow:
  - Step 1: Method Selection (STRIPE vs MANUAL)
  - Step 2: Payment Details (property, amount, currency, date)
  - Step 3: Stripe Payment (card entry & confirmation) - only for STRIPE method
- ✅ Integrated Stripe Elements with real `clientSecret` from backend
- ✅ Implemented payment confirmation flow with 3-second success message then redirect

### Backend Changes
- ✅ Added idempotency check to `updatePaymentByStripeId()`:
  - Verifies payment exists by `stripePaymentId`
  - Only updates if payment status is PENDING
  - Returns existing payment without duplicate update on retry
  - Logs warnings when duplicate webhooks are received
- ✅ Enhanced webhook controller with proper error handling:
  - Always returns 200 OK (Stripe will retry on 5xx)
  - Logs success/failure of each webhook event
  - Handles `payment_intent.succeeded` and `payment_intent.failed` events

## Testing Checklist

### Test 1: Stripe Card Payment Flow
**Scenario:** Tenant pays rent via card

1. **Navigate to payment form**
   - Go to `/tenant/payments`
   - Click "New Payment" or similar button
   - Should land on method selection screen

2. **Select Card Payment method**
   - Click "Pay with Card" option
   - Should show payment details form

3. **Fill in payment details**
   - Property: Select from dropdown
   - Amount: Should auto-populate with monthly rent (can edit)
   - Currency: Select MYR (or any)
   - Click "Continue to Payment"

4. **Submit payment (Step 3: Stripe form)**
   - Stripe card element should appear
   - Fill in test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/25)
   - CVC: Any 3 digits (e.g., 123)
   - Cardholder: Any name (e.g., Test User)
   - Click "Pay {amount}"

5. **Verify success**
   - Should see toast: "Payment successful! Your rent has been paid."
   - Toast should display for 3 seconds
   - Then redirect to `/tenant/payments`
   - Payment should appear in history with status "COMPLETED"

6. **Verify backend**
   - Check database: Payment record should have:
     - `status = COMPLETED`
     - `stripePaymentId = pi_xxxxx` (Stripe intent ID)
     - `paidAt = [current timestamp]`
   - Check logs: Should see "Successfully updated payment {id} to COMPLETED"

### Test 2: Manual Bank Transfer Payment Flow
**Scenario:** Tenant pays rent via bank transfer + proof upload

1. **Navigate to payment form**
   - Go to `/tenant/payments`
   - Click "New Payment"
   - Should land on method selection screen

2. **Select Bank Transfer method**
   - Click "Bank Transfer" option
   - Should show payment details form WITH payment date field

3. **Fill in payment details**
   - Property: Select from dropdown
   - Amount: Should auto-populate with monthly rent (can edit)
   - Currency: Select MYR
   - Payment Date: Select a date (defaults to today)
   - Click "Continue to Upload Proof"

4. **Upload proof**
   - Should redirect to proof upload screen
   - Drag & drop or browse receipt image/PDF
   - Upload should complete
   - Should see: "Proof uploaded successfully!"
   - Redirects to payment history

5. **Verify backend**
   - Check database: Payment record should have:
     - `status = PENDING` (waiting for landlord approval)
     - `stripePaymentId = null` (no Stripe data)
     - `clientSecret = null`
     - `proofUrl = {S3 URL}`
   - Check S3: File should exist at proof URL

6. **Verify landlord can see it**
   - Log in as landlord
   - Check payment history for this property
   - Should show manual payment with "PENDING" status
   - Landlord can approve/reject

### Test 3: Failed Card Payment
**Scenario:** Card payment fails and user retries

1. **Attempt payment with failure card**
   - Use test card: `4000000000000002` (always fails)
   - Click "Pay"

2. **Verify error**
   - Should show error message: "Your card was declined" (or similar)
   - User should NOT be redirected
   - Back button available

3. **Retry payment**
   - Click "Back"
   - Should return to payment details form
   - Click "Continue to Payment" again
   - Enter valid card: `4242 4242 4242 4242`
   - Should succeed this time

4. **Verify database**
   - Check Payment table: Should have ONE record (no duplicate)
   - Status should be COMPLETED

### Test 4: Webhook Idempotency
**Scenario:** Stripe webhook fires multiple times

1. **Simulate webhook duplicate**
   - Manually trigger webhook handler twice with same `payment_intent.succeeded` event
   - Use Postman or curl to POST to `/webhooks/stripe`

2. **Verify idempotency**
   - First call: Updates payment to COMPLETED
   - Second call: Should log "Ignoring duplicate webhook"
   - Database: Payment status should still be COMPLETED
   - No errors thrown

3. **Verify logging**
   - Check server logs for:
     ```
     INFO: Processing payment_intent.succeeded for pi_xxxxx
     INFO: Successfully updated payment to COMPLETED
     WARN: Ignoring duplicate webhook for payment pi_xxxxx. Current status: COMPLETED
     ```

### Test 5: Invalid/Missing Payment
**Scenario:** Webhook for payment that doesn't exist

1. **Send webhook for non-existent payment**
   - Create webhook event with fake `stripePaymentId = pi_nonexistent_123`
   - POST to `/webhooks/stripe`

2. **Verify error handling**
   - Webhook handler should catch error
   - Should log: "Failed to update payment pi_nonexistent_123"
   - Should still return 200 OK (not 5xx)
   - Stripe won't retry

### Test 6: Amount Validation
**Scenario:** User tries to pay invalid amounts

1. **Try zero amount**
   - Amount field: 0
   - Button should be disabled (validation error)
   - Can't proceed

2. **Try negative amount**
   - Amount field: -100
   - Button should be disabled
   - Can't proceed

3. **Try valid amount**
   - Amount field: 1500
   - Button enabled
   - Can proceed

### Test 7: Currency Selection
**Scenario:** User pays in different currency

1. **Select STRIPE method**
   - Choose card payment

2. **Change currency**
   - Default: MYR
   - Select: USD
   - Amount auto-updates if needed

3. **Complete payment**
   - Pay with card in USD
   - Check database: Payment should have `currency = USD`

### Test 8: Payment History
**Scenario:** User sees both payment types in history

1. **Make multiple payments**
   - Payment 1: Stripe card payment (COMPLETED)
   - Payment 2: Bank transfer (PENDING - awaiting proof)
   - Payment 3: Bank transfer (COMPLETED - approved by landlord)

2. **Verify history display**
   - All three should appear
   - Statuses correct
   - Methods displayed correctly
   - Dates and amounts accurate

## Error Scenarios

### Network Error During Payment
- Mid-payment, network disconnect
- Expected: Stripe handles client-side
- Recovery: User can refresh and retry

### Payment Intent Already Paid
- Client confirms payment twice
- Expected: Second confirmation should fail
- Recovery: Check database - only one payment created
- Idempotency handles via stripePaymentId uniqueness constraint

### Webhook Timeout
- Stripe retries webhook after 5 seconds, then 5 minutes, then hours
- Expected: Server should handle gracefully
- Verify: Check logs for retry messages

## Database Verification Commands

```sql
-- Check recent payments
SELECT id, tenancyId, amount, method, status, stripePaymentId, paidAt 
FROM Payment 
ORDER BY createdAt DESC 
LIMIT 10;

-- Find payment by Stripe ID
SELECT * FROM Payment WHERE stripePaymentId = 'pi_xxxxx';

-- Count by method
SELECT method, COUNT(*) as count, status 
FROM Payment 
GROUP BY method, status;

-- Check proof uploads
SELECT id, amount, status, proofUrl 
FROM Payment 
WHERE method = 'MANUAL' AND proofUrl IS NOT NULL;
```

## Log Checking

```bash
# Check server logs for Stripe events
grep -i "stripe" logs/server.log

# Check webhook processing
grep -i "payment_intent" logs/server.log

# Check idempotency warnings
grep "Ignoring duplicate webhook" logs/server.log
```

## Postman Testing

### Create Stripe Payment
```
POST /api/v1/payments
Content-Type: application/json
Authorization: Bearer {jwt_token}

{
  "tenancyId": 1,
  "amount": 1500,
  "currency": "USD",
  "method": "STRIPE",
  "paidAt": "2025-12-14T10:00:00Z"
}

Expected Response:
{
  "success": true,
  "data": {
    "id": 123,
    "tenancyId": 1,
    "amount": 1500,
    "method": "STRIPE",
    "status": "PENDING",
    "stripePaymentId": "pi_1234567890",
    "clientSecret": "pi_1234567890_secret_xxxxx",
    "createdAt": "2025-12-14T10:00:00Z"
  }
}
```

### Create Manual Payment
```
POST /api/v1/payments
Content-Type: application/json
Authorization: Bearer {jwt_token}

{
  "tenancyId": 1,
  "amount": 1500,
  "currency": "MYR",
  "method": "MANUAL",
  "paidAt": "2025-12-14T10:00:00Z"
}

Expected Response:
{
  "success": true,
  "data": {
    "id": 124,
    "tenancyId": 1,
    "amount": 1500,
    "method": "MANUAL",
    "status": "PENDING",
    "stripePaymentId": null,
    "clientSecret": null,
    "proofUrl": null,
    "createdAt": "2025-12-14T10:00:00Z"
  }
}
```

### Test Webhook
```
POST /api/v1/webhooks/stripe
Content-Type: application/json

{
  "id": "evt_1234567890",
  "object": "event",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_1234567890",
      "object": "payment_intent",
      "status": "succeeded"
    }
  }
}

Expected Response:
{
  "received": true
}
```

## Success Criteria

✅ All tests pass  
✅ No database duplicates for same payment  
✅ Webhook idempotency working (duplicate webhooks don't duplicate payments)  
✅ Both payment methods working independently  
✅ Payment history shows all payments correctly  
✅ User receives appropriate success/error messages  
✅ Redirect flows work as expected  
✅ S3 uploads working for proof files  

## Known Issues / Limitations

- Stripe test mode only (live keys not configured yet)
- Payment refunds not implemented yet
- Partial payment not supported (full amount only)
- Currency conversion rates not implemented

---

**Ready for Testing! 🚀**

Execute all tests above and report results. Once confirmed working, can move to Week 5 tasks.
