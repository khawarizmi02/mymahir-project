# QUICK REFERENCE GUIDE
## House Rental Management System - 6-Week Sprint

---

## 📍 CURRENT STATUS
- **Current Week:** 1 (Auth complete)
- **Target Launch:** December 31, 2025
- **Weeks Remaining:** 5
- **MVP Deadline:** End of Week 3

---

## 📋 QUICK WEEK OVERVIEW

| Week | Focus | MVP? | Deployed? |
|------|-------|------|-----------|
| 1 | Auth (Email PIN) | ❌ | Local |
| 2 | Properties + S3 | ❌ | Local |
| 3 | Tenancy + Stripe (BE) + Deploy | ⭐ **YES** | Railway |
| 4 | Maintenance + Stripe (FE) | ✅ | Railway |
| 5 | Manual Payments + Polish | ✅ | Railway |
| 6 | Edge cases + Demo + Release | ✅ | Railway |

---

## 👥 TEAM ASSIGNMENTS

### Khawa (Backend Lead)
- **Week 2:** Property API, S3 service, migrations
- **Week 3:** Tenancy API, Stripe backend, deployment
- **Week 4:** Maintenance API, payment confirmation
- **Week 5:** Manual payment API, approval logic
- **Week 6:** Edge cases, API stability, final deployment

### Islam (Frontend Lead)
- **Week 2:** Property components, services, Material UI
- **Week 3:** Tenancy assignment UI, dashboards, routing
- **Week 4:** Maintenance forms, Stripe payment UI
- **Week 5:** Manual payment form, history table, polish
- **Week 6:** Accessibility, edge cases, demo prep

### Amsyar (Full-Stack)
- **Week 2:** S3 bucket setup, frontend support
- **Week 3:** Stripe webhook testing, deployment prep
- **Week 4:** S3 reuse for photos, Stripe integration
- **Week 5:** Receipt uploads, performance tuning
- **Week 6:** Infrastructure, documentation

---

## 🎯 PHASE GOALS

### PHASE 1: MVP (Week 1-3)
**Goal:** Deployable product on Railway  
**Features:**
- ✅ Email PIN authentication
- ✅ Property management (landlord)
- ✅ Property browsing (tenant)
- ✅ Tenancy assignment
- ✅ Stripe backend ready
- ✅ HTTPS live

### PHASE 2: PAYMENTS & MAINTENANCE (Week 4-5)
**Goal:** Complete payment & maintenance systems  
**Features:**
- ✅ Stripe payments (frontend)
- ✅ Manual receipts
- ✅ Payment history
- ✅ Maintenance requests
- ✅ Mobile-responsive

### PHASE 3: LAUNCH (Week 6)
**Goal:** Production-ready, polished, documented  
**Features:**
- ✅ Zero critical bugs
- ✅ Full documentation
- ✅ Demo video
- ✅ Release v1.0

---

## 📅 WEEKLY SCHEDULE

### Each Week: Monday → Sunday

**Monday-Wednesday:** Core implementation  
**Thursday-Saturday:** Testing & integration  
**Sunday:** Review, deployment, documentation  

### Example: Monday 9am Standup
```
Khawa: "Today: S3 service setup + Property API skeleton"
Islam: "Today: Property model + service, start UI components"
Amsyar: "Today: S3 bucket config + IAM credentials"

Blockers? → Discuss & resolve before end of day
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Before Every Deployment
- [ ] All tests passing locally
- [ ] No console errors
- [ ] No uncommitted changes
- [ ] Code reviewed by team
- [ ] `.env` secrets not in code
- [ ] Docker image builds successfully

### Deployment Command
```bash
git add .
git commit -m "Week X: [Feature] - [Status]"
git push origin develop  # (or main if stable)
# Railway auto-deploys
```

### Verify After Deployment
```bash
# Check Railway logs
railway logs

# Test key endpoints
curl https://your-app.railway.app/api/v1/auth/...
```

---

## 🛠️ COMMON COMMANDS

### Backend (Khawa)
```bash
# Start dev server
npm run dev

# Create migration
npx prisma migrate dev --name feature_name

# Generate Prisma client
npx prisma generate

# View database
npx prisma studio

# Test API
curl -X POST http://localhost:4000/api/v1/endpoint
```

### Frontend (Islam)
```bash
# Start dev server
ng serve --proxy-config proxy.conf.json

# Build for production
ng build --prod

# Run tests
ng test

# Add Material component
ng add @angular/material
```

### DevOps (Amsyar)
```bash
# Build Docker image
docker build -t rental-mvp .

# Run Docker Compose
docker-compose up --build

# Push to Railway
git push origin main
```

---

## 📊 FEATURE TRACKER

### Week 2: Properties + S3
- [ ] S3 bucket created + IAM configured
- [ ] Property API: CREATE (✅ by Wed)
- [ ] Property API: READ (✅ by Wed)
- [ ] Property API: UPDATE (✅ by Wed)
- [ ] Property API: DELETE (✅ by Wed)
- [ ] Image upload to S3 (✅ by Wed)
- [ ] Landlord property list component (✅ by Fri)
- [ ] Landlord property form component (✅ by Fri)
- [ ] Tenant browsing component (✅ by Fri)
- [ ] Full e2e testing (✅ by Sun)

### Week 3: Tenancy + Stripe + Deploy
- [ ] Tenancy API: CREATE (✅ by Mon)
- [ ] Tenancy API: READ/UPDATE/DELETE (✅ by Mon)
- [ ] Tenancy assignment UI (✅ by Thu)
- [ ] Tenant dashboard (✅ by Thu)
- [ ] Stripe PaymentIntent setup (✅ by Wed)
- [ ] Stripe webhook handler (✅ by Wed)
- [ ] Railway account & setup (✅ by Sat)
- [ ] Deploy backend to Railway (✅ by Sat)
- [ ] Deploy frontend to Railway (✅ by Sat)
- [ ] Demo test on live app (✅ by Sun)

### Week 4: Maintenance + Stripe Frontend
- [ ] Maintenance API (✅ by Tue)
- [ ] Photo upload for maintenance (✅ by Tue)
- [ ] Maintenance form component (✅ by Thu)
- [ ] Maintenance list/detail (✅ by Fri)
- [ ] Stripe payment form (✅ by Wed)
- [ ] Stripe payment confirmation (✅ by Wed)
- [ ] Full e2e testing (✅ by Sun)

### Week 5: Manual Payments + Polish
- [ ] Manual payment API (✅ by Mon)
- [ ] Payment approval endpoint (✅ by Mon)
- [ ] Receipt upload to S3 (✅ by Tue)
- [ ] Manual payment form UI (✅ by Thu)
- [ ] Landlord approval UI (✅ by Thu)
- [ ] Payment history table (✅ by Fri)
- [ ] Mobile responsiveness (✅ by Sat)
- [ ] Full e2e testing (✅ by Sun)

### Week 6: Polish + Launch
- [ ] Edge case handling (✅ by Tue)
- [ ] Performance optimization (✅ by Wed)
- [ ] Accessibility audit (✅ by Thu)
- [ ] Bug fixes (✅ by Thu)
- [ ] Documentation (✅ by Fri)
- [ ] Demo video (✅ by Fri)
- [ ] Release notes (✅ by Fri)
- [ ] Final deployment (✅ by Sun)

---

## 🚨 CRITICAL PATHS

Things that MUST happen on time:

1. **Week 2 End:** Property API stable (blocks Week 3)
2. **Week 3 Wed:** Stripe backend working (blocks Week 4)
3. **Week 3 Sun:** Deployed to Railway (MVP requirement)
4. **Week 4 Fri:** Stripe payment working (blocks Week 5)
5. **Week 6 Sun:** v1.0 released (final deadline)

---

## 🔍 DAILY CHECKLIST

### Morning (9am)
- [ ] Read today's TODO from current week file
- [ ] Check Slack for overnight messages
- [ ] Verify no deployment issues from yesterday

### During Day
- [ ] Code, test, commit
- [ ] Help teammates with blockers
- [ ] Update task progress

### Evening (5pm)
- [ ] Commit final changes
- [ ] Push to develop
- [ ] Note blockers for next day
- [ ] Update team status

### Friday EOW
- [ ] All code committed & pushed
- [ ] Week summary documented
- [ ] Blockers for next week noted

### Sunday EOW
- [ ] Merge develop → main (if stable)
- [ ] Tag commit with week number
- [ ] Update README/documentation
- [ ] Prepare for next week

---

## 🐛 DEBUGGING QUICK TIPS

**Backend API not responding?**
```bash
npm run dev
# Check: server running on port 4000?
# Check: database connected?
curl http://localhost:4000/api/v1/health
```

**Frontend can't call API?**
```bash
# Check: proxy.conf.json set up?
ng serve --proxy-config proxy.conf.json
# Check: request URL correct?
# Check: CORS headers in backend?
```

**S3 upload failing?**
```bash
# Check: AWS credentials in .env?
# Check: S3 bucket policy correct?
# Check: File size < 5MB?
# Check: File MIME type allowed?
```

**Stripe test payment failing?**
```bash
# Check: Using test keys (sk_test_)?
# Check: Using test card 4242 4242 4242 4242?
# Check: Webhook secret configured?
# Check: Webhook endpoint public URL?
```

**Railway deployment failing?**
```bash
railway logs
# Check: .env variables set?
# Check: Docker image builds locally?
# Check: PORT set to 4000?
# Check: Database migrations run?
```

---

## 📞 TEAM COMMUNICATION

**Daily Standup:** 9:00 AM
- 15 minutes max
- What I did yesterday
- What I'm doing today
- Any blockers

**Blocker Resolution:** ASAP
- Don't wait for standup
- Slack ping → quick call

**Weekly Sync:** Sunday 4 PM
- Review week progress
- Plan next week
- Demo demo for team

**Slack Channels:**
- `#general` - General chat
- `#dev-backend` - Backend issues
- `#dev-frontend` - Frontend issues
- `#devops` - Deployment issues
- `#blockers` - Critical issues

---

## 📚 RESOURCES

**Technical Docs:**
- [Prisma Docs](https://www.prisma.io/docs)
- [Angular Docs](https://angular.io/docs)
- [Express Docs](https://expressjs.com)
- [Stripe API](https://stripe.com/docs/api)
- [AWS S3 Docs](https://docs.aws.amazon.com/s3)

**Project Docs:**
- `README.md` - Project overview
- `PRD.md` - Product requirements
- `main-idea.md` - Technical design
- `TODO-Week[X].md` - Weekly plans
- `MASTER-PLAN-6WEEKS.md` - Full roadmap

---

## ✨ SUCCESS LOOKS LIKE

**By Week 3 End:**
- App live on Railway with HTTPS
- Landlord can create properties + assign tenants
- Tenant can browse properties + view lease
- Stripe backend ready for payment
- Zero critical bugs on main path
- Team confident & on schedule

**By Week 6 End:**
- All features working end-to-end
- Mobile-responsive & accessible
- Well-documented & demoed
- Production v1.0 released
- Ready for next phase (chat system, etc.)

---

## 🎯 REMEMBER

1. **MVP first, polish later** - Get core working, then refine
2. **Commit often** - Daily commits = easy debugging
3. **Test locally** - Before pushing to Railway
4. **Communicate** - Block others, ask for help
5. **Focus** - No chat system in Week 1-5, no scope creep
6. **Quality** - Edge cases matter, test them
7. **Document** - Future you will thank you

---

**You've got this! Ship it! 🚀**
