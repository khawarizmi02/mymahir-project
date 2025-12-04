# WEEK 2 TEST REPORT - PROPERTIES + S3 + TENANCY
**Test Date:** _______________  
**Tester Name:** _______________  
**Test Environment:** Local Docker Compose / Staging / Production  
**Overall Status:** 🔴 Not Started | 🟡 In Progress | 🟢 Complete  

---

## 1. S3 INTEGRATION TESTING

### 1.1 S3 Setup & Configuration

| Test Case | Steps | Expected Result | Actual Result | Status | Notes |
|-----------|-------|-----------------|----------------|--------|-------|
| **S3 Bucket Created** | Go to AWS Console → S3 → Check bucket `mymahit-mysewa-bucket` exists | Bucket visible in S3 console | | ☐ Pass ☐ Fail | |
| **S3 Credentials in .env** | Check `.env` file has `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET` | All 4 variables present and non-empty | | ☐ Pass ☐ Fail | |
| **CORS Configured** | AWS Console → Bucket → Permissions → CORS configuration | CORS allows PUT, GET, POST, DELETE; AllowedOrigins includes `localhost:4200` and `localhost:3000` | | ☐ Pass ☐ Fail | |
| **IAM User Permissions** | AWS Console → IAM → Users → Check permissions for S3 user | User has `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject` on bucket | | ☐ Pass ☐ Fail | |
| **Backend Restart with .env** | `npm run dev` in server folder | No errors about AWS credentials | | ☐ Pass ☐ Fail | |

---

### 1.2 S3 Upload & Download (Postman/Insomnia)

| Test Case | Steps | Expected Result | Actual Result | Status | Notes |
|-----------|-------|-----------------|----------------|--------|-------|
| **Get Presigned URL** | POST Postman: `GET /api/v1/properties/1/images/presign?filename=test.jpg&contentType=image/jpeg` with Bearer token | Status 200, response includes `presignedUrl` and `s3Key` | | ☐ Pass ☐ Fail | |
| **Upload to S3 via Presigned URL** | PUT presigned URL in Postman with image file (Binary body), header `Content-Type: image/jpeg` | Status 200, empty response body | | ☐ Pass ☐ Fail | |
| **Verify File in S3 Console** | Go to AWS S3 → Bucket → properties/1/ folder | Uploaded image file appears with correct name | | ☐ Pass ☐ Fail | |
| **Download from S3 URL** | Copy S3 URL from presigned response, open in browser | Image downloads/displays correctly | | ☐ Pass ☐ Fail | |
| **Upload Multiple Images** | Upload 3 different images to same property | All 3 appear in S3 console under properties/1/ | | ☐ Pass ☐ Fail | |
| **Upload Invalid File** | Upload file with `Content-Type: text/plain` or wrong type | Status 400 or 403 error | | ☐ Pass ☐ Fail | |
| **Presigned URL Expiry** | Get presigned URL, wait > 5 minutes, try to upload | Status error: "Request has expired" or "Signature mismatch" | | ☐ Pass ☐ Fail | |

---

### 1.3 S3 Delete Operations

| Test Case | Steps | Expected Result | Actual Result | Status | Notes |
|-----------|-------|-----------------|----------------|--------|-------|
| **Delete Image from DB** | DELETE `/api/v1/properties/1/images/1` with Bearer token | Status 200, image record deleted from database | | ☐ Pass ☐ Fail | |
| **Verify File Deleted from S3** | Go to AWS S3 console → properties/1/ folder | File no longer visible (may take seconds to sync) | | ☐ Pass ☐ Fail | |
| **Delete Property with Images** | DELETE `/api/v1/properties/1` (property has 3 images) | Status 200, property deleted, all image files deleted from S3 (cascade delete) | | ☐ Pass ☐ Fail | |

---

## 2. BACKEND API TESTING (Postman/Insomnia)

### 2.1 Property CRUD - Create

| Test Case | Steps | Expected Result | Actual Result | Status | Notes |
|-----------|-------|-----------------|----------------|--------|-------|
| **Create Property - Valid** | POST `/api/v1/properties` with valid body (landlordId, title, address, monthlyRent, status) and Bearer token | Status 201, returns new property object with ID | | ☐ Pass ☐ Fail | |
| **Create Property - Missing Required Field** | POST `/api/v1/properties` missing `title` field | Status 400 with error message "title is required" | | ☐ Pass ☐ Fail | |
| **Create Property - Invalid Monthly Rent** | POST `/api/v1/properties` with `monthlyRent: -100` or `0` | Status 400 with error "monthlyRent must be > 0" | | ☐ Pass ☐ Fail | |
| **Create Property - No Auth Token** | POST `/api/v1/properties` without Bearer token | Status 401 "Unauthorized" | | ☐ Pass ☐ Fail | |
| **Create Property - Invalid Status** | POST `/api/v1/properties` with `status: "INVALID"` | Status 400 with error "Invalid status" | | ☐ Pass ☐ Fail | |
| **Create Property - Wrong Landlord** | User A creates property with `landlordId: 99` (not their ID) | Status 403 "Forbidden" or automatically use their ID | | ☐ Pass ☐ Fail | |

---

### 2.2 Property CRUD - Read

| Test Case | Steps | Expected Result | Actual Result | Status | Notes |
|-----------|-------|-----------------|----------------|--------|-------|
| **Get All Properties (Landlord)** | GET `/api/v1/properties?landlordId=1` with Bearer token | Status 200, returns array of properties for landlord 1 | | ☐ Pass ☐ Fail | |
| **Get All Vacant Properties (Tenant)** | GET `/api/v1/properties/vacant` with Bearer token | Status 200, returns only properties with status='VACANT' | | ☐ Pass ☐ Fail | |
| **Get Property by ID** | GET `/api/v1/properties/1` with Bearer token | Status 200, returns property object with all fields including images | | ☐ Pass ☐ Fail | |
| **Get Non-existent Property** | GET `/api/v1/properties/9999` with Bearer token | Status 404 "Property not found" | | ☐ Pass ☐ Fail | |
| **Get Properties with Pagination** | GET `/api/v1/properties?page=1&limit=10` | Status 200, returns max 10 properties | | ☐ Pass ☐ Fail | |
| **Get Properties - No Auth** | GET `/api/v1/properties` without Bearer token | Status 401 "Unauthorized" | | ☐ Pass ☐ Fail | |

---

### 2.3 Property CRUD - Update

| Test Case | Steps | Expected Result | Actual Result | Status | Notes |
|-----------|-------|-----------------|----------------|--------|-------|
| **Update Property - Valid** | PUT `/api/v1/properties/1` with updated title, address, monthlyRent and Bearer token (owned by user) | Status 200, returns updated property | | ☐ Pass ☐ Fail | |
| **Update Property - Not Owned** | User A tries to update property owned by User B | Status 403 "Forbidden" | | ☐ Pass ☐ Fail | |
| **Update Property - Invalid Data** | PUT `/api/v1/properties/1` with `monthlyRent: "invalid"` | Status 400 with validation error | | ☐ Pass ☐ Fail | |
| **Update Property Status** | PUT `/api/v1/properties/1` change status from VACANT to OCCUPIED | Status 200, status updated in response | | ☐ Pass ☐ Fail | |
| **Update Non-existent Property** | PUT `/api/v1/properties/9999` | Status 404 "Property not found" | | ☐ Pass ☐ Fail | |

---

### 2.4 Property CRUD - Delete

| Test Case | Steps | Expected Result | Actual Result | Status | Notes |
|-----------|-------|-----------------|----------------|--------|-------|
| **Delete Property - Owner** | DELETE `/api/v1/properties/1` with Bearer token (owned by user) | Status 200, property removed from database | | ☐ Pass ☐ Fail | |
| **Delete Property - Not Owned** | User A tries to delete property owned by User B | Status 403 "Forbidden" | | ☐ Pass ☐ Fail | |
| **Delete Non-existent Property** | DELETE `/api/v1/properties/9999` | Status 404 "Property not found" | | ☐ Pass ☐ Fail | |
| **Delete Property with Images** | DELETE `/api/v1/properties/1` (has 3 images) | Status 200, all PropertyImage records cascade deleted | | ☐ Pass ☐ Fail | |

---

### 2.5 Property Images API

| Test Case | Steps | Expected Result | Actual Result | Status | Notes |
|-----------|-------|-----------------|----------------|--------|-------|
| **Save Images URLs to Property** | POST `/api/v1/properties/1/images` with body `{"urls": ["https://s3..."]}` and Bearer token | Status 200, property has images array with 1 item | | ☐ Pass ☐ Fail | |
| **Save Multiple Images URLs** | POST `/api/v1/properties/1/images` with 3 S3 URLs | Status 200, all 3 images added to property | | ☐ Pass ☐ Fail | |
| **Save Invalid Image URL** | POST `/api/v1/properties/1/images` with `{"urls": ["invalid-url"]}` | Status 400 or accepted but invalid on frontend | | ☐ Pass ☐ Fail | |
| **Get Property with Images** | GET `/api/v1/properties/1` | Response includes `images` array with all image URLs | | ☐ Pass ☐ Fail | |
| **Delete Image from Property** | DELETE `/api/v1/properties/1/images/1` with Bearer token | Status 200, image record deleted, file deleted from S3 | | ☐ Pass ☐ Fail | |

---

### 2.6 Authorization & Security

| Test Case | Steps | Expected Result | Actual Result | Status | Notes |
|-----------|-------|-----------------|----------------|--------|-------|
| **Expired JWT Token** | Use expired JWT token in Bearer header | Status 401 "Token expired" or "Invalid token" | | ☐ Pass ☐ Fail | |
| **Invalid JWT Token** | Use random string as Bearer token | Status 401 "Invalid token" | | ☐ Pass ☐ Fail | |
| **Malformed Auth Header** | Use `Authorization: InvalidToken` (not Bearer) | Status 400 or 401 | | ☐ Pass ☐ Fail | |
| **Landlord Cannot Delete Tenant** | Landlord tries DELETE on non-property resource | Status 403 or 404 | | ☐ Pass ☐ Fail | |

---

## 3. FRONTEND TESTING (Browser)

### 3.1 Landlord - Property List View

| Test Case | Steps | Expected Result | Actual Result | Status | Notes |
|-----------|-------|-----------------|----------------|--------|-------|
| **Load Property List** | Login as landlord → navigate to `/landlord/properties` | Page loads, shows Material table/cards of landlord's properties | | ☐ Pass ☐ Fail | |
| **Property Data Displayed** | Check property list shows: title, address, monthlyRent, status, images | All fields visible and correct data displayed | | ☐ Pass ☐ Fail | |
| **Property Status Badges** | Check VACANT properties show green badge, OCCUPIED show red | Correct color coding for each status | | ☐ Pass ☐ Fail | |
| **Property Images Display** | Property with images shows thumbnail(s) in list | Image thumbnails visible and clickable | | ☐ Pass ☐ Fail | |
| **Action Buttons** | Check buttons exist: Edit, Delete, View Details, Upload Image | All buttons visible | | ☐ Pass ☐ Fail | |
| **Empty List Message** | New landlord with no properties → navigate to list | Shows "No properties yet" message | | ☐ Pass ☐ Fail | |
| **Responsive Design** | Test on mobile, tablet, desktop | Property list is readable and responsive on all sizes | | ☐ Pass ☐ Fail | |

---

### 3.2 Landlord - Create Property Form

| Test Case | Steps | Expected Result | Actual Result | Status | Notes |
|-----------|-------|-----------------|----------------|--------|-------|
| **Open Create Form** | Click "Add Property" button on list | Form modal/page opens with empty fields | | ☐ Pass ☐ Fail | |
| **Form Fields Present** | Check form has: title, description, address, monthlyRent, status dropdown | All fields visible | | ☐ Pass ☐ Fail | |
| **Fill Form - Valid Data** | Fill all fields with valid data → click Submit | Success message, redirected to property list, new property visible | | ☐ Pass ☐ Fail | |
| **Form Validation - Missing Title** | Leave title empty → try to Submit | Error message: "Title is required" | | ☐ Pass ☐ Fail | |
| **Form Validation - Invalid Rent** | Enter monthlyRent = 0 or negative → try to Submit | Error message: "Rent must be > 0" | | ☐ Pass ☐ Fail | |
| **Upload Single Image** | Click "Upload Image" → select 1 file (JPG, PNG, < 5MB) → preview shows | Image preview displays correctly | | ☐ Pass ☐ Fail | |
| **Upload Multiple Images** | Upload 3 images → all show previews | All 3 image previews visible | | ☐ Pass ☐ Fail | |
| **Remove Image from Preview** | Upload 3 images → click X on one → Submit | Only 2 images uploaded to S3 | | ☐ Pass ☐ Fail | |
| **Upload Large File** | Try to upload image > 5MB | Error message: "File too large" | | ☐ Pass ☐ Fail | |
| **Upload Invalid File Type** | Try to upload .pdf or .txt file | Error message: "Only images allowed" | | ☐ Pass ☐ Fail | |
| **Cancel Form** | Fill form, click Cancel button | Redirected to property list, no property created | | ☐ Pass ☐ Fail | |

---

### 3.3 Landlord - Edit Property

| Test Case | Steps | Expected Result | Actual Result | Status | Notes |
|-----------|-------|-----------------|----------------|--------|-------|
| **Open Edit Form** | Property list → click Edit button on property | Form pre-fills with current property data | | ☐ Pass ☐ Fail | |
| **Edit Title** | Change title → click Save | Title updated in list | | ☐ Pass ☐ Fail | |
| **Edit Monthly Rent** | Change monthlyRent → click Save | Rent updated in list and API | | ☐ Pass ☐ Fail | |
| **Change Status** | Change status from VACANT to OCCUPIED → Save | Status badge changes color | | ☐ Pass ☐ Fail | |
| **Add More Images** | Edit property → upload 2 new images → Save | New images added to existing images (total now 5) | | ☐ Pass ☐ Fail | |
| **Existing Images Display** | Open edit form → see existing images in preview | All current images shown | | ☐ Pass ☐ Fail | |
| **Remove Existing Image** | Edit property → click X on existing image → Save | Image removed from property and S3 | | ☐ Pass ☐ Fail | |
| **Validation on Edit** | Try to set rent to 0 → Save | Error message, save blocked | | ☐ Pass ☐ Fail | |

---

### 3.4 Landlord - Delete Property

| Test Case | Steps | Expected Result | Actual Result | Status | Notes |
|-----------|-------|-----------------|----------------|--------|-------|
| **Open Delete Confirmation** | Property list → click Delete button | Confirmation dialog appears: "Are you sure?" | | ☐ Pass ☐ Fail | |
| **Confirm Delete** | Click "Delete" in confirmation | Property removed from list, success message shown | | ☐ Pass ☐ Fail | |
| **Verify Deletion in Backend** | Get property list from API after delete | Property not in response | | ☐ Pass ☐ Fail | |
| **Verify Images Deleted from S3** | Go to AWS S3 console → properties/{id}/ folder | Folder empty or deleted (no image files remain) | | ☐ Pass ☐ Fail | |
| **Cancel Delete** | Click Delete → click Cancel in confirmation | Property still in list, no deletion | | ☐ Pass ☐ Fail | |

---

### 3.5 Landlord - Property Details

| Test Case | Steps | Expected Result | Actual Result | Status | Notes |
|-----------|-------|-----------------|----------------|--------|-------|
| **Open Property Details** | Property list → click property card or "View Details" button | Details page shows full property info | | ☐ Pass ☐ Fail | |
| **Display All Fields** | Check details page shows: title, description, address, monthlyRent, status, all images | All data visible | | ☐ Pass ☐ Fail | |
| **Image Gallery** | Property has 3+ images → gallery shows with thumbnails | All images visible, clickable to view larger | | ☐ Pass ☐ Fail | |
| **Navigation Buttons** | Check Edit, Delete, Back to List buttons | All buttons present and functional | | ☐ Pass ☐ Fail | |

---

### 3.6 Tenant - Browse Vacant Properties

| Test Case | Steps | Expected Result | Actual Result | Status | Notes |
|-----------|-------|-----------------|----------------|--------|-------|
| **Load Vacant Properties** | Login as tenant → navigate to `/tenant/properties` | Page loads, shows Material cards of VACANT properties only | | ☐ Pass ☐ Fail | |
| **Display Only Vacant** | List shows properties with status = VACANT | OCCUPIED properties are NOT shown | | ☐ Pass ☐ Fail | |
| **Property Card Info** | Each property card shows: title, address, monthlyRent, thumbnail image | All info visible and formatted nicely | | ☐ Pass ☐ Fail | |
| **Multiple Properties** | System has 5+ vacant properties → all displayed | All 5+ properties visible in grid/list | | ☐ Pass ☐ Fail | |
| **Empty List Message** | No vacant properties available → navigate to page | Shows "No available properties" message | | ☐ Pass ☐ Fail | |
| **Responsive Grid** | Test on mobile, tablet, desktop | Property cards stack vertically on mobile, grid on desktop | | ☐ Pass ☐ Fail | |

---

### 3.7 Tenant - Search & Filter

| Test Case | Steps | Expected Result | Actual Result | Status | Notes |
|-----------|-------|-----------------|----------------|--------|-------|
| **Filter by Price Range** | Enter min/max rent → click Filter | Results show only properties within range | | ☐ Pass ☐ Fail | |
| **Filter by Location** | Type location/address in search → click Filter | Results show only matching properties | | ☐ Pass ☐ Fail | |
| **Combined Filters** | Apply price range + location filter together | Results filtered by both criteria | | ☐ Pass ☐ Fail | |
| **Clear Filters** | Apply filters → click "Clear" or "Reset" | All properties shown again | | ☐ Pass ☐ Fail | |

---

### 3.8 Tenant - Property Details

| Test Case | Steps | Expected Result | Actual Result | Status | Notes |
|-----------|-------|-----------------|----------------|--------|-------|
| **Open Property Details** | Vacant properties list → click property card or "View Details" | Details page shows property info + landlord contact | | ☐ Pass ☐ Fail | |
| **Display Property Info** | Details page shows: title, description, address, monthlyRent, status = VACANT | All data correct | | ☐ Pass ☐ Fail | |
| **Display Images** | Property has 2+ images → all visible in gallery | Image gallery shows all images, can navigate | | ☐ Pass ☐ Fail | |
| **Landlord Contact (Optional)** | Check if landlord name/email visible | Contact info displayed (if available in schema) | | ☐ Pass ☐ Fail | |
| **Back to List Button** | Click "Back" → returns to vacant properties list | Successfully navigated back | | ☐ Pass ☐ Fail | |

---

## 4. END-TO-END INTEGRATION TESTING

### 4.1 Full Workflow - Landlord Creates Property with Images

| Test Case | Steps | Expected Result | Actual Result | Status | Notes |
|-----------|-------|-----------------|----------------|--------|-------|
| **E2E: Create Property** | 1. Login as landlord 2. Navigate to properties 3. Click Add 4. Fill form (title, address, rent) 5. Upload 2 images 6. Click Save | Property created, images uploaded to S3, property visible in list with thumbnails | | ☐ Pass ☐ Fail | |
| **E2E: Verify in S3** | After creating property, check AWS S3 console | Images appear in `properties/{propertyId}/` folder with correct filenames | | ☐ Pass ☐ Fail | |
| **E2E: Edit & Add More Images** | Edit property, add 1 more image (now 3 total) → Save | All 3 images visible in property details | | ☐ Pass ☐ Fail | |
| **E2E: Tenant Sees Updated Property** | Logout, login as different user (tenant) → browse vacant properties | New property visible with all 3 images | | ☐ Pass ☐ Fail | |

---

### 4.2 Full Workflow - Tenant Browses & Views Property

| Test Case | Steps | Expected Result | Actual Result | Status | Notes |
|-----------|-------|-----------------|----------------|--------|-------|
| **E2E: Tenant Browse** | 1. Login as tenant 2. Navigate to browse properties 3. See list of vacant properties | List loads with multiple properties and images | | ☐ Pass ☐ Fail | |
| **E2E: Filter Search** | Apply filter (price range or location) → filtered results show | Only matching properties displayed | | ☐ Pass ☐ Fail | |
| **E2E: View Details** | Click property card → view full details + gallery | All images load correctly, details complete | | ☐ Pass ☐ Fail | |
| **E2E: Change Landlord Status** | Landlord changes property status to OCCUPIED → tenant refreshes page | Property disappears from tenant's vacant list | | ☐ Pass ☐ Fail | |

---

### 4.3 Database & Data Integrity

| Test Case | Steps | Expected Result | Actual Result | Status | Notes |
|-----------|-------|-----------------|----------------|--------|-------|
| **Property Record in DB** | Create property → Query database `SELECT * FROM Property WHERE id=...` | Record exists with all fields populated | | ☐ Pass ☐ Fail | |
| **PropertyImage Records** | Upload 3 images to property → Query `SELECT * FROM PropertyImage WHERE propertyId=...` | 3 records exist with correct URLs | | ☐ Pass ☐ Fail | |
| **Cascade Delete Images** | Delete property → Query `SELECT * FROM PropertyImage WHERE propertyId=...` | 0 records (all image records deleted) | | ☐ Pass ☐ Fail | |
| **Foreign Key Constraint** | Try to create PropertyImage with non-existent propertyId | Database error or API validation blocks it | | ☐ Pass ☐ Fail | |
| **User-Property Relationship** | Query `SELECT properties FROM User WHERE id=...` | All properties belong to correct landlord | | ☐ Pass ☐ Fail | |

---

### 4.4 Error Handling & Edge Cases

| Test Case | Steps | Expected Result | Actual Result | Status | Notes |
|-----------|-------|-----------------|----------------|--------|-------|
| **Network Error During Upload** | Start image upload → simulate disconnect (dev tools) | Graceful error message, retry option available | | ☐ Pass ☐ Fail | |
| **Slow S3 Upload** | Upload large image (2-3 MB) | Progress indicator shows, upload completes, no timeout | | ☐ Pass ☐ Fail | |
| **Concurrent Create** | Two landlords create properties simultaneously | Both properties created without conflicts | | ☐ Pass ☐ Fail | |
| **Session Expiry During Form** | Fill property form, wait for token to expire → Submit | Error message: "Session expired", redirected to login | | ☐ Pass ☐ Fail | |
| **Browser Back Button** | Create property → submit → browser back button | Doesn't resubmit, shows list | | ☐ Pass ☐ Fail | |

---

### 4.5 Performance & Load Testing

| Test Case | Steps | Expected Result | Actual Result | Status | Notes |
|-----------|-------|-----------------|----------------|--------|-------|
| **Load 100 Properties** | Landlord has 100 properties → load property list | List loads within 2 seconds | | ☐ Pass ☐ Fail | |
| **Image Gallery Performance** | Open property details with 10 images → image gallery loads | All thumbnails load within 1-2 seconds | | ☐ Pass ☐ Fail | |
| **Pagination (Optional)** | If pagination implemented: load page 5 of 10 | Correct 10 items shown, pagination controls work | | ☐ Pass ☐ Fail | |

---

### 4.6 UI/UX & Material Design

| Test Case | Steps | Expected Result | Actual Result | Status | Notes |
|-----------|-------|-----------------|----------------|--------|-------|
| **Material Components Used** | Inspect all property pages for Material UI | Buttons, tables, cards use Material Design | | ☐ Pass ☐ Fail | |
| **Form Layout** | Create property form → check layout | Form is clean, readable, easy to use | | ☐ Pass ☐ Fail | |
| **Error Messages** | Trigger validation error → check message | Error shown in Material snackbar/toast | | ☐ Pass ☐ Fail | |
| **Success Messages** | Create property successfully → check message | Success shown in snackbar (green, "Property created") | | ☐ Pass ☐ Fail | |
| **Loading States** | Create property → observe loading state | Loading spinner/message shows during submission | | ☐ Pass ☐ Fail | |
| **Responsive Images** | Check property images on mobile | Images scale correctly, not distorted | | ☐ Pass ☐ Fail | |
| **Icons & Buttons** | Check all action buttons have Material icons | Icons are clear and intuitive | | ☐ Pass ☐ Fail | |

---

## 5. TENANCY API TESTING (Skeleton/Ready for Week 3)

### 5.1 Tenancy Endpoints Exist

| Test Case | Steps | Expected Result | Actual Result | Status | Notes |
|-----------|-------|-----------------|----------------|--------|-------|
| **POST /api/v1/tenancies Exists** | Postman: POST `/api/v1/tenancies` | Status 200 or 201 (or 501 if not implemented yet) | | ☐ Pass ☐ Fail | |
| **GET /api/v1/tenancies/:id Exists** | Postman: GET `/api/v1/tenancies/1` | Status 200 or 501 | | ☐ Pass ☐ Fail | |
| **GET /api/v1/tenancies Query Exists** | Postman: GET `/api/v1/tenancies?landlordId=1&tenantId=2` | Status 200 or 501 | | ☐ Pass ☐ Fail | |

---

## 6. DEPLOYMENT & DOCKER TESTING

### 6.1 Docker Compose

| Test Case | Steps | Expected Result | Actual Result | Status | Notes |
|-----------|-------|-----------------|----------------|--------|-------|
| **Docker Build** | Run `docker-compose build` in project root | All services build successfully without errors | | ☐ Pass ☐ Fail | |
| **Docker Up** | Run `docker-compose up` | All services start: backend, frontend, database (no crash) | | ☐ Pass ☐ Fail | |
| **Backend Health** | Docker up → check backend logs | No errors, server listening on port 3000 | | ☐ Pass ☐ Fail | |
| **Frontend Health** | Docker up → check frontend logs | Angular app compiled successfully, serving on port 4200 | | ☐ Pass ☐ Fail | |
| **Database Connection** | Docker up → check database logs | Database connected, migrations applied | | ☐ Pass ☐ Fail | |
| **Access Frontend** | Open browser → `http://localhost:4200` | Frontend loads successfully | | ☐ Pass ☐ Fail | |
| **Access Backend** | Curl/Postman → `http://localhost:3000/api/v1/health` or similar | Backend responds with 200 | | ☐ Pass ☐ Fail | |
| **Docker Down** | Run `docker-compose down` | All containers stop gracefully | | ☐ Pass ☐ Fail | |

---

## 7. BUG TRACKING & ISSUES

### Issues Found:

| Bug ID | Description | Severity | Owner | Status | Resolution |
|--------|-------------|----------|-------|--------|------------|
| W2-001 | | 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low | Khawa / Islam / Amsyar | ☐ Open ☐ Fixed ☐ Verified | |
| W2-002 | | 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low | | ☐ Open ☐ Fixed ☐ Verified | |
| W2-003 | | 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low | | ☐ Open ☐ Fixed ☐ Verified | |

---

## 8. TEST SUMMARY

### Coverage by Component:

| Component | Total Tests | Passed | Failed | Skipped | Coverage % |
|-----------|------------|--------|--------|---------|-----------|
| S3 Integration | 13 | | | | |
| Backend API | 27 | | | | |
| Landlord Frontend | 32 | | | | |
| Tenant Frontend | 18 | | | | |
| E2E Workflows | 12 | | | | |
| Database | 5 | | | | |
| Error Handling | 5 | | | | |
| UI/UX | 7 | | | | |
| Docker | 8 | | | | |
| **TOTAL** | **127** | | | | |

---

### Overall Test Status:

- **🟢 All Tests Passed** - Ready for production
- **🟡 Some Tests Failed** - Fix issues before deployment
- **🔴 Critical Issues** - Do not deploy

---

## 9. SIGN-OFF

| Role | Name | Date | Signature |
|------|------|------|-----------|
| **Tester** | _________________ | __________ | _________________ |
| **Backend Lead (Khawa)** | _________________ | __________ | _________________ |
| **Frontend Lead (Islam)** | _________________ | __________ | _________________ |
| **Full-Stack (Amsyar)** | _________________ | __________ | _________________ |

---

## 10. NOTES FOR TEAM

- Complete all test cases by **Sunday EOD**
- Mark ☐ Pass or ☐ Fail for each test
- Document any bugs found in Section 7
- Use Postman/Insomnia for API tests (collection: `api_test.json`)
- Test locally first via Docker Compose
- Check browser console for JavaScript errors
- Test on multiple screen sizes (mobile, tablet, desktop)
- Ensure all Material UI components are consistent

**Report Version:** 1.0  
**Last Updated:** 2025-11-29  
**Test Period:** Week 2 (Mon-Sun)
