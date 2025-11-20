# WEEK 5: MANUAL PAYMENTS + PAYMENT HISTORY + POLISH
**Goal:** Manual payment receipts + Comprehensive payment history UI + Feature polish  
**Duration:** 7 days (Mon–Sun)  
**Team:** 3 Developers  
**Deliverable by Sunday:**  
> Tenants can **upload bank receipts for manual payments**  
> Landlords can **approve/reject manual payments**  
> Complete **payment history table** with all transaction details  
> App polished & mobile-friendly

---

## TEAM ROLES (Week 5)

| Dev | Focus |
|-----|-------|
| **Khawa (Backend)** | Manual payment API, approval logic, payment history queries |
| **Amsyar (Full-Stack)** | Receipt upload to S3, manual payment service, payment dashboard |
| **Islam (Frontend)** | Manual payment form, payment history table, landlord approval UI, polish & responsiveness |

---

## DAILY TODO LIST (Monday → Sunday)

---

### MONDAY: Manual Payment API (Backend)

| Task | Owner | Details |
|------|-------|-------|
| **Update Payment model** | Khawa | Ensure Payment schema supports manual payments:

```prisma
model Payment {
  id              Int     @id @default(autoincrement())
  tenancyId       Int?
  tenantId        Int
  amount          Float
  currency        String  @default("USD")
  method          PaymentMethod  // STRIPE | MANUAL
  status          PaymentStatus  @default(PENDING) // PENDING | COMPLETED | FAILED
  stripePaymentId String?
  proofUrl        String?  // S3 URL for manual receipt
  notes           String?  // landlord notes on approval/rejection
  approvedAt      DateTime?
  approvedBy      Int?  // landlordId who approved
  paidAt          DateTime?
  createdAt       DateTime @default(now())

  tenant          User      @relation(fields: [tenantId], references: [id])
  tenancy         Tenancy?  @relation(fields: [tenancyId], references: [id])
}
```

| **Create manual payment endpoint** | Khawa |

```ts
POST /api/v1/payments/manual
Body: { tenancyId, amount, receiptFile }
→ Upload receipt to S3
→ Create Payment record: method=MANUAL, status=PENDING
→ Return: { paymentId, status, proofUrl }
```

| **Create payment approval endpoint** | Khawa |

```ts
PUT /api/v1/payments/:id/approve
Body: { approved: boolean, notes?: string }
→ Only landlord of related property can approve
→ Update Payment: status=COMPLETED, approvedAt=now, approvedBy=landlordId
→ OR status=FAILED, notes=rejection reason
→ Return: { payment: Payment }
```

| **Enhance payment queries** | Khawa | Add to payment service:

```ts
async getPaymentsByProperty(propertyId: number): Promise<Payment[]>
async getPaymentsByLandlord(landlordId: number): Promise<Payment[]>  
async getPendingPayments(landlordId: number): Promise<Payment[]>
async getPaymentHistory(tenancyId?: number, startDate?: Date, endDate?: Date): Promise<Payment[]>
```

| **Test with Postman** | Khawa | Create manual payment, approve, verify DB |

**Milestone:** Manual payment API complete

---

### TUESDAY: Receipt Upload to S3 (Backend)

| Task | Owner | Details |
|------|-------|-------|
| **Add receipt upload endpoint** | Khawa |

```ts
POST /api/v1/payments/:id/upload-receipt
→ Use multer to handle file upload
→ Call S3Service.uploadManualReceipt(file, filename)
→ Update Payment.proofUrl
→ Return: { proofUrl, status }
```

| **Enhance S3Service** | Khawa | Add receipt upload method:

```ts
async uploadManualReceipt(file: Buffer, filename: string): Promise<string>
  // Similar to property/maintenance photos
  // Store in S3 with folder: /receipts/
```

| **Add file validation** | Khawa | 

- Accept: jpg, jpeg, png, pdf
- Max file size: 5MB
- Validate MIME type

| **Test file upload** | Amsyar | 

- Upload test receipt (image/PDF)
- Verify in S3
- Verify URL in Payment record

**Milestone:** Receipt upload working

---

### WEDNESDAY: Frontend - Manual Payment Form

| Task | Owner | Details |
|------|-------|-------|
| **Create Manual Payment component** | Islam | `client/src/app/tenant/manual-payment/manual-payment.component.ts`

Form fields:
- Tenancy (read-only, auto-filled)
- Amount (editable, auto-filled from tenancy.monthlyRent)
- Receipt file upload (image or PDF)
- Submit button
- Cancel button

| **Add file preview** | Islam | 

- Show file name before upload
- If image, show thumbnail
- If PDF, show PDF icon

| **Add receipt upload logic** | Islam | 

```ts
onReceiptSelect(file: File) {
  // Validate: jpg/png/pdf, < 5MB
  // Show preview
}

onSubmit() {
  // 1. Create payment record (status: PENDING)
  // 2. Upload receipt
  // 3. Show success message
  // 4. Redirect to payment history
}
```

| **Add form validation** | Islam | 

- Receipt file required
- Amount > 0

| **Add error handling** | Islam | Show user-friendly error messages |

**Milestone:** Manual payment form working

---

### THURSDAY: Frontend - Landlord Payment Approval

| Task | Owner | Details |
|------|-------|-------|
| **Create Pending Payments component (Landlord)** | Islam | `client/src/app/landlord/pending-payments/pending-payments.component.ts`

Display Material table:
- Tenant name
- Property name
- Amount
- Receipt (preview/download link)
- Action buttons: Approve, Reject

| **Create Payment Approval Dialog** | Islam | `client/src/app/landlord/payment-approval/payment-approval.component.ts`

Show:
- Payment details
- Receipt preview (image gallery or PDF viewer)
- Approval form:
  - Radio: Approve / Reject
  - Notes (textarea) - optional for approve, required for reject
  - Submit button

| **Implement approval logic** | Islam | 

```ts
onApprove() {
  paymentService.approvePayment(paymentId, { approved: true, notes: '' })
    .subscribe(() => {
      // Remove from pending list
      // Show success message
    })
}

onReject() {
  paymentService.approvePayment(paymentId, { approved: false, notes: rejectReason })
    .subscribe(() => {
      // Remove from pending list
      // Show rejection message
    })
}
```

| **Add Material Dialog** | Islam | Use `MatDialog` for approval form |

**Milestone:** Landlord can approve/reject payments

---

### FRIDAY: Payment History Table (Frontend)

| Task | Owner | Details |
|------|-------|-------|
| **Create Payment History component** | Islam | `client/src/app/tenant/payment-history/payment-history.component.ts`

Display Material table with columns:
- Date (paidAt or createdAt)
- Amount
- Method (Stripe | Manual Receipt)
- Status (Pending | Completed | Failed)
- Receipt URL (if manual) - clickable link
- Actions (if pending, show "Upload Receipt" or similar)

| **Add filtering & sorting** | Islam | 

- Filter by status (All, Pending, Completed, Failed)
- Filter by method (All, Stripe, Manual)
- Sort by date (newest first)
- Date range picker (optional)

| **Add landlord payment list** | Islam | `client/src/app/landlord/payment-history/payment-history.component.ts`

Display:
- All payments across all properties
- Grouped by property (collapsible sections)
- Show tenant names
- Status + approval date

| **Add pagination** | Islam | If many payments, paginate (e.g., 10 per page) |
| **Add Material table features** | Islam | 

- Sticky header
- Column filtering
- Export to CSV (optional)

**Milestone:** Full payment history visible

---

### SATURDAY: Polish & Mobile Responsiveness

| Task | Owner | Details |
|------|-------|-------|
| **Test all pages on mobile** | Islam | 

- Check property list/detail on mobile
- Check maintenance form on mobile
- Check payment forms on mobile
- Ensure buttons & forms are touch-friendly

| **Fix layout issues** | Islam | 

- Reduce card padding on mobile
- Make tables responsive (horizontal scroll or collapse)
- Ensure images scale properly
- Fix any overflow issues

| **Improve Material spacing** | Islam | 

- Add consistent padding/margins
- Use Material breakpoints (`@media`)
- Test on: mobile (375px), tablet (768px), desktop (1200px)

| **Add loading states** | Islam | Show spinners for:
- Data fetching
- File uploads
- Payment processing

| **Improve error messages** | Islam | 

- Replace generic errors with user-friendly messages
- Show validation errors inline
- Add retry buttons where appropriate

| **Add empty state messages** | Islam | 

- "No properties found"
- "No maintenance requests"
- "No payment history"

| **Add breadcrumbs (optional)** | Islam | Help users navigate (especially tenant → property → lease → payment) |

**Milestone:** App polished & responsive

---

### SUNDAY: Final Testing + Deployment

| Task | Owner | Details |
|------|-------|-------|
| **Full end-to-end testing** | All | 

**Landlord workflow:**
1. Create property
2. Upload images
3. Assign tenant
4. View pending payments
5. Approve/reject manual payments
6. View payment history

**Tenant workflow:**
1. Browse properties
2. View current lease
3. Pay via Stripe
4. Upload manual receipt
5. Submit maintenance request
6. View payment history

| **Test payment flows** | All | 

- Stripe payment succeeds
- Stripe payment fails (use test failure card)
- Manual payment upload
- Landlord approval
- Landlord rejection

| **Test on multiple devices** | Islam | 

- Desktop (Chrome, Firefox, Safari)
- Mobile (iOS, Android)
- Tablet

| **Performance check** | All | 

- Check page load times
- Check image loading (S3)
- Check API response times

| **Fix remaining bugs** | All | Document & fix issues found |
| **Update code documentation** | Khawa | Add comments to complex functions |
| **Prepare for Week 6** | All | 

- List any remaining bugs
- Plan Week 6 polish & edge cases

| **Deploy to Railway** | Khawa | 

```bash
git add .
git commit -m "Week 5: Manual Payments + Payment History + Polish"
git push origin main
```

| **Test on live app** | All | Verify all payment features on Railway |
| **Create comprehensive demo video** | All | Record 5-7 min demo:

1. Landlord create property & assign tenant
2. Tenant view lease & payment options
3. Tenant pay via Stripe
4. Tenant upload manual receipt
5. Landlord review & approve payment
6. View payment history
7. Show maintenance request (from Week 4)
8. Show app responsiveness on mobile

| **Update README** | Amsyar | 

- Document all features implemented
- Add demo video link
- Add deployment instructions

**Milestone:** Feature-complete app with manual payments & history

---

## WEEK 5 DELIVERABLES (By Sunday Night)

| Deliverable | Status |
|-----------|--------|
| Manual payment API (backend) | Done |
| Receipt upload to S3 | Done |
| Payment approval/rejection (backend) | Done |
| Manual payment form (frontend) | Done |
| Landlord payment approval UI | Done |
| Comprehensive payment history table | Done |
| Mobile responsiveness | Done |
| All features tested & deployed | Done ✅ |

---

## NOTES FOR DEVELOPERS

- **Khawa**: Ensure payment status transitions are correct (PENDING → COMPLETED/FAILED only).
- **Islam**: Use Material table advanced features (sticky headers, filters).
- **Amsyar**: Test S3 receipt uploads thoroughly. Ensure files are accessible.
- **Testing**: Test rejection scenarios (landlord rejects payment multiple times).
- **Git**: Tag this version as `v1.0-beta` when deployed.

---

## PROGRESS UPDATE

✅ Week 1: Auth complete  
✅ Week 2: Properties + S3  
✅ Week 3: Tenancy + Stripe backend + Deployed  
✅ Week 4: Maintenance + Stripe frontend  
✅ Week 5: Manual payments + Payment history + Polish  

**Next: Week 6 - Final Polish + Edge Cases + Demo Prep** 🎉
