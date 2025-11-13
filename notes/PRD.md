<!-- Thank you for the **clear, detailed answers**! You've given me everything I need to craft a **focused, realistic, and presentable PRD** for your **MVP by Dec 31, 2025**, with **3 developers** and **~6 weeks**.

--- -->

# **House Rental Management System – MVP PRD**  
**Product Requirements Document**  
**Target Launch: December 31, 2025**  
**Team Size: 3 Developers** 
**Status: MVP (Minimum Viable Product)**

---

## **1. Product Vision**

> **"A simple, secure, and mobile-friendly web app that allows landlords to list rental properties, assign tenants via leases, collect rent via Stripe or manual receipt, and handle maintenance requests — all with passwordless login and real-time in-app updates."**

---

## **2. User Personas**

| Persona | Goals | Pain Points |
|-------|-------|-------------|
| **Landlord (Lisa)** | List properties, assign tenants, collect rent, approve payments, view maintenance | Manual rent tracking, late payments, no visibility |
| **Tenant (Tom)** | Find available units, pay rent easily, submit maintenance, see status | Hard to pay, no proof, slow landlord response |

> **Note**: A user **cannot** be both landlord and tenant. Must create **2 separate accounts**.

---

## **3. MVP Scope – What’s IN / OUT**

| Feature | Status | Notes |
|-------|--------|-------|
| **Email PIN Auth (Passwordless)** | IN | Only auth method in MVP |
| **Google OAuth** | OUT | Post-MVP |
| **Property CRUD (Landlord)** | IN | Title, desc, address, rent, images |
| **Browse Vacant Properties (Tenant)** | IN | **All vacant properties visible** |
| **Tenancy Creation (Landlord → Tenant)** | IN | Link tenant to property + lease dates |
| **Payment via Stripe** | IN | Real test-mode payments |
| **Manual Payment (Upload Receipt)** | IN | Tenant uploads → Landlord approves |
| **Payment History (Simple Table)** | IN | Per tenancy/property |
| **Maintenance Request Form** | IN | Text + photo upload (S3) |
| **In-App Indicators (Due Soon / Overdue)** | IN | No email |
| **Chat System (Full + Telegram Sync)** | OUT | Post-MVP |
| **Email Reminders** | OUT | Post-MVP |
| **Admin Panel** | OUT | Not needed for demo |
| **Dashboard / Charts** | OUT | Simple lists only |
| **PWA (Offline + Installable)** | IN | Low effort, high polish |
| **Docker + CI/CD Deployment** | IN | Railway / Fly.io + GitHub Actions |

---

## **4. Core User Journeys (MVP)**

### **Journey 1: Landlord Onboarding & Property Listing**
1. Sign up → Enter email → Receive PIN → Login
2. Create property (title, rent, address, 1–3 photos via S3)
3. Property appears as **Vacant**

### **Journey 2: Tenant Finds & Gets Assigned**
1. Sign up → Login via PIN
2. Browse **all vacant properties**
3. Landlord assigns tenant → Tenancy created (start/end date, rent)
4. Tenant sees: “You are renting [Property X]”

### **Journey 3: Tenant Pays Rent**
1. Tenant sees **“Pay Now”** (Stripe) or **“Upload Receipt”**
2. **Option A**: Pay via Stripe → Auto-approved
3. **Option B**: Upload bank receipt → Landlord reviews → Approves/Rejects
4. Payment status updates in real-time

### **Journey 4: Maintenance Request**
1. Tenant → “Report Issue” → Form + photo (S3)
2. Landlord sees request → Updates status: Pending → In Progress → Resolved
3. Tenant sees live status

---

## **5. MVP Features (Epics → User Stories)**

### **Epic 1: Authentication**
- As a user, I can request a 6-digit PIN via email
- As a user, I can verify PIN and log in
- As a user, I see my role (Landlord/Tenant) after login
- **AC**: PIN expires in 10 mins, max 3 attempts, rate-limited

### **Epic 2: Properties (Landlord)**
- As a landlord, I can create/edit/delete a property
- As a landlord, I can upload 1–3 images (S3 presigned URL)
- As a tenant, I can view all **vacant** properties
- **AC**: Status auto-updates on tenancy creation

### **Epic 3: Tenancies**
- As a landlord, I can assign a tenant to a property (with lease dates)
- As a tenant, I can see my current lease
- **AC**: Property becomes **Occupied** on tenancy start

### **Epic 4: Payments**
- As a tenant, I can pay rent via **Stripe (test mode)**
- As a tenant, I can upload payment receipt (image)
- As a landlord, I can **approve/reject** manual payments
- As a user, I can see **payment history table** (date, amount, status, method)
- **AC**: Stripe webhook updates DB on success

### **Epic 5: Maintenance**
- As a tenant, I can submit a request (title, desc, photo)
- As a landlord, I can update status
- As a user, I can see request history
- **AC**: Photo via S3 (reuse property upload flow)

### **Epic 6: In-App Indicators**
- Show **“Due in 3 days”**, **“Overdue”** badges
- No email, no cron

### **Epic 7: Deployment & PWA**
- App is **deployed on HTTPS** (Railway/Fly.io)
- **PWA**: Installable, works offline (cache static assets)
- **CI/CD**: GitHub push → auto-deploy

---

## **6. Non-Functional Requirements**

| Requirement | Detail |
|-----------|--------|
| **Security** | HTTPS, JWT (1h), HttpOnly cookies optional, rate-limit auth |
| **Performance** | <2s page load, lazy-load images |
| **Mobile** | Responsive (Angular Material + Flex Layout) |
| **Accessibility** | Basic ARIA, keyboard nav |
| **Testing** | 80% unit test coverage (Jest + Angular Testing) |
| **Logging** | Console + basic error tracking |

---

## **7. Tech Stack (Confirmed)**

| Layer | Tech |
|------|------|
| **Frontend** | Angular 20 + Material + PWA |
| **Backend** | Node.js + Express + TypeScript |
| **DB** | MariaDB + Prisma ORM |
| **Auth** | Email PIN (bcrypt) |
| **Storage** | AWS S3 (presigned URLs) |
| **Payments** | Stripe (test mode + webhook) |
| **Email** | Nodemailer (SMTP) – for PIN only |
| **Deploy** | Docker + Railway/Fly.io + GitHub Actions |

---

## **8. 6-Week Timeline (3 Devs)**

| Week | Focus | Owner |
|------|------|-------|
| **Week 1** | Setup + Auth | All |
| | • Init repo (frontend/backend)<br>• Prisma + MariaDB<br>• Email PIN login (request/verify)<br>• Docker base | Dev 1 (Backend), Dev 2 (Frontend), Dev 3 (Ops) |
| **Week 2** | Properties + S3 | |
| | • Property CRUD<br>• S3 presigned upload (reuse in maintenance)<br>• Browse vacant properties | Dev 1 (API), Dev 2 (UI), Dev 3 (S3) |
| **Week 3** | Tenancies + Payments (Stripe) | |
| | • Create tenancy<br>• Stripe PaymentIntent + webhook<br>• Auto-approve Stripe payments | Dev 1 (Backend), Dev 2 (Stripe.js) |
| **Week 4** | Manual Payments + Maintenance | |
| | • Upload receipt + approve/reject<br>• Maintenance form + photo<br>• Status updates | Dev 2 (UI), Dev 1 (API), Dev 3 (S3 reuse) |
| **Week 5** | Polish + In-App Indicators | |
| | • Payment history table<br>• Due/overdue badges<br>• Responsive fixes<br>• PWA setup | All |
| **Week 6** | Testing + Deploy + Demo | |
| | • E2E tests<br>• CI/CD pipeline<br>• Deploy to Railway<br>• Demo prep | All |

---

## **9. Risks & Mitigations**

| Risk | Mitigation |
|------|------------|
| Stripe webhook fails locally | Use `stripe-cli` + ngrok |
| S3 CORS issues | Pre-configure bucket policy |
| Prisma migration conflicts | Use `prisma migrate dev` in dev, lock schema |
| Deploy fails | Test Docker locally first |
| Scope creep | **No chat, no email reminders, no admin** |

---

## **10. Success Metrics (Demo Day)**

- [ ] Landlord can **list property → assign tenant → receive payment**
- [ ] Tenant can **browse → pay via Stripe → upload receipt → submit maintenance**
- [ ] App is **live on HTTPS**, installable as PWA
- [ ] **Zero critical bugs** in core flow
- [ ] Demo video < 3 mins

---

## **11. Decision Log**

| Decision | Rationale |
|--------|---------|
| **Email PIN only** | Faster, no OAuth redirect hell |
| **All vacant properties visible** | Best for tenant discovery; simple to implement |
| **No admin panel** | Not needed for demo; adds complexity |
| **Chat = Post-MVP** | Too big; maintenance form covers need |
| **Stripe in test mode** | Real flow, no PCI risk |

---

## **12. Out of Scope (Post-MVP)**

- Google OAuth
- Chat system (app + Telegram sync)
- Email reminders / cron jobs
- Reports / Charts
- Admin panel
- Multi-property tenancy
- Late fees
- Contract PDF generation

<!-- ---

## **You’re Ready to Build!**

### Next Steps:
1. **Create GitHub repo** (`rental-mvp-2025`)
2. **Split tasks** per 6-week plan
3. **Start Week 1: Setup + Auth**

---

Would you like me to generate:
- **Jira/ClickUp task board template**?
- **Figma wireframes** (low-fi)?
- **Postman collection** for API?
- **Demo script**?

Let me know — I’ll help you **ship on time**. -->