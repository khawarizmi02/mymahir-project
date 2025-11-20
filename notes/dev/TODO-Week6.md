# WEEK 6: FINAL POLISH + EDGE CASES + DEMO PREP
**Goal:** Bug fixes, edge case handling, performance optimization, and final demo readiness  
**Duration:** 7 days (Mon–Sun)  
**Team:** 3 Developers  
**Deliverable by Sunday:**  
> Production-ready MVP with zero critical bugs  
> Comprehensive demo video (10 min)  
> Complete documentation  
> **READY FOR CLIENT/LAUNCH** 🚀

---

## TEAM ROLES (Week 6)

| Dev | Focus |
|-----|-------|
| **Khawa (Backend)** | API stability, edge case handling, performance optimization, final deployment |
| **Amsyar (Full-Stack)** | Infrastructure stability, S3 optimization, database cleanup/optimization |
| **Islam (Frontend)** | UI polish, accessibility, responsiveness, demo preparation |

---

## DAILY TODO LIST (Monday → Sunday)

---

### MONDAY: Edge Case Handling (Backend)

| Task | Owner | Details |
|------|-------|-------|
| **Auth edge cases** | Khawa | Handle:

- User requests PIN multiple times → only latest is valid
- PIN expires → clear hash automatically
- User tries to verify with wrong email/PIN → graceful error
- Rate limit exceeded → 429 Too Many Requests
- User deleted → cannot login anymore
- Test: Try all edge cases via Postman

| **Property edge cases** | Khawa | Handle:

- Landlord deletes property with active tenancy → cascade to tenancy deletion + set tenancy status?
- Property upload with no images → still creates property
- Duplicate property creation → unique constraint or allow?
- Update property with occupied → prevent editing certain fields?
- Test: Verify all behaviors

| **Tenancy edge cases** | Khawa | Handle:

- Assign tenant to occupied property → error
- Assign non-existent user as tenant → error
- Create tenancy with past lease dates → allow or prevent?
- Overlapping tenancies on same property → prevent
- Delete tenancy → update property status to VACANT
- Test: All scenarios

| **Payment edge cases** | Khawa | Handle:

- Stripe webhook arrives before frontend confirm → handle gracefully
- Duplicate webhook events → idempotency (check stripePaymentId)
- Payment for non-existent tenancy → error
- Negative amount → error
- Currency mismatch → validate
- Test: Simulate webhook delays

| **Maintenance edge cases** | Khawa | Handle:

- Delete property with open maintenance → cascade
- Tenant deletes their own request → allow or prevent?
- Status transitions → PENDING → IN_PROGRESS → RESOLVED only
- Upload photo to resolved request → allow or prevent?
- Test: All status flows

| **File upload edge cases** | Khawa | Handle:

- Upload 0 images → property still works
- Upload oversized image → reject with clear error
- Corrupted file → reject
- Wrong MIME type → reject
- Duplicate filename → handle S3 uniqueness
- Test: Upload edge cases

**Milestone:** All APIs handle edge cases gracefully

---

### TUESDAY: Frontend Edge Cases + Error Handling

| Task | Owner | Details |
|------|-------|-------|
| **Auth error handling** | Islam | Show user-friendly messages for:

- Network error → "Connection failed. Check internet."
- Invalid PIN → "PIN expired or incorrect. Request new PIN."
- Rate limited → "Too many attempts. Try again in 5 minutes."
- Server error → "Server error. Please try again later."

| **Form validation edge cases** | Islam | 

- Empty form submit → show validation errors
- Submit form twice quickly → disable button
- File upload with network interruption → show retry
- Clear form after successful submit

| **Navigation edge cases** | Islam | 

- User logs out → clear localStorage token
- Token expires → redirect to login
- User navigates to unauthorized page → redirect to dashboard
- Browser back button after logout → prevent access

| **Data display edge cases** | Islam | 

- Property with no images → show placeholder
- Long property description → truncate/show more
- Large payment amounts → format with thousand separators
- Empty lists → show "No data" message
- Test: All scenarios

| **Mobile edge cases** | Islam | 

- Keyboard covering form input → scroll properly
- Long filenames → truncate in UI
- Image aspect ratios → maintain consistency
- Touch events → ensure proper spacing between buttons

**Milestone:** Frontend robust to all user errors

---

### WEDNESDAY: Performance Optimization

| Task | Owner | Details |
|------|-------|-------|
| **API optimization** | Khawa | 

- Add pagination to list endpoints (default 20 per page)
- Add filtering to reduce data transfer
- Verify indexes on frequently queried columns (email, landlordId, tenantId)
- Check N+1 query issues → use Prisma select/include properly

```prisma
// Good:
await prisma.property.findMany({
  include: { images: true, landlord: { select: { id: true, email: true } } }
})

// Bad (N+1):
const properties = await prisma.property.findMany();
for (let prop of properties) {
  const images = await prisma.propertyImage.findMany({
    where: { propertyId: prop.id }
  })
}
```

| **Database optimization** | Amsyar | 

- Verify indexes exist on: email, landlordId, tenantId, propertyId, stripePaymentId
- Check for unused columns/tables
- Archive old test data (if any)
- Run Prisma migration check: `npx prisma migrate diff`

| **Frontend optimization** | Islam | 

- Lazy load images (use `loading="lazy"` or ngx-image-lazyload)
- Code splitting for large components
- Preload critical resources
- Minify production build

| **S3 optimization** | Amsyar | 

- Verify image compression (photos shouldn't be huge)
- Add cache headers for images
- Verify S3 lifecycle policies (optional, for old files)

| **Test performance** | All | 

- Check page load times with DevTools
- Check API response times (should be <200ms for most endpoints)
- Test with slow network (Chrome DevTools throttling)

**Milestone:** App loads quickly, API responses fast

---

### THURSDAY: Accessibility + Compliance

| Task | Owner | Details |
|------|-------|-------|
| **Accessibility audit** | Islam | Verify:

- ARIA labels on interactive elements
- Keyboard navigation (Tab, Enter, Escape)
- Color contrast ratios (WCAG AA minimum 4.5:1)
- Image alt text
- Form labels associated with inputs
- Error messages clearly visible

| **Test keyboard navigation** | Islam | 

- Tab through entire app
- Ensure logical tab order
- Escape closes modals
- Enter submits forms

| **Test with screen reader** | Islam | Use NVDA (Windows) or VoiceOver (Mac)
- Read page structure
- Read form labels
- Read error messages

| **Security checks** | Khawa | 

- Verify JWT is HttpOnly (if using cookies) or secure
- Verify CORS allows only your domain
- Verify rate limiting on auth endpoints
- Verify SQL injection prevention (Prisma handles this)
- Check for hardcoded secrets in code

| **HTTPS verification** | Amsyar | 

- Verify SSL certificate valid on Railway
- Check for mixed content warnings
- Test on multiple browsers

**Milestone:** App accessible & secure

---

### FRIDAY: Bug Fixes + Testing

| Task | Owner | Details |
|------|-------|-------|
| **Bug triage** | All | 

- List all known bugs (high/medium/low priority)
- Prioritize: Critical bugs first, then medium, then low

| **Fix critical bugs** | All | Any bugs blocking core features:

- Login not working
- Payment not processing
- Images not uploading
- Properties not showing
- etc.

| **Fix medium bugs** | All | UI/UX issues, error handling, etc. |
| **Document low priority bugs** | All | Note for post-MVP improvements |
| **Regression testing** | All | Test core flows end-to-end after fixes:

- Landlord: create property → assign tenant → receive payment
- Tenant: browse → pay → view history
- Maintenance: submit → landlord updates → view status

| **Cross-browser testing** | Islam | Test on:

- Chrome
- Firefox
- Safari
- Mobile Safari (iOS)
- Chrome Mobile (Android)

| **Load testing** | Khawa | (Optional) Simulate multiple users:

- Use Artillery or similar tool
- Test 10 concurrent users
- Check for timeout/error spikes

**Milestone:** Zero critical bugs, minimal medium bugs

---

### SATURDAY: Documentation + Demo Prep

| Task | Owner | Details |
|------|-------|-------|
| **Update README.md** | Amsyar | Include:

- Project overview
- Tech stack
- Features implemented
- Setup instructions (local dev)
- Deployment instructions (Railway)
- Screenshots of key features
- Demo video link

| **Create API documentation** | Khawa | Postman collection or Swagger:

- All endpoints
- Required parameters
- Example responses
- Error codes

| **Create user guide** | Islam | 

- Landlord walkthrough (with screenshots)
- Tenant walkthrough (with screenshots)
- Troubleshooting section

| **Create demo script** | All | Outline for demo video:

1. Login (landlord)
2. Create property with images
3. Assign tenant
4. Login as tenant
5. Browse properties
6. View current lease
7. Pay rent (Stripe test card)
8. Upload maintenance request
9. Landlord approve maintenance
10. Tenant submit manual receipt
11. Landlord approve receipt
12. View payment history
13. Mobile responsiveness

| **Record demo video** | All | 

- Duration: 8-10 minutes
- Show all major features
- Use test accounts (landlord + tenant)
- Include app responsiveness on mobile (if possible)
- Upload to YouTube or similar (private link for now)

| **Create presentation slides** | All | (Optional)

- System architecture diagram
- Feature overview
- Tech stack
- Team roles
- Demo highlights
- Challenges & solutions

**Milestone:** Complete documentation & demo ready

---

### SUNDAY: Final Deployment + Launch

| Task | Owner | Details |
|------|-------|-------|
| **Final code review** | All | 

- Review all recent changes
- Check for code quality issues
- Verify no sensitive data in repo

| **Final commit** | All | 

```bash
git add .
git commit -m "Week 6: Final polish, edge cases, documentation - MVP v1.0 ready"
git push origin main
```

| **Tag release** | Khawa | 

```bash
git tag -a v1.0 -m "MVP Release - December 2025"
git push origin v1.0
```

| **Final deployment to Railway** | Khawa | 

- Deploy latest code
- Verify all services running
- Check logs for errors
- Test live: https://your-app.railway.app

| **Create live checklist** | All | 

- [ ] App loads without errors
- [ ] Login works (email PIN)
- [ ] Create property works
- [ ] Assign tenant works
- [ ] Browse properties works (as tenant)
- [ ] Pay via Stripe works (test card)
- [ ] Upload receipt works
- [ ] View payment history works
- [ ] Submit maintenance works
- [ ] Approve maintenance works
- [ ] Mobile responsive
- [ ] No console errors
- [ ] HTTPS working

| **Prepare presentation** | All | 

- Ready demo video
- Ready slides (optional)
- Brief 5-min talking points
- Prepare to answer questions

| **Create release notes** | Amsyar | 

```markdown
# MVP Release v1.0 - December 2025

## Features
- Email PIN authentication (passwordless login)
- Property management (landlord)
- Property browsing (tenant)
- Tenancy assignment
- Stripe payments
- Manual payment receipts
- Maintenance request system
- Payment history tracking

## Known Limitations
- [List any known bugs/limitations]
- [Future improvements]

## Tech Stack
- Frontend: Angular 20 + Material
- Backend: Node.js + Express + TypeScript
- Database: MariaDB + Prisma ORM
- Storage: AWS S3
- Payments: Stripe (test mode)
- Deployment: Railway

## Setup
[Quick setup instructions]

## Demo
[Link to demo video]
```

| **Archive test data** | All | 

- Document test user accounts
- Document test properties
- Document Stripe test cards to use

| **Celebrate! 🎉** | All | MVP is COMPLETE and DEPLOYED!

**Milestone:** **MVP LAUNCHED** 🚀✅

---

## WEEK 6 DELIVERABLES (By Sunday Night)

| Deliverable | Status |
|-----------|--------|
| All edge cases handled | Done ✅ |
| Performance optimized | Done ✅ |
| Accessibility verified | Done ✅ |
| Zero critical bugs | Done ✅ |
| Complete documentation | Done ✅ |
| Demo video (8-10 min) | Done ✅ |
| Presentation slides (optional) | Done ✅ |
| Live deployment on Railway | Done ✅ |
| Release notes v1.0 | Done ✅ |

---

## FINAL PROJECT SUMMARY

### ✅ COMPLETED FEATURES

| Feature | Status |
|---------|--------|
| Email PIN Authentication | ✅ |
| Google OAuth | ❌ (Post-MVP) |
| Property Management | ✅ |
| Property Images (S3) | ✅ |
| Property Browsing (Tenant) | ✅ |
| Tenancy Creation | ✅ |
| Stripe Payments | ✅ |
| Manual Receipt Upload | ✅ |
| Payment History | ✅ |
| Maintenance Requests | ✅ |
| Maintenance Status Tracking | ✅ |
| Role-based Dashboards | ✅ |
| Mobile Responsive | ✅ |
| PWA Support | ✅ (basic) |
| Deployment (Railway) | ✅ |

### ❌ POST-MVP FEATURES (Future)

- Google OAuth
- Chat system + Telegram sync
- Email reminders (cron)
- Admin panel
- Reports & charts
- Multi-property tenancy
- Late fees calculation
- Contract PDF generation

---

## TEAM PERFORMANCE

| Dev | Weeks Focus | Key Contributions |
|-----|------------|-------------------|
| **Khawa** | Backend | Auth API, Property API, Tenancy API, Stripe backend, Payment API, Database design, Deployment |
| **Amsyar** | Full-Stack | S3 integration, Stripe frontend bridge, Email service, Infrastructure, CI/CD |
| **Islam** | Frontend | Property UI, Tenant dashboard, Landlord dashboard, Payment UI, Maintenance UI, Accessibility |

---

## DEPLOYMENT INFO

**Live URL:** `https://your-app.railway.app`  
**Repository:** `https://github.com/khawarizmi02/rental-mvp-2025`  
**Branch:** `main` (production)  
**Demo Video:** [Link to YouTube]  
**Release Date:** December 2025  
**Status:** MVP Complete & Deployed ✅

---

## NEXT STEPS (Post-MVP)

1. **Week 7+: Chat System**
   - Real-time messaging between landlord & tenant
   - Telegram integration (sync messages)

2. **Week 8+: Advanced Features**
   - Google OAuth
   - Email reminders (rent due soon, overdue)
   - Payment receipts (PDF generation)
   - Advanced reports & analytics

3. **Ongoing: Maintenance**
   - Bug fixes
   - Performance improvements
   - User feedback incorporation

---

## NOTES FOR DEVELOPERS

- **Khawa**: Excellent backend architecture. Consider adding logging for production debugging.
- **Amsyar**: Great infrastructure work. Document S3 bucket setup for future team members.
- **Islam**: Outstanding UI/UX. Mobile experience is smooth. Keep accessibility a priority.

**Final thought:** You've built a solid MVP in 6 weeks. The architecture is scalable for future features. Great job! 🎉

---

**🚀 MVP v1.0 READY FOR PRODUCTION**
