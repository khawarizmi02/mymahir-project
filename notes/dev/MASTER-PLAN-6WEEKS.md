# 6-WEEK MVP IMPLEMENTATION PLAN
## House Rental Management System
**Target Launch:** December 31, 2025  
**Team:** 3 Developers  
**Status:** Ready to Execute

---

## 📋 OVERVIEW

This is your complete 6-week roadmap from current state (Week 1 complete) through full MVP launch. Each week has been tailored to your team structure:

- **Khawa**: Backend (FullStack Ops)
- **Amsyar**: Full-Stack (40% backend, 60% frontend)
- **Islam**: Frontend (FullStack)

---

## 🎯 MVP SCOPE

### ✅ INCLUDED (MVP Weeks 1-3)
1. **Email PIN Authentication** (passwordless)
2. **Property Management** (landlord CRUD + S3 images)
3. **Property Browsing** (tenant views vacant properties)
4. **Tenancy Assignment** (landlord assigns tenant to property)
5. **Stripe Backend** (PaymentIntent + webhook)
6. **Deployment to Railway** (HTTPS live)

### ✅ PHASE 2: Payment & Maintenance (Weeks 4-5)
1. **Stripe Payments** (tenant pays rent via card)
2. **Manual Receipts** (tenant uploads receipt, landlord approves)
3. **Payment History** (comprehensive table with all transactions)
4. **Maintenance Requests** (tenant submits with photos, landlord tracks status)

### ✅ PHASE 3: Polish & Launch (Week 6)
1. **Edge Case Handling** (all error scenarios covered)
2. **Performance Optimization** (fast load times)
3. **Accessibility & Security** (WCAG AA compliant, HTTPS, JWT)
4. **Documentation & Demo** (ready for client/launch)

### ❌ NOT INCLUDED (Post-MVP)
- Google OAuth (email PIN only)
- Chat system + Telegram sync (future feature)
- Email reminders/cron jobs (future feature)
- Admin panel
- Reports & charts

---

## 📅 WEEK-BY-WEEK BREAKDOWN

### **WEEK 1: Auth Foundation** ✅ (Already planned)
- Email PIN login (request → receive → verify)
- Docker setup + CI/CD pipeline
- **Milestone:** Full auth working locally

**Files:** `TODO-Week1.md` (already exists)

---

### **WEEK 2: Properties + S3 Upload**
**Goal:** Property CRUD + image upload + tenant browsing  
**Team:**
- Khawa: Property API, S3 service, database migrations
- Islam: Property components (list, form, detail)
- Amsyar: S3 bucket setup, frontend support

**Key Deliverables:**
- ✅ Property CRUD API (backend)
- ✅ S3 image upload (multipart form-data)
- ✅ Landlord property management UI
- ✅ Tenant property browsing UI
- ✅ Full local integration

**Files:** `TODO-Week2.md` (created)

---

### **WEEK 3: Tenancy + Stripe Backend + Deployment** ⭐ MVP COMPLETE
**Goal:** Tenancy management + Stripe setup + live on Railway  
**Team:**
- Khawa: Tenancy API, Stripe backend, Railway deployment
- Islam: Tenancy UI (landlord assignment), tenant dashboard
- Amsyar: Stripe webhook testing, deployment infrastructure

**Key Deliverables:**
- ✅ Tenancy CRUD API (backend)
- ✅ Tenancy assignment UI (landlord)
- ✅ Tenant current lease display
- ✅ Stripe PaymentIntent + webhook (backend only)
- ✅ Role-based dashboards (separate landlord/tenant views)
- ✅ **FIRST PRODUCTION DEPLOYMENT** (Railway + HTTPS)

**🎯 MVP MILESTONE: By end of Week 3, core product is live!**

**Files:** `TODO-Week3.md` (created)

---

### **WEEK 4: Maintenance + Stripe Frontend**
**Goal:** Maintenance system complete + Stripe payment UI  
**Team:**
- Khawa: Maintenance API, Stripe payment confirmation
- Islam: Maintenance form, Stripe payment form, status tracking UI
- Amsyar: S3 reuse for photos, Stripe integration support

**Key Deliverables:**
- ✅ Maintenance request API (backend)
- ✅ Maintenance photo upload to S3
- ✅ Maintenance form + list (frontend)
- ✅ Landlord maintenance status update UI
- ✅ Stripe payment form (frontend with Stripe.js)
- ✅ Stripe payment confirmation (backend webhook)
- ✅ Live deployment to Railway

**Files:** `TODO-Week4.md` (created)

---

### **WEEK 5: Manual Payments + Payment History + Polish**
**Goal:** Complete payment features + UI polish + mobile responsiveness  
**Team:**
- Khawa: Manual payment API, payment approval logic
- Islam: Manual receipt form, payment approval UI, payment history table
- Amsyar: Receipt S3 upload, payment dashboard

**Key Deliverables:**
- ✅ Manual payment receipt upload (backend)
- ✅ Payment approval/rejection (landlord)
- ✅ Comprehensive payment history table (all transactions)
- ✅ Manual payment form (tenant)
- ✅ Landlord payment approval UI
- ✅ Mobile responsiveness (all pages)
- ✅ Loading states & error handling
- ✅ Live deployment to Railway

**Files:** `TODO-Week5.md` (created)

---

### **WEEK 6: Final Polish + Edge Cases + Demo**
**Goal:** Production-ready, bug-free, fully documented  
**Team:**
- Khawa: API stability, edge cases, final deployment
- Islam: UI polish, accessibility, demo video
- Amsyar: Infrastructure stability, performance, documentation

**Key Deliverables:**
- ✅ Edge case handling (all error scenarios)
- ✅ Performance optimization (fast loading)
- ✅ Accessibility audit (WCAG AA compliance)
- ✅ Security verification (HTTPS, rate limiting, JWT)
- ✅ Zero critical bugs
- ✅ Complete documentation (README, API docs, user guide)
- ✅ Demo video (8-10 min showing all features)
- ✅ Release notes v1.0
- ✅ **FINAL PRODUCTION DEPLOYMENT**

**Files:** `TODO-Week6.md` (created)

---

## 📊 FEATURE TIMELINE

```
Week 1: Auth (Request PIN → Verify → Login)
├── Mon-Tue: Setup + DB
├── Wed-Thu: Auth API
├── Fri-Sat: Auth UI
└── Sun: Docker + CI/CD

Week 2: Properties (Create → Upload → Browse)
├── Mon-Tue: S3 setup
├── Wed-Thu: Property API
├── Fri-Sat: Property UI (Landlord + Tenant)
└── Sun: Integration

Week 3: Tenancy + Stripe + Deploy ⭐ MVP
├── Mon-Tue: Tenancy API
├── Wed-Thu: Stripe backend
├── Fri-Sat: Tenancy UI + Dashboards
└── Sun: Deploy to Railway

Week 4: Maintenance + Stripe Frontend
├── Mon-Tue: Maintenance API
├── Wed-Thu: Maintenance Photos + Stripe UI
├── Fri-Sat: Maintenance components
└── Sun: Integration + Testing

Week 5: Manual Payments + Polish
├── Mon-Tue: Manual payment API
├── Wed-Thu: Manual payment UI
├── Fri-Sat: Payment history + Mobile polish
└── Sun: Testing + Deployment

Week 6: Final Polish + Launch
├── Mon-Tue: Edge cases + Performance
├── Wed-Thu: Accessibility + Bugs
├── Fri-Sat: Documentation + Demo
└── Sun: Final deployment + Release
```

---

## 🛠️ TECH STACK

| Layer | Technology |
|-------|-----------|
| **Frontend** | Angular 20 + Material + PWA |
| **Backend** | Node.js + Express + TypeScript |
| **Database** | MariaDB + Prisma ORM |
| **Authentication** | Email PIN (JWT tokens) |
| **Storage** | AWS S3 (multipart form-data upload) |
| **Payments** | Stripe (test mode) |
| **Email** | Nodemailer (PIN delivery) |
| **Deployment** | Docker + Railway |
| **CI/CD** | GitHub Actions |

---

## 👥 TEAM STRUCTURE

### Khawa - Backend Lead (100% Backend)
**Responsibilities:**
- Express server setup & architecture
- All API endpoints (auth, properties, tenancies, payments, maintenance)
- Database design & migrations (Prisma)
- Stripe backend integration
- S3 service
- Security & rate limiting
- Deployment to Railway
- API documentation

**Key Repos:** `server/` directory

### Amsyar - Full-Stack (40% Backend, 60% Frontend)
**Responsibilities:**
- S3 bucket setup & configuration
- AWS IAM credentials
- Stripe webhook testing (ngrok)
- Email service (Nodemailer)
- Supporting frontend with file upload UI
- Database optimization
- Infrastructure & deployment
- CI/CD pipeline
- Documentation

**Key Repos:** `server/services/s3.ts`, `server/services/email.ts`, DevOps tasks

### Islam - Frontend Lead (100% Frontend)
**Responsibilities:**
- Angular project setup & structure
- All UI components (pages, forms, dialogs)
- Material Design implementation
- HTTP service & interceptors
- Auth guards & routing
- Stripe.js integration
- Mobile responsiveness
- Accessibility compliance
- UI/UX polish
- Demo video & user guide

**Key Repos:** `client/` directory

---

## 🚀 DEPLOYMENT TIMELINE

| Milestone | Week | Status |
|-----------|------|--------|
| Local development complete | 1 | ✅ Ready |
| First feature (properties) deployed | 2 | 📅 Planned |
| **MVP deployed to Railway** | **3** | **⭐ Target** |
| Payment features added | 4 | 📅 Planned |
| Manual payments + polish | 5 | 📅 Planned |
| Production release v1.0 | 6 | 📅 Planned |

---

## 📝 FILE STRUCTURE

```
notes/dev/
├── TODO-Week1.md (existing)
├── TODO-Week2.md (new)
├── TODO-Week3.md (new)
├── TODO-Week4.md (new)
├── TODO-Week5.md (new)
├── TODO-Week6.md (new)
└── MASTER-PLAN.md (this file)
```

---

## ✅ HOW TO USE THIS PLAN

1. **Start each Monday** with the corresponding week's TODO file
2. **Assign tasks** to team members based on their roles
3. **Daily standup:** Review progress against daily goals
4. **Daily commits:** Push code to `develop` branch
5. **Weekly merge:** On Sunday, merge to `main` if stable
6. **Weekly sync:** Review blockers and adjust next week if needed

### Example: Monday of Week 2

```bash
# Read the plan
cat notes/dev/TODO-Week2.md

# Assign tasks:
# Khawa: S3 setup + Property API
# Islam: Property Services + Components
# Amsyar: S3 Bucket + Supporting

# Daily commits:
git add .
git commit -m "Week 2, Monday: S3 service created"
git push origin develop
```

---

## 🔄 GIT WORKFLOW

```bash
# Week branches (optional but recommended)
git checkout -b week/2

# Daily work
git commit -m "Week 2, Day X: [Task description]"

# Sunday: merge to develop/main if stable
git checkout develop
git merge week/2
git push origin develop
```

---

## ⚠️ POTENTIAL RISKS & MITIGATIONS

| Risk | Mitigation |
|------|----------|
| Stripe test card issues | Use `4242 4242 4242 4242` only; test locally with `stripe-cli` first |
| S3 CORS errors | Pre-configure bucket policy; test upload locally |
| Database migration conflicts | Use `prisma migrate dev` in dev; lock schema in version control |
| API rate limiting breaks testing | Use higher limits in dev; lower in prod |
| Deployment fails | Test Docker image locally first; use Railway CLI for debugging |
| Scope creep (chat system) | Enforce "Week 3 MVP freeze" - no new features until Week 4 |
| Team coordination issues | Daily 15-min standup; Slack for quick questions |

---

## 🎯 SUCCESS CRITERIA

By end of Week 6, your MVP must have:

- ✅ **Feature Complete:** All planned features implemented
- ✅ **No Critical Bugs:** Zero blockers for users
- ✅ **Deployed:** Live on HTTPS (Railway)
- ✅ **Documented:** README, API docs, user guide
- ✅ **Demoed:** 8-10 min video showing all features
- ✅ **Tested:** Cross-browser, mobile-responsive
- ✅ **Accessible:** WCAG AA compliant
- ✅ **Performant:** Page load < 2s, API response < 200ms

---

## 📞 SUPPORT & QUESTIONS

**During execution:**
1. Check the current week's TODO file first
2. Review PRD for clarification
3. Discuss blockers in daily standup
4. Document decisions/changes
5. Update TODO if scope changes

**Common questions:**

Q: Can we start Week 3 earlier?  
A: Not recommended - Week 1-2 foundation is critical for Week 3 stability.

Q: What if we finish early?  
A: Polish previous week's code; get ahead on next week's tasks.

Q: What if we're behind?  
A: Discuss in standup; consider deprioritizing optional features; don't rush deployment.

Q: Can we work on chat system in Week 5?  
A: Not until MVP is deployed (Week 3 end). Week 5 is for payment polish only.

---

## 🎓 LESSONS & BEST PRACTICES

1. **Commit daily** - Don't let code pile up
2. **Test locally first** - Before pushing to Railway
3. **Use feature branches** - Avoid main branch conflicts
4. **Document as you go** - Don't leave documentation for end
5. **Plan API first** - Frontend depends on stable backend APIs
6. **Test edge cases** - Don't just test the happy path
7. **Keep team in sync** - Daily communication prevents surprises
8. **Deploy frequently** - Railway deploys are fast; use them!

---

## 🏁 FINAL CHECKLIST (Week 6 End)

Before declaring MVP complete:

- [ ] All endpoints tested in Postman
- [ ] All UI pages tested in browser
- [ ] Mobile tested on real device
- [ ] No console errors in production
- [ ] No SQL errors in logs
- [ ] JWT tokens working correctly
- [ ] Stripe test payments working
- [ ] S3 uploads working
- [ ] Email PIN delivery working
- [ ] Database backups configured (Railway)
- [ ] Monitoring/logging in place
- [ ] Demo video uploaded
- [ ] Documentation complete
- [ ] Team ready for launch

---

## 🚀 YOU'RE READY TO SHIP!

This plan is **detailed, realistic, and achievable** with your 3-person team in 6 weeks. Follow each week's TODO, stay focused, and you'll have a production-ready MVP by December 31, 2025.

**Remember:** The MVP doesn't need to be perfect - it needs to work and demonstrate the core value. Polish and features come after launch.

**Good luck! 🎉**

---

**Plan Created:** November 20, 2025  
**Target Launch:** December 31, 2025  
**Team:** Khawa (Backend), Amsyar (Full-Stack), Islam (Frontend)  
**Project:** House Rental Management System MVP
