# House Rental Management System

* **Frontend:** Angular 20 + Angular Material + PWA support (mobile friendly)
* **Backend:** Node.js + Express, **TypeScript**, REST API style
* **Database:** MariaDB (MySQL-compatible) via **Prisma** ORM
* **Auth:** Google OAuth **plus** Email PIN (passwordless email-pin flow) — both supported
* **Payments:** Stripe (online payments supported) — record + real payments
* **File storage:** AWS S3 for property images
* **Email notifications:** rent reminders via SMTP or transactional provider (e.g., NodeMailer or SendGrid) <-- **Not Decided Yet**
* **Deployment:** Docker-ready, can deploy to Railway / Fly / Coolify / Netlify (front end) / DockerHub **Not Decided Yet**

Below you’ll find: modules, DB (Prisma) schema outline, auth flows (Google + email-pin), REST endpoints, Angular modules & components, S3 upload flow, Stripe flow, env variables, and deployment notes. I made reasonable security/implementation suggestions (e.g. tokens, expiries).

---

# 1 — System modules (high level)

Each module maps to backend routes, Prisma models, and Angular modules/components.

1. Auth (Google OAuth & Email PIN passwordless)
	- Instead of using password. The system will generate pin then send to user email then the user need to login with that pin.
2. Users (landlord / tenant profile)
	- Landlord can register new property to be rent.
	- Tenant can search for available property to rent or manage the current rent.
3. Properties (CRUD, images)
	- Landlord can manage property's details like image or description.
	- Tenant can only view the details of the property. (eg. Rent Price, Floor Plan, Property Owner Details, etc.)
4. Tenancies / Lease (link tenants to property, lease dates)
	- Landlord link tenant(s) with to property and the lease date
5. Payments (Stripe + payment records)
6. Maintenance Requests
	- Implemeted in chat system
	- For now, the tenant just have a simple ui button and form to make a maintenance request
7. Notifications (email reminders)
8. Dashboard / Reports 
	- not required for early implementation
	- For early implementation, just make a simple interface
9. Admin utilities (simple: manage users/properties) — not required for early implementation

---

# 2 — Database design (Prisma schema outline)

Use `provider = "mysql"` in `schema.prisma`. MariaDB is MySQL-compatible; Prisma works with MySQL provider.

Example `schema.prisma` (trimmed for clarity):

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id               Int       @id @default(autoincrement())
  email            String    @unique
  name             String?
  role             UserRole  @default(TENANT) // TENANT | LANDLORD
  googleId         String?   @unique
  emailPinHash     String?   // hashed PIN for email sign-in
  emailPinExpiry   DateTime?
  isEmailVerified  Boolean   @default(false)
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  properties       Property[]      @relation("LandlordProperties")
  payments         Payment[]
  maintenance      Maintenance[]
  tenancies        Tenancy[]
}

enum UserRole {
  LANDLORD
  TENANT
}

model Property {
  id           Int       @id @default(autoincrement())
  landlordId   Int
  title        String
  description  String?
  address      String
  monthlyRent  Float
  status       PropertyStatus @default(VACANT)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  landlord     User      @relation("LandlordProperties", fields: [landlordId], references: [id])
  images       PropertyImage[]
  tenancies    Tenancy[]
  maintenance  Maintenance[]
}

enum PropertyStatus {
  VACANT
  OCCUPIED
}

model PropertyImage {
  id         Int     @id @default(autoincrement())
  propertyId Int
  url        String
  createdAt  DateTime @default(now())

  property   Property @relation(fields: [propertyId], references: [id])
}

model Tenancy {
  id          Int      @id @default(autoincrement())
  propertyId  Int
  tenantId    Int
  landlordId  Int
  leaseStart  DateTime
  leaseEnd    DateTime
  monthlyRent Float
  createdAt   DateTime @default(now())

  property    Property @relation(fields: [propertyId], references: [id])
  tenant      User     @relation(fields: [tenantId], references: [id])
  landlord    User     @relation(fields: [landlordId], references: [id])
  payments    Payment[]
}

model Payment {
  id           Int      @id @default(autoincrement())
  tenancyId    Int?
  propertyId   Int?
  tenantId     Int
  amount       Float
  currency     String   @default("USD")
  method       PaymentMethod
  status       PaymentStatus @default(PENDING)
  stripePaymentId String?      // if paid via Stripe
  proofUrl     String?    // optional uploaded receipt
  paidAt       DateTime?
  createdAt    DateTime   @default(now())

  tenant        User?
  tenancy       Tenancy?  @relation(fields: [tenancyId], references: [id])
}

enum PaymentMethod {
  STRIPE
  MANUAL
  BANK_TRANSFER
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
}

model Maintenance {
  id          Int     @id @default(autoincrement())
  propertyId  Int
  tenantId    Int
  title       String
  description String?
  status      MaintenanceStatus @default(PENDING)
  photos      String[]  // array of S3 URLs
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  property    Property @relation(fields: [propertyId], references: [id])
  tenant      User     @relation(fields: [tenantId], references: [id])
}

enum MaintenanceStatus {
  PENDING
  IN_PROGRESS
  RESOLVED
}
```

Notes:

* Prisma maps MySQL `decimal`/`float` to `Float` — for money, you might use `Decimal` with the Prisma `Decimal` type (requires `provider = "mysql"` and Prisma decimal handling). For a uni project, Float is okay but consider `Decimal` for production.
* `emailPinHash` stores a hashed PIN; `emailPinExpiry` for expiry time.
* `stripePaymentId` stores Stripe's charge/intent id.

---

# 3 — Auth design: Google OAuth + Email PIN (passwordless)

## Overview

* Two sign-in methods:

  1. **Google Sign-In** (OAuth2) → server verifies token, create/find user by `googleId` / email.
  2. **Email PIN (passwordless)** → user enters email; server creates one-time 6-digit PIN, hashes & stores `emailPinHash` with expiry; send PIN via email; user enters PIN → server verifies, issues JWT.

## Flow details

### 3.1 Google OAuth flow (recommended client-side quick flow)

* Frontend uses Google Identity Services JS to get an ID token.
* Frontend sends ID token to backend endpoint `POST /api/auth/google`.
* Backend verifies ID token with Google (using `google-auth-library`) and extracts `sub` (googleId) and email.
* If user exists → update name / login; else create new user with `googleId` and email.
* Issue JWT (access token; refresh token optional).
* Return user profile + token to frontend.

### 3.2 Email PIN flow (passwordless)

* Endpoint: `POST /api/auth/pin/request` with body `{ email }`

  * Generate 6-digit numeric PIN (e.g., `Math.floor(100000 + Math.random()*900000)`) or cryptographically secure random.
  * Hash the PIN with bcrypt (or argon2) and store `emailPinHash` and `emailPinExpiry = now + 10 minutes`.
  * Send email with the PIN (via SendGrid / Nodemailer SMTP).
  * Respond: `{ ok: true }` (never return the PIN in response).
* Endpoint: `POST /api/auth/pin/verify` with `{ email, pin }`

  * Look up user by email; if not exists, optionally create user record with `isEmailVerified=true`.
  * Compare provided PIN to hashed PIN using bcrypt.
  * If valid and not expired → clear PIN fields, mark `isEmailVerified=true`, issue JWT.
  * If invalid → 401.

**Security suggestions**

* Limit PIN attempts and rate-limit `request` endpoints (use express-rate-limit).
* Store hashed PIN, not plaintext.
* Short expiry (5–15 mins).
* Revoke old PINs on new request.
* Use HTTPS everywhere.
* JWT signed with strong secret; store refresh tokens in DB if you plan long sessions.

---

# 4 — REST API design (major endpoints)

Base path: `/api/v1`

Auth middleware expected: validate JWT, add `req.user`.

### Auth

* `POST /api/v1/auth/google`  — body `{ idToken }` → verify, return JWT + user
* `POST /api/v1/auth/pin/request` — body `{ email }` → send pin
* `POST /api/v1/auth/pin/verify` — body `{ email, pin }` → verify and return JWT
* `POST /api/v1/auth/logout` — optional, invalidates refresh token

### Users

* `GET /api/v1/users/me`
* `PUT /api/v1/users/me` — update profile, phone, etc.

### Properties (landlord only for create/update/delete)

* `GET /api/v1/properties` — list with filters (status, landlordId)
* `GET /api/v1/properties/:id` — details
* `POST /api/v1/properties` — create (landlord)
* `PUT /api/v1/properties/:id`
* `DELETE /api/v1/properties/:id`
* `POST /api/v1/properties/:id/images` — upload image (S3 presigned)

### Tenancy / Lease

* `POST /api/v1/tenancies` — create lease (landlord)
* `GET /api/v1/tenancies/:id`
* `GET /api/v1/tenancies?landlordId=...&tenantId=...`

### Payments

* `POST /api/v1/payments/stripe-intent` — create Stripe PaymentIntent (return client_secret) (tenant client calls to start payment)
* `POST /api/v1/payments/confirm` — webhook or manual: mark payment completed (server verifies Stripe webhook)
* `GET /api/v1/payments/tenants/:tenantId`
* `POST /api/v1/payments/manual` — landlord/manual bank transfer proof upload

### Maintenance

* `POST /api/v1/maintenance` — create request (tenant)
* `GET /api/v1/maintenance?propertyId=...`
* `PUT /api/v1/maintenance/:id` — update status (landlord)

### Notifications / Reminders

* `POST /api/v1/notifications/rent-reminder` — (internal / cron) send reminder emails

---

# 5 — Angular 20 frontend structure (Material + PWA)

Use Angular Material, Angular PWA (`ng add @angular/pwa`), and responsive layout (Angular Flex Layout or CSS grid).

Suggested modules & components:

* `auth/` module

  * `login.component` — Google Sign-In button + Email PIN form
  * `pin-request.component` — request PIN input
* `shared/` module

  * `auth.service.ts`, `api.service.ts`, `s3.service.ts`, interceptors (add JWT), guards
* `landlord/` module

  * `property-list.component` (material table / cards)
  * `property-form.component` (create/edit)
  * `property-detail.component`
  * `tenancy-management.component`
* `tenant/` module

  * `dashboard.component` (rent due, next payment)
  * `maintenance-form.component`
  * `payment.component` (Stripe integration via Stripe.js)
* `dashboard/` module

  * `charts.component` (ngx-charts or Chart.js wrapper)
* `shared/components/` global header, mobile nav (sidenav), notification badge

Key Angular services:

* `AuthService` — login flows, store JWT in secure storage (prefer HttpOnly cookie via backend for highest security, but for uni project localStorage with short expiry is acceptable)
* `ApiService` — central HTTP wrapper
* `S3Service` — get presigned URL from backend and upload directly to S3 from Angular
* `StripeService` — call backend for payment intent and use Stripe.js to confirm

Angular Material components to use:

* `MatToolbar`, `MatSidenav`, `MatCard`, `MatTable`, `MatFormField`, `MatInput`, `MatButton`, `MatSnackBar`, `MatDialog`, `MatIcon`, etc.

PWA & mobile:

* Add `manifest.webmanifest` and service worker (`ng add @angular/pwa`).
* Ensure responsive layouts and touch-friendly buttons.

---

# 6 — AWS S3 image upload flow (recommended)

1. Frontend requests a presigned upload URL from backend:

   * `GET /api/v1/properties/:id/images/presign?filename=photo.jpg&contentType=image/jpeg`
2. Backend (server) uses AWS SDK to create presigned PUT URL for S3 with short expiry and returns it.
3. Frontend uploads file directly to S3 using the presigned URL (PUT).
4. Frontend then calls `POST /api/v1/properties/:id/images` with `{ url: uploadedUrl }` to store the image URL in DB.

Server-side node example (TypeScript, AWS v3):

* Use `@aws-sdk/s3-request-presigner` + `S3Client` to sign.

Security:

* Presigned URLs have short expiry.
* Validate file size/type on backend and/or S3 bucket policy.

---

# 7 — Stripe integration (rent payments)

* Backend creates PaymentIntent: `POST /api/v1/payments/stripe-intent` with `{ amount, currency, tenancyId }` → create PaymentIntent with Stripe server SDK, return `client_secret` to client.
* Frontend uses Stripe.js to confirm card payment using collected card details.
* On successful payment, Stripe will send a webhook (configure `/api/v1/webhooks/stripe`) to your backend → verify event signature → update `payments` record with `status=COMPLETED`, set `stripePaymentId` and `paidAt`.
* Support saving `last4` card for receipts (if desired) — be mindful of PCI scope; using client-side Stripe Elements keeps your server out of card data.

Testing:

* Use Stripe test keys and webhooks via `stripe-cli` during local dev.

---

# 8 — Email service (PIN + rent reminders)

* Suggested providers: SMTP via Nodemailer.
* Use `POST /api/v1/auth/pin/request` to send PIN email.
* For rent reminders: schedule a cron job (e.g., `node-cron`) to send reminders 3 days before rent due date.
* Email content: simple templated HTML (tenant name, amount, due date, link to pay).

Example libs:

* `nodemailer` for SMTP.

---

# 9 — Security & best practices (brief)

* Use HTTPS.
* Store JWT secret securely (env).
* Use refresh tokens stored in DB as httpOnly cookie for longer sessions (optional).
* Rate-limit auth endpoints.
* Validate uploads and sanitize inputs.
* Use CORS config to limit origins.
* Use helmet, express-rate-limit, validation (e.g., `zod` or `class-validator`) on DTOs.
* For Prisma migrations, keep `prisma/schema.prisma` in repo and use `prisma migrate dev` for dev.

---

# 10 — Example environment variables

```
# Database
DATABASE_URL="mysql://user:pass@host:3306/dbname"

# Prisma / Node
PORT=4000
JWT_SECRET=super_secret_jwt_key
JWT_EXPIRES_IN=3600

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_OAUTH_REDIRECT_URI=...

# AWS
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-southeast-1
AWS_S3_BUCKET=your-bucket-name

# Stripe
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...

# Email (SendGrid example)
SENDGRID_API_KEY=...
EMAIL_FROM=no-reply@yourdomain.com
```

---

# 11 — Dev & Deployment notes (Railway / Docker / Netlify / Coolify)

* Backend: containerize with Dockerfile (Node + TypeScript build). Push image to DockerHub and deploy to Railway / Coolify or run on VPS.
* Frontend: build Angular for production (`ng build --prod`) and deploy on Netlify, Vercel, or serve via static hosting. If using PWA and service-worker, ensure correct base href.
* Prisma with MariaDB: on deployment use managed MariaDB (Railway or PlanetScale? PlanetScale has limitations with `migrate` because of branching—use recommended workflow). For Railway, create a MariaDB service and set `DATABASE_URL`.
* Docker Compose example (backend + prisma studio + database) for local development.
* For Stripe webhooks, ensure public accessible URL (use ngrok locally or configure webhook in hosting panel).

Dockerfile (backend, TypeScript example — concise):

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm ci --only=production
CMD ["node", "dist/server.js"]
```

---

# 12 — Quick implementation checklist (milestones)

1. Init repo: `backend/` (TS + Express) and `frontend/` (Angular 20).
2. Setup Prisma + MariaDB; design schema; `prisma migrate dev` and generate client.
3. Implement auth endpoints (PIN request/verify and Google endpoint).
4. Implement S3 presign endpoint and Angular upload code.
5. Implement property CRUD and tenancy models.
6. Stripe integration and webhook handler.
7. Email sending (Nodemailer).
8. Angular UI with Material + routing + guards.
9. Add PWA support and responsive layout.
10. Dockerize and deploy.

---

## Wishlist (Features)
- Enable user(tenant and landlor) to link their social media(telegram) chat with the app.
	User(tenant) can communicate with the landlord to make special request (eg. payment, req maintenance, submit payment reciept).

[Chat history with GROK for this feature](chat-Grok-wishlist-chat-system.md)