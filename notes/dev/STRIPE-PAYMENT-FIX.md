# Stripe Payment Frontend Implementation Guide

**Status:** Week 4 | Action Required ✅  
**Priority:** High (User's stated focus)  
**Updated:** December 14, 2025

---

## Executive Summary

Your Stripe payment system has a **working backend** but **incomplete frontend**. The backend creates `PaymentIntent` objects and returns `clientSecret`, but the frontend components don't properly consume this data or integrate with Stripe.js.

### What's Working ✅
- Backend `/api/v1/payments` POST endpoint accepts `method` parameter (STRIPE|MANUAL)
- `createPaymentIntent` creates Stripe PaymentIntent and returns `clientSecret`
- Database has uniqueness constraint on `stripePaymentId` (provides idempotency safety)
- StripeService loads Stripe.js script dynamically
- Proof upload component handles S3 presigned URLs correctly

### What's Broken ❌
1. **StripeService.createPaymentIntent()** calls wrong endpoint (`/payments/stripe/intent` instead of POST `/payments`)
2. **stripe-payment component** uses hardcoded test clientSecret instead of fetching real one
3. **Payment method selection** not integrated - Stripe form doesn't show when user selects "STRIPE" method
4. **payment-form component** doesn't trigger Stripe card form - only handles MANUAL method
5. **No method selection UI** - users can't choose between card (STRIPE) and receipt (MANUAL)

---

## Architecture Overview

### Current Flow (BROKEN)
```
User → Payment Form (MANUAL only)
  → Create Payment (method=MANUAL)
  → Backend returns payment record (no clientSecret)
  → User is prompted to upload proof
  ✅ Works for MANUAL only
```

### Target Flow (What We're Building)
```
User → Unified Payment Form
  ├─ Select MANUAL Method
  │  → Create Payment (method=MANUAL)
  │  → Redirect to Proof Upload
  │  ✅ Already working
  │
  └─ Select STRIPE Method
     → Create Payment (method=STRIPE)
     → Backend returns { clientSecret, stripePaymentId }
     → Show Stripe Card Element
     → User enters card details
     → confirmPayment() with Stripe
     → Success redirects to payment history
     ❌ NOT IMPLEMENTED
```

---

## Core Issues & Solutions

### Issue 1: StripeService Calls Wrong Endpoint

**Current Code (WRONG):**
```typescript
// stripe.service.ts:185
createPaymentIntent(tenancyId: number, amount: number): Observable<any> {
  return this.http.post<{ success: boolean; data: any }>(
    `${this.apiUrl}/payments/stripe/intent`,  // ❌ WRONG ENDPOINT
    {
      tenancyId,
      amount,
      currency: 'USD',
      method: PaymentMethod.ONLINE  // ❌ WRONG - use STRIPE
    }
  );
}
```

**Problem:**
- Backend doesn't have `/payments/stripe/intent` route
- Backend route is `/payments` (POST) with method parameter
- Using `PaymentMethod.ONLINE` but backend expects `PaymentMethod.STRIPE`

**Solution:**
```typescript
// stripe.service.ts
createPayment(payload: {
  tenancyId: number;
  amount: number;
  currency: string;
  method: PaymentMethod;
  paidAt?: Date;
}): Observable<any> {
  return this.http.post<{ success: boolean; data: any }>(
    `${this.apiUrl}/payments`,  // ✅ CORRECT
    payload
  );
}
```

---

### Issue 2: Hardcoded Test ClientSecret

**Current Code (WRONG):**
```typescript
// stripe-payment.component.ts:102
private initializeStripe(): void {
  if (!this.stripeElementRef) {
    return;
  }

  this.stripeService.initializeStripe().then(() => {
    if (this.stripeElementRef) {
      // ❌ HARDCODED TEST VALUE - WRONG!
      const clientSecret = 'pi_test_secret_test';
      this.stripeService.createPaymentElement(
        this.stripeElementRef!.nativeElement,
        clientSecret
      );
    }
  });
}
```

**Problem:**
- Uses fake test secret instead of real one from backend
- Component doesn't know what payment is being made
- Can't pass validation/confirmation

**Solution:**
- Create payment first via backend
- Receive real `clientSecret` in response
- Initialize Stripe element AFTER payment creation

---

### Issue 3: No Payment Method Selection UI

**Current Problem:**
- `payment-form.component` only handles MANUAL method
- `stripe-payment.component` attempts to handle Stripe but independently
- User can't choose between payment methods
- Two separate components don't communicate

**Recommended Solution:**
Create a unified payment form with tabs or conditional rendering:

```
┌─ Payment Form ─────────────────────┐
│ Property Selection                 │
│ Amount                            │
│ Due Date                          │
│                                   │
│ [Select Payment Method]           │
│  ○ Card Payment (Stripe)          │
│  ○ Manual Transfer + Upload       │
│                                   │
│ IF MANUAL:                        │
│  └─ Notes field                   │
│  └─ [Create Payment] button       │
│                                   │
│ IF STRIPE:                        │
│  └─ Stripe Card Element           │
│  └─ [Pay Now] button              │
│                                   │
└───────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Fix StripeService (stripe.service.ts)

Replace the entire `createPaymentIntent()` method:

```typescript
/**
 * Create payment with backend (handles both STRIPE and MANUAL)
 */
createPayment(payload: {
  tenancyId: number;
  amount: number;
  currency: string;
  method: PaymentMethod;
  paidAt?: Date;
}): Observable<any> {
  return this.http.post<{ success: boolean; data: any }>(
    `${this.apiUrl}/payments`,
    payload
  );
}
```

Also ensure this method exists for confirming payment:

```typescript
/**
 * Confirm payment with Stripe (after user enters card details)
 */
async confirmPayment(clientSecret: string): Promise<any> {
  try {
    if (!this.stripe || !this.elements) {
      this.errorSignal.set('Stripe or elements not initialized');
      return;
    }

    this.loadingSignal.set(true);
    
    const result = await this.stripe.confirmPayment({
      elements: this.elements,
      confirmParams: {
        return_url: `${window.location.origin}/tenant/payments`,
      },
    });

    this.loadingSignal.set(false);
    
    if (result.error) {
      this.errorSignal.set(result.error.message || 'Payment failed');
      return result;
    }

    return result;
  } catch (error: any) {
    this.errorSignal.set(error?.message || 'Payment confirmation failed');
    this.loadingSignal.set(false);
    return { error };
  }
}
```

---

### Step 2: Update payment-form Component (RECOMMENDED: Create Unified Component)

**Option A: Refactor payment-form to include both methods**

Add to `payment-form.component.ts`:

```typescript
import { PaymentMethod } from '../../../../interfaces/models';

export class TenantPaymentFormComponent implements OnInit {
  // ... existing code ...
  
  paymentForm: FormGroup;
  
  ngOnInit(): void {
    this.initializeForm();
    this.loadTenancies();
  }

  private initializeForm(): void {
    this.paymentForm = this.fb.group({
      tenancyId: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      currency: ['MYR', Validators.required],
      method: [PaymentMethod.MANUAL, Validators.required],  // ADD THIS
      paidAt: [new Date(), Validators.required]
    });
  }

  onPaymentMethodChange(): void {
    const method = this.paymentForm.get('method')?.value;
    
    if (method === PaymentMethod.STRIPE) {
      // Will show Stripe form below
      this.showStripeForm = true;
      this.initializeStripeElement();
    } else {
      this.showStripeForm = false;
    }
  }

  private initializeStripeElement(): void {
    // Initialize Stripe element after payment is created
    // This happens in stripe-payment-tab component
  }

  onSubmit(): void {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formValue = this.paymentForm.value;
    
    // Create payment with correct method
    const payload = {
      tenancyId: formValue.tenancyId,
      amount: Number(formValue.amount),
      currency: formValue.currency,
      method: formValue.method,  // STRIPE or MANUAL
      paidAt: formValue.paidAt ? formValue.paidAt.toISOString() : new Date().toISOString()
    };

    this.stripeService.createPayment(payload).subscribe({  // Use new method name
      next: (response) => {
        const paymentData = response.data;
        
        if (paymentData.method === PaymentMethod.STRIPE) {
          // Show Stripe form and await payment
          this.handleStripePayment(paymentData);
        } else {
          // Redirect to proof upload
          this.router.navigate(['/tenant/payments', paymentData.id, 'upload-proof']);
        }
        
        this.isSubmitting = false;
      },
      error: (err) => {
        this.isSubmitting = false;
        this.snackBar.open(err.error?.message || 'Failed to create payment', 'Close', {
          duration: 3000
        });
      }
    });
  }

  private async handleStripePayment(paymentData: any): Promise<void> {
    // paymentData contains: { id, clientSecret, stripePaymentId, ... }
    
    // Initialize Stripe if not already done
    await this.stripeService.initializeStripe();

    // Show Stripe form tab
    this.activeTab = 'stripe';

    // Mount payment element with real clientSecret
    if (this.stripeElementRef) {
      this.stripeService.createPaymentElement(
        this.stripeElementRef.nativeElement,
        paymentData.clientSecret
      );
    }

    // When user clicks "Pay Now", call confirmPayment
    // (See below for payment confirmation logic)
  }

  async confirmStripePayment(): Promise<void> {
    this.isProcessing = true;

    try {
      const result = await this.stripeService.confirmPayment(
        this.currentClientSecret  // Stored when payment created
      );

      if (result.paymentIntent?.status === 'succeeded') {
        this.snackBar.open('Payment successful!', 'OK', { duration: 5000 });
        this.router.navigate(['/tenant/payments']);
      } else {
        this.snackBar.open(
          result.error?.message || 'Payment failed',
          'Close',
          { duration: 3000 }
        );
      }
    } catch (error: any) {
      this.snackBar.open(error.message || 'Payment error', 'Close', {
        duration: 3000
      });
    } finally {
      this.isProcessing = false;
    }
  }
}
```

---

### Step 3: Fix stripe-payment Component (Alternative: Use for Tab-based UI)

If keeping separate components, update `stripe-payment.component.ts`:

```typescript
private initializeStripe(): void {
  if (!this.stripeElementRef || !this.currentTenancy) {
    return;
  }

  this.isProcessing = true;

  // Step 1: Create payment with STRIPE method
  const payload = {
    tenancyId: this.currentTenancy.id,
    amount: this.paymentForm.get('amount')?.value,
    currency: 'USD',
    method: PaymentMethod.STRIPE,
    paidAt: new Date().toISOString()
  };

  this.stripeService.createPayment(payload).subscribe({  // Fixed method name
    next: async (response) => {
      const clientSecret = response?.data?.clientSecret;
      
      if (!clientSecret) {
        this.errorMessage = 'Failed to create payment intent';
        this.isProcessing = false;
        return;
      }

      // Store for later use
      this.currentClientSecret = clientSecret;
      this.currentPaymentId = response.data.id;

      // Step 2: Initialize Stripe with real clientSecret
      try {
        await this.stripeService.initializeStripe();
        this.stripeService.createPaymentElement(
          this.stripeElementRef!.nativeElement,
          clientSecret
        );
        this.isProcessing = false;
      } catch (error: any) {
        this.errorMessage = 'Failed to initialize payment form';
        this.isProcessing = false;
      }
    },
    error: (error) => {
      this.errorMessage = error.error?.message || 'Failed to create payment';
      this.isProcessing = false;
    }
  });
}

onSubmit(): void {
  if (!this.paymentForm.valid) return;

  this.isProcessing = true;

  // Confirm payment with Stripe
  this.stripeService.confirmPayment(this.currentClientSecret).then((result) => {
    if (result.paymentIntent?.status === 'succeeded') {
      this.successMessage = 'Payment successful! Your rent has been paid.';
      this.paymentForm.reset();
      this.snackBar.open('Payment completed successfully', 'Close', { duration: 5000 });
      
      // Reload payment history
      setTimeout(() => {
        this.loadPaymentHistory();
      }, 1000);
    } else {
      this.errorMessage = `Payment failed: ${result.error?.message || 'Unknown error'}`;
      this.snackBar.open('Payment failed', 'Close', { duration: 3000 });
    }
    this.isProcessing = false;
  }).catch((error) => {
    this.errorMessage = `Payment error: ${error.message}`;
    this.isProcessing = false;
    this.snackBar.open('Payment error', 'Close', { duration: 3000 });
  });
}
```

---

## API Contract Reference

### Backend Response (POST /api/v1/payments)

**If method=STRIPE:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "tenancyId": 5,
    "amount": 1500,
    "currency": "USD",
    "method": "STRIPE",
    "status": "PENDING",
    "stripePaymentId": "pi_1234567890",
    "clientSecret": "pi_1234567890_secret_abcdefg",  // ✅ Frontend uses this
    "createdAt": "2025-12-14T10:00:00Z",
    "paidAt": null
  }
}
```

**If method=MANUAL:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "tenancyId": 5,
    "amount": 1500,
    "currency": "MYR",
    "method": "MANUAL",
    "status": "PENDING",
    "stripePaymentId": null,  // No Stripe data
    "clientSecret": null,
    "createdAt": "2025-12-14T10:00:00Z",
    "paidAt": null
  }
}
```

**Frontend must check:**
- `response.data.method === PaymentMethod.STRIPE` → Show Stripe form + clientSecret
- `response.data.method === PaymentMethod.MANUAL` → Redirect to proof upload

---

## Testing Checklist

### Frontend Stripe Card Payment
- [ ] Navigate to payment form
- [ ] Select STRIPE method
- [ ] See Stripe card element appear
- [ ] Enter test card: `4242 4242 4242 4242`, any future date, any CVC
- [ ] Click "Pay Now"
- [ ] See success message or error message
- [ ] Payment appears in history with COMPLETED status
- [ ] Webhook updated status (check database)

### Frontend Manual Proof Payment
- [ ] Navigate to payment form
- [ ] Select MANUAL method
- [ ] Enter amount and date
- [ ] Click "Create Payment"
- [ ] Redirected to proof upload
- [ ] Upload receipt image or PDF
- [ ] See success message
- [ ] Payment appears with PENDING status
- [ ] Return to history, see manual payment

### Error Handling
- [ ] Invalid card (e.g., `4000000000000002`) shows error
- [ ] Network error during payment shows retry
- [ ] Large file upload shows progress and error handling
- [ ] Missing clientSecret shows fallback error

---

## File Changes Summary

| File | Change | Priority |
|------|--------|----------|
| `stripe.service.ts` | Fix `createPayment()` method name and endpoint | HIGH |
| `stripe-payment.component.ts` | Fetch real clientSecret from backend | HIGH |
| `payment-form.component.ts` | Add STRIPE method selection, integrate Stripe form | HIGH |
| `payment-form.component.html` | Add radio buttons for STRIPE/MANUAL selection | HIGH |
| `payment.route.ts` | Verify routes ✅ (already correct) | LOW |
| `payment.controller.ts` | Verify controller ✅ (already correct) | LOW |
| `payment.service.ts` | Verify service ✅ (already correct) | LOW |

---

## Next Steps (User Action)

1. **Review this document** - Ensure architecture makes sense
2. **Answer clarification questions** (if any) - Specific UI/UX decisions
3. **I'll implement fixes** - Apply changes to components
4. **Test end-to-end** - Both STRIPE and MANUAL flows
5. **Deploy to staging** - Verify with real Stripe test account

---

## Questions for User

1. **Tab-based or Sequential UI?**
   - Tab-based: Show "Make Payment" tab with STRIPE/MANUAL tabs inside
   - Sequential: First show method selection, then render form based on choice
   - **Recommendation:** Sequential for clarity (RECOMMENDED)

2. **Should payment-form handle both methods?**
   - YES (recommended): Single unified component with conditional rendering
   - NO: Keep separate (stripe-payment for STRIPE, payment-form for MANUAL)
   - **Recommendation:** YES (RECOMMENDED)

3. **What should happen after successful Stripe payment?**
   - Redirect to payment history (RECOMMENDED)
   - Show thank you modal then redirect
   - Show payment receipt immediately
   - **Recommendation:** Redirect to history with success toast

4. **Should we pre-fill amount with tenant's monthly rent?**
   - YES (better UX) - auto-populate from tenancy data
   - NO - let user enter custom amount
   - **Recommendation:** YES with option to edit

5. **Error recovery flow?**
   - If Stripe payment fails, let user retry immediately?
   - Or create new payment and start over?
   - **Recommendation:** Allow immediate retry

---

**Last Updated:** December 14, 2025  
**Status:** Ready for Implementation ✅
