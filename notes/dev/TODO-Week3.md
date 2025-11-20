# WEEK 3: TENANCY + STRIPE BACKEND + DEPLOYMENT
**Goal:** Complete MVP with Tenancy management + Stripe backend setup → Deploy to Railway  
**Duration:** 7 days (Mon–Sun)  
**Team:** 3 Developers  
**Deliverable by Sunday:**  
> Landlords can **assign tenants to properties** (create tenancy)  
> Stripe backend API ready (PaymentIntent + webhook)  
> App deployed live on Railway with HTTPS  
> **FIRST MVP RELEASE** ✅

---

## TEAM ROLES (Week 3)

| Dev | Focus |
|-----|-------|
| **Khawa (Backend)** | Tenancy API, Stripe backend (PaymentIntent + webhook), Railway deployment |
| **Amsyar (Full-Stack)** | Stripe webhook testing (ngrok), tenancy service helpers, deployment support |
| **Islam (Frontend)** | Tenancy assignment UI (landlord), tenant current lease display, prepare payment UI skeleton |

---

## DAILY TODO LIST (Monday → Sunday)

---

### MONDAY: Tenancy API (Backend)

| Task | Owner | Details |
|------|-------|-------|
| **Review Tenancy schema** | Khawa | Verify Prisma model includes: propertyId, tenantId, landlordId, leaseStart, leaseEnd, monthlyRent |
| **Create Tenancy service** | Khawa | `server/src/services/tenancy.service.ts`

```ts
async createTenancy(data: CreateTenancyDTO): Promise<Tenancy>
  // Validate: tenant exists, property exists, property is VACANT
  // Create tenancy record
  // Update property status to OCCUPIED
  // Return tenancy

async getTenancyById(id: number): Promise<Tenancy>
async getTenanciesByLandlord(landlordId: number): Promise<Tenancy[]>
async getTenanciesByTenant(tenantId: number): Promise<Tenancy[]>
async updateTenancy(id: number, data: UpdateTenancyDTO): Promise<Tenancy>
async deleteTenancy(id: number): Promise<void>
  // Delete tenancy
  // Update property status back to VACANT
```

| **Create Tenancy controller** | Khawa | `server/src/controller/tenancy.controller.ts`

```ts
POST /api/v1/tenancies → createTenancy()
GET /api/v1/tenancies/:id → getTenancyById()
GET /api/v1/tenancies?landlordId=X&tenantId=Y → filter
PUT /api/v1/tenancies/:id → updateTenancy()
DELETE /api/v1/tenancies/:id → deleteTenancy()
```

| **Create Tenancy routes** | Khawa | `server/src/router/v1/tenancy.route.ts` |
| **Add authorization** | Khawa | Only landlord can create/delete tenancies; only landlord/tenant can view theirs |
| **Test with Postman** | Khawa | Create tenancy, verify property status changes to OCCUPIED |

**Milestone:** Tenancy API fully functional

---

### TUESDAY: Stripe Backend Setup

| Task | Owner | Details |
|------|-------|-------|
| **Add Stripe SDK** | Khawa | `npm install stripe` |
| **Get Stripe test keys** | Khawa | Sign up at stripe.com → get `sk_test_...` and `pk_test_...` |
| **Add Stripe env vars** | Khawa |

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

| **Create Stripe service** | Khawa | `server/src/services/stripe.service.ts`

```ts
async createPaymentIntent(amount: number, currency: string, metadata?: object): Promise<{ clientSecret: string }>
async verifyWebhookSignature(body: string, signature: string): Promise<object>
```

| **Create Payment model migration** | Khawa | Run Prisma migration:

```bash
npx prisma migrate dev --name add_payments
```

Verify Payment schema:
- id, tenancyId, tenantId, amount, currency
- method (STRIPE | MANUAL)
- status (PENDING | COMPLETED | FAILED)
- stripePaymentId, paidAt, createdAt

| **Test Stripe keys** | Khawa | Simple test:

```ts
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paymentIntent = await stripe.paymentIntents.create({ amount: 5000, currency: 'usd' });
console.log(paymentIntent);
```

**Milestone:** Stripe SDK integrated, test keys configured

---

### WEDNESDAY: Stripe API Endpoints

| Task | Owner | Details |
|------|-------|-------|
| **Create Payment controller** | Khawa | `server/src/controller/payment.controller.ts`

```ts
POST /api/v1/payments/create-intent
  - Body: { tenancyId, amount, currency }
  - Return: { clientSecret, paymentIntentId }

POST /api/v1/webhooks/stripe
  - Verify signature
  - Handle: payment_intent.succeeded, payment_intent.failed
  - Update Payment record in DB
  - Return: { received: true }

GET /api/v1/payments/tenant/:tenantId
  - Return: all payments for tenant

GET /api/v1/payments/property/:propertyId
  - Return: all payments for property (for landlord)
```

| **Create Payment service** | Khawa | `server/src/services/payment.service.ts`

```ts
async createPaymentRecord(tenancyId, amount, method): Promise<Payment>
async updatePaymentStatus(paymentId, status, stripePaymentId?): Promise<Payment>
async getPaymentsByTenant(tenantId): Promise<Payment[]>
async getPaymentsByProperty(propertyId): Promise<Payment[]>
```

| **Create Payment routes** | Khawa | `server/src/router/v1/payment.route.ts` |
| **Setup webhook endpoint** | Khawa | 

- Create `/api/v1/webhooks/stripe` (NO auth required)
- Verify Stripe signature
- Parse event type
- Update DB accordingly

| **Test endpoints with Postman** | Khawa | 

- Test create-intent → returns clientSecret
- Use `stripe-cli` to simulate webhook

**Milestone:** All payment endpoints ready for frontend integration

---

### THURSDAY: Frontend - Tenancy Assignment (Landlord)

| Task | Owner | Details |
|------|-------|-------|
| **Create Tenancy model** | Islam | `client/src/app/models/tenancy.model.ts`

```ts
export interface Tenancy {
  id: number;
  propertyId: number;
  tenantId: number;
  landlordId: number;
  leaseStart: Date;
  leaseEnd: Date;
  monthlyRent: number;
  createdAt: Date;
  property?: Property;
  tenant?: User;
}
```

| **Create TenancyService** | Islam | `client/src/app/services/tenancy.service.ts`

```ts
createTenancy(data: CreateTenancyDTO): Observable<Tenancy>
getTenanciesByLandlord(landlordId: number): Observable<Tenancy[]>
getTenancyById(id: number): Observable<Tenancy>
updateTenancy(id: number, data): Observable<Tenancy>
deleteTenancy(id: number): Observable<void>
```

| **Create Assign Tenant component** | Islam | `client/src/app/landlord/assign-tenant/assign-tenant.component.ts`

- Landlord selects property (dropdown)
- Landlord enters tenant email
- Landlord sets leaseStart & leaseEnd (Material DatePicker)
- Landlord confirms monthly rent
- Submit → create tenancy

| **Add Material DatePicker** | Islam | `npm install @angular/material` (already done, use MatDatepickerModule) |
| **Add form validation** | Islam | 

- Tenant email must exist in system
- leaseEnd > leaseStart
- monthlyRent > 0

| **Test locally** | Islam | Create tenancy flow end-to-end |

**Milestone:** Landlord can assign tenants to properties

---

### FRIDAY: Frontend - Tenant Dashboard

| Task | Owner | Details |
|------|-------|-------|
| **Create Tenant Dashboard component** | Islam | `client/src/app/tenant/tenant-dashboard/tenant-dashboard.component.ts`

Display:
- Current lease info (if assigned)
  - Property name, address, landlord name
  - leaseStart, leaseEnd, monthlyRent
- Available actions:
  - "Pay Rent" (button → payment flow, not yet implemented)
  - "Request Maintenance" (button → to be implemented week 4)
- Available vacant properties (link to browse)

| **Create Current Lease component** | Islam | `client/src/app/tenant/current-lease/current-lease.component.ts`

- Display active tenancy info
- Show next payment due date (calculated from leaseStart)
- Show payment history (empty for now, week 5)

| **Add routing guards** | Islam | 

- Tenant dashboard only accessible if user.role === 'TENANT'
- Landlord dashboard only accessible if user.role === 'LANDLORD'
- Redirect unauthorized users to login

| **Test navigation** | Islam | 

- Tenant login → dashboard
- Landlord login → different dashboard
- Verify role-based routing works

**Milestone:** Separate tenant & landlord dashboards working

---

### SATURDAY: Stripe Frontend Skeleton + Payment UI Preview

| Task | Owner | Details |
|------|-------|-------|
| **Add Stripe.js to Angular** | Islam | `npm install @stripe/stripe-js` |
| **Create Payment model** | Islam | `client/src/app/models/payment.model.ts`

```ts
export interface Payment {
  id: number;
  tenancyId: number;
  amount: number;
  currency: string;
  method: 'STRIPE' | 'MANUAL';
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  stripePaymentId?: string;
  paidAt?: Date;
  createdAt: Date;
}
```

| **Create PaymentService** | Islam | `client/src/app/services/payment.service.ts`

```ts
createPaymentIntent(tenancyId: number, amount: number): Observable<{ clientSecret: string }>
getPaymentsByTenant(tenantId: number): Observable<Payment[]>
getPaymentsByProperty(propertyId: number): Observable<Payment[]>
```

| **Create Payment form skeleton** | Islam | `client/src/app/tenant/payment/payment.component.ts` (not fully implemented)

- Form fields: amount, currency (dropdown)
- Button: "Pay with Card" (disabled for now)
- Button: "Upload Receipt" (disabled for now)
- Add comments: "To be implemented Week 4"

| **Prepare Stripe Elements setup** | Islam | Add Stripe context (comment code, don't execute yet) |

**Milestone:** Payment UI structure ready for Week 4

---

### SUNDAY: Railway Deployment + Final Testing

| Task | Owner | Details |
|------|-------|-------|
| **Prepare Railway account** | Amsyar | 

- Create Railway account (railway.app)
- Create new project
- Link GitHub repo

| **Setup Railway database** | Amsyar | 

- Add MariaDB plugin to Railway
- Get `DATABASE_URL` from Railway
- Update `.env` on Railway

| **Setup Railway environment** | Khawa | 

- Add to Railway env:
  - `DATABASE_URL` (from MariaDB service)
  - `JWT_SECRET`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `AWS_ACCESS_KEY_ID`, etc.

| **Update Docker image** | Khawa | Ensure `Dockerfile` builds correctly:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
# ... (rest of multi-stage build)
```

| **Test backend on Railway** | Khawa | 

```bash
curl https://your-railway-app.up.railway.app/api/v1/auth/...
```

Verify: auth endpoints respond

| **Deploy frontend to Railway (static)** | Islam | 

- Build Angular: `ng build --prod --base-href=/`
- Deploy static site or containerize client as well
- Update Angular environment with Railway backend URL

| **Setup Stripe webhook** | Amsyar | 

- In Stripe dashboard, add webhook endpoint:
  - URL: `https://your-railway-app.up.railway.app/api/v1/webhooks/stripe`
  - Events: `payment_intent.succeeded`, `payment_intent.failed`

| **Full end-to-end test on Railway** | All | 

1. Access deployed app in browser
2. Landlord login → create property → upload image
3. Tenant login → browse properties
4. Landlord assign tenant → create tenancy
5. Tenant view lease info
6. Verify all data persisted in Railway DB

| **Fix deployment bugs** | All | Debug any CORS, routing, or connection issues |
| **Create demo video** | All | Record 2-3 min demo:

1. Landlord workflow (property → tenancy)
2. Tenant workflow (browse → view lease)
3. Show live on Railway

| **Commit & push final code** | All | 

```bash
git add .
git commit -m "Week 3: MVP Complete - Tenancy + Stripe Backend + Deployed to Railway"
git push origin main (or develop → merge to main)
```

| **Document deployment** | Amsyar | 

- Add `DEPLOYMENT.md` with:
  - Railway setup steps
  - Environment variables needed
  - How to run locally vs. production

**Milestone:** **MVP LIVE ON PRODUCTION** 🚀

---

## WEEK 3 DELIVERABLES (By Sunday Night)

| Deliverable | Status |
|-----------|--------|
| Tenancy CRUD API (all endpoints) | Done |
| Tenancy assignment UI (landlord) | Done |
| Tenant dashboard with current lease | Done |
| Stripe backend (PaymentIntent + webhook) | Done |
| Payment model & routes (backend) | Done |
| Role-based routing (separate dashboards) | Done |
| Deployed to Railway with HTTPS | Done ✅ |
| Demo video (2-3 min) | Done |
| All code in main branch | Done |

---

## NOTES FOR DEVELOPERS

- **Khawa**: Double-check Stripe webhook signature verification. Test locally with `stripe-cli` before deploying.
- **Islam**: Ensure routing guards prevent unauthorized access. Test both roles thoroughly.
- **Amsyar**: Verify Railway deployment logs. If issues, use Railway CLI to debug.
- **Security**: Never commit secrets to Git. Use Railway env vars only.
- **Testing**: Test tenancy cascade (delete property → what happens to tenancies?).

---

## KEY MILESTONE: MVP COMPLETE ✅

**By end of Week 3, your app will be:**
- ✅ Live on HTTPS (Railway)
- ✅ User authentication (email PIN)
- ✅ Property management (landlord)
- ✅ Property browsing (tenant)
- ✅ Tenancy assignment
- ✅ Stripe backend ready (frontend comes Week 4)
- ✅ All APIs deployed

**Ready for Week 4: Payment Features** 💳
