# WEEK 4: MAINTENANCE REQUESTS + STRIPE FRONTEND
**Goal:** Maintenance request system (backend & frontend) + Stripe payment UI  
**Duration:** 7 days (Mon–Sun)  
**Team:** 3 Developers  
**Deliverable by Sunday:**  
> Tenants can **submit maintenance requests with photos**  
> Landlords can **view & update maintenance status**  
> Tenants can **pay rent via Stripe** (frontend integration)  
> Payment history table shows all transactions

---

## TEAM ROLES (Week 4)

| Dev | Focus |
|-----|-------|
| **Khawa (Backend)** | Maintenance API, Stripe payment confirmation logic |
| **Amsyar (Full-Stack)** | Stripe frontend integration, payment UI logic, S3 reuse for maintenance photos |
| **Islam (Frontend)** | Maintenance form + list components, Stripe payment form, payment history table |

---

## DAILY TODO LIST (Monday → Sunday)

---

### MONDAY: Maintenance API (Backend)

| Task | Owner | Details |
|------|-------|-------|
| **Review Maintenance schema** | Khawa | Verify Prisma model:

```prisma
model Maintenance {
  id          Int     @id @default(autoincrement())
  propertyId  Int
  tenantId    Int
  title       String
  description String?
  status      MaintenanceStatus @default(PENDING) // PENDING | IN_PROGRESS | RESOLVED
  photos      String[]  // array of S3 URLs
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  property    Property @relation(fields: [propertyId], references: [id])
  tenant      User     @relation(fields: [tenantId], references: [id])
}
```

| **Create Maintenance service** | Khawa | `server/src/services/maintenance.service.ts`

```ts
async createMaintenanceRequest(data: CreateMaintenanceDTO, tenantId: number): Promise<Maintenance>
  // Validate: tenant exists, property exists
  // Create maintenance record with PENDING status
  // Handle photos array (empty initially, filled on photo upload)

async getMaintenanceById(id: number): Promise<Maintenance>
async getMaintenanceByProperty(propertyId: number): Promise<Maintenance[]>
async getMaintenanceByTenant(tenantId: number): Promise<Maintenance[]>
async updateMaintenanceStatus(id: number, status: MaintenanceStatus): Promise<Maintenance>
async deleteMaintenanceRequest(id: number): Promise<void>
```

| **Create Maintenance controller** | Khawa | `server/src/controller/maintenance.controller.ts`

```ts
POST /api/v1/maintenance → createMaintenanceRequest()
GET /api/v1/maintenance/:id → getMaintenanceById()
GET /api/v1/maintenance?propertyId=X → filter by property
GET /api/v1/maintenance?tenantId=X → filter by tenant
PUT /api/v1/maintenance/:id → updateMaintenanceStatus() [landlord only]
POST /api/v1/maintenance/:id/photos → uploadMaintenancePhoto()
DELETE /api/v1/maintenance/:id → deleteMaintenanceRequest()
```

| **Create Maintenance routes** | Khawa | `server/src/router/v1/maintenance.route.ts` |
| **Add authorization** | Khawa | 

- Tenant can create maintenance for their property only
- Landlord can update status for maintenance on their properties
- Landlord can view maintenance for their properties

| **Test with Postman** | Khawa | Create maintenance request, verify DB record |

**Milestone:** Maintenance API functional

---

### TUESDAY: Maintenance Photo Upload (Backend)

| Task | Owner | Details |
|------|-------|-------|
| **Reuse S3Service** | Khawa | Add method to S3Service:

```ts
async uploadMaintenancePhoto(file: Buffer, filename: string): Promise<string>
```

(Same as property photo upload)

| **Create maintenance photo endpoint** | Khawa |

```ts
POST /api/v1/maintenance/:id/photos
→ multer middleware
→ S3 upload
→ append URL to maintenance.photos array
→ return { photoUrl, photoCount }
```

| **Update Maintenance model** | Khawa | Support array of photo URLs:

```prisma
photos      String[]  // stored as JSON
```

| **Test photo upload** | Khawa | 

- Upload photo to maintenance request
- Verify appears in S3
- Verify URL stored in DB

**Milestone:** Maintenance photos working end-to-end

---

### WEDNESDAY: Stripe Frontend - Payment Form

| Task | Owner | Details |
|------|-------|-------|
| **Setup Stripe Elements** | Amsyar | Create `StripeService`:

```ts
// client/src/app/services/stripe.service.ts
export class StripeService {
  private stripe: Stripe;
  private elements: StripeElements;

  constructor(private http: HttpClient) {
    this.stripe = await loadStripe(environment.stripePublishableKey);
    this.elements = this.stripe.elements();
  }

  async createPaymentElement(containerId: string): Promise<StripePaymentElement>
  async confirmPayment(clientSecret: string): Promise<PaymentResult>
}
```

| **Create Payment component (tenant)** | Islam | `client/src/app/tenant/payment/payment.component.ts`

```ts
// Display:
- Tenancy info: property, landlord, amount due
- Amount input (auto-filled from tenancy.monthlyRent)
- Stripe card element
- "Pay Now" button
- "Upload Receipt" button (for manual payment, Week 5)

// On submit:
1. Call PaymentService.createPaymentIntent(tenancyId, amount)
2. Receive clientSecret
3. Use StripeService.confirmPayment(clientSecret)
4. Handle success/error
5. Show confirmation with receipt
```

| **Add Material UI** | Islam | Use:
- `MatCard` for payment form
- `MatFormField` for amount input
- `MatButton` for actions
- `MatSnackBar` for messages

| **Add form validation** | Islam | 

- Amount > 0
- Card details valid
- Show loading spinner during payment

| **Test locally** | Islam | 

- Use Stripe test card: `4242 4242 4242 4242`
- Verify payment succeeds
- Check browser console for Stripe responses

**Milestone:** Stripe payment form rendering

---

### THURSDAY: Stripe Payment Confirmation (Backend)

| Task | Owner | Details |
|------|-------|-------|
| **Update Payment controller** | Khawa | Enhance payment confirmation:

```ts
POST /api/v1/payments/confirm-payment
Body: { paymentIntentId, tenancyId }
→ Verify payment status with Stripe API
→ Update Payment record: status = COMPLETED, paidAt = now
→ Return: { success: true, payment: Payment }
```

| **Webhook handler** | Khawa | Ensure webhook properly handles:

```ts
event.type === 'payment_intent.succeeded'
→ Extract paymentIntentId
→ Find Payment record by stripePaymentId
→ Update status = COMPLETED
→ Send confirmation (optional)

event.type === 'payment_intent.payment_failed'
→ Update status = FAILED
→ Log error
```

| **Test webhook locally** | Amsyar | Use `stripe-cli`:

```bash
stripe listen --forward-to localhost:4000/api/v1/webhooks/stripe
stripe trigger payment_intent.succeeded
```

Verify: Payment record updated in DB

| **Handle edge cases** | Khawa | 

- Duplicate webhook deliveries (idempotency)
- Payment already marked as completed
- Payment not found in DB

**Milestone:** Stripe payment confirmation working

---

### FRIDAY: Frontend - Maintenance Request Form

| Task | Owner | Details |
|------|-------|-------|
| **Create Maintenance Request component** | Islam | `client/src/app/tenant/maintenance-form/maintenance-form.component.ts`

Form fields:
- Title (text input)
- Description (textarea)
- Photo upload (multiple, max 3)
- Submit button

| **Create MaintenanceService** | Islam | `client/src/app/services/maintenance.service.ts`

```ts
createMaintenanceRequest(data: CreateMaintenanceDTO): Observable<Maintenance>
getMaintenanceByTenant(tenantId: number): Observable<Maintenance[]>
updateMaintenanceStatus(id: number, status: string): Observable<Maintenance>
uploadMaintenancePhoto(maintenanceId: number, file: File): Observable<{ photoUrl: string }>
```

| **Add photo preview** | Islam | Show uploaded photos before submit |
| **Add loading state** | Islam | Show spinner during upload |
| **Add success message** | Islam | "Maintenance request submitted!" via MatSnackBar |

**Milestone:** Tenant can submit maintenance requests

---

### SATURDAY: Frontend - Maintenance Status Tracking

| Task | Owner | Details |
|------|-------|-------|
| **Create Maintenance List component (Landlord)** | Islam | `client/src/app/landlord/maintenance-list/maintenance-list.component.ts`

Display table:
- Request title
- Tenant name
- Status (PENDING | IN_PROGRESS | RESOLVED)
- Submitted date
- Action: "Update Status" button

| **Create Maintenance Detail component** | Islam | `client/src/app/landlord/maintenance-detail/maintenance-detail.component.ts`

Display:
- Full maintenance info
- All photos (gallery view)
- Status update dropdown
- Update button

| **Create Status Update component** | Islam | `client/src/app/landlord/maintenance-status/maintenance-status.component.ts`

- Dropdown: PENDING → IN_PROGRESS → RESOLVED
- Update button
- Confirmation message

| **Create Maintenance List for Tenant** | Islam | `client/src/app/tenant/maintenance-list/maintenance-list.component.ts`

Display:
- Submitted requests
- Current status
- Photos
- (Read-only for tenant)

| **Add Material components** | Islam | 

- `MatTable` for maintenance list
- `MatSelect` for status dropdown
- `MatGallery` (or custom) for photo display
- `MatIcon` for status indicators (pending/active/resolved)

**Milestone:** Full maintenance tracking UI working

---

### SUNDAY: Integration + Testing + Deployment

| Task | Owner | Details |
|------|-------|-------|
| **Full end-to-end test** | All | 

1. Tenant create maintenance request
2. Upload 2-3 photos
3. Verify in S3 bucket
4. Landlord view maintenance + update status
5. Tenant see status update in real-time

| **Test Stripe payment flow** | All | 

1. Tenant click "Pay Rent"
2. Enter test card: `4242 4242 4242 4242`
3. Payment succeeds
4. Verify Payment record created in DB
5. Status = COMPLETED

| **Fix any bugs** | All | Test all edge cases |
| **Update Railway deployment** | Khawa | 

```bash
git add .
git commit -m "Week 4: Maintenance + Stripe Frontend"
git push origin main
```

Railway auto-deploys

| **Test on Railway** | All | 

- Test maintenance request on live app
- Test Stripe payment on live app (use test card)

| **Create progress video** | All | Record 3-4 min demo:

1. Tenant submit maintenance request with photos
2. Landlord view + update status
3. Tenant pay rent via Stripe
4. Payment succeeds

| **Update documentation** | Amsyar | Add to README:
- How to test Stripe locally
- Maintenance request workflow
- Payment flow

**Milestone:** Week 4 complete, live on Railway

---

## WEEK 4 DELIVERABLES (By Sunday Night)

| Deliverable | Status |
|-----------|--------|
| Maintenance request API (backend) | Done |
| Maintenance photo upload to S3 | Done |
| Maintenance form + list (frontend) | Done |
| Stripe payment form (frontend) | Done |
| Stripe payment confirmation (backend) | Done |
| Payment history tracking | Done (basic, enhanced in Week 5) |
| Full testing on Railway | Done |
| All code deployed | Done |

---

## NOTES FOR DEVELOPERS

- **Khawa**: Test Stripe webhooks thoroughly. Ensure idempotency for duplicate events.
- **Islam**: Make maintenance UI mobile-friendly. Photo gallery should be responsive.
- **Amsyar**: Coordinate S3 bucket access. Verify CORS for photo uploads.
- **Testing**: Use Stripe test mode exclusively. Never test with real cards.
- **Git**: Commit daily. Keep branches organized.

---

## PROGRESS UPDATE

✅ Week 1: Auth complete  
✅ Week 2: Properties + S3  
✅ Week 3: Tenancy + Stripe backend + Deployed  
✅ Week 4: Maintenance + Stripe frontend  

**Next: Week 5 - Manual Payments + Payment History** 💳📊
