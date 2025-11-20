# WEEK 2: PROPERTIES + TENANCIES + S3 SETUP
**Goal:** Property CRUD (backend & frontend) + S3 image upload + Tenancy model setup  
**Duration:** 7 days (Mon–Sun)  
**Team:** 3 Developers  
**Deliverable by Sunday:**  
> Landlords can **create/edit/delete properties with images** → stored in S3  
> Tenants can **browse vacant properties**  
> Tenancy CRUD API ready (not yet UI)  
> All connected locally via `docker-compose`

---

## TEAM ROLES (Week 2)

| Dev | Focus |
|-----|-------|
| **Khawa (Backend Lead)** | Property API, S3 multipart upload, Tenancy API, Prisma migrations |
| **Amsyar (Full-Stack)** | S3 service setup, property frontend components (40% backend support) |
| **Islam (Frontend Lead)** | Property list/detail/form components, Material UI, property browsing |

---

## DAILY TODO LIST (Monday → Sunday)

---

### MONDAY: S3 Setup + Backend Architecture

| Task | Owner | Details |
|------|-------|-------|
| **AWS S3 bucket setup** | Amsyar | Create S3 bucket (e.g., `mymahir-rentals`), configure CORS |
| **S3 IAM credentials** | Amsyar | Create IAM user with S3 upload permissions; add to `.env` |
| **Add AWS SDK to backend** | Khawa | `npm install @aws-sdk/client-s3` |
| **Create `S3Service`** | Khawa | `server/src/services/s3.service.ts`  

```ts
export class S3Service {
  async uploadPropertyImage(file: Buffer, filename: string): Promise<string>
  async deletePropertyImage(key: string): Promise<void>
}
```

| **Add multer middleware** | Khawa | `npm install multer` → create upload middleware in `server/src/middleware/upload.ts` |
| **Update `.env`** | Amsyar | Add AWS credentials:

```env
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-southeast-1
AWS_S3_BUCKET=mymahir-rentals
```

| **Test S3 upload locally** | Khawa | Create test endpoint `/api/v1/test/upload` and verify file appears in S3 |

**Milestone:** S3 credentials working, test upload successful

---

### TUESDAY: Property Model + Database Migrations

| Task | Owner | Details |
|------|-------|-------|
| **Review Prisma schema** | Khawa | Verify `Property` + `PropertyImage` models from PRD |
| **Create Prisma migration** | Khawa |  

```bash
npx prisma migrate dev --name add_properties
npx prisma generate
```

| **Create `PropertyImage` relation** | Khawa | Ensure `propertyId` FK and cascade delete |
| **Update User model** | Khawa | Verify `properties` relation for landlord |
| **Test schema with Prisma Studio** | Khawa | `npx prisma studio` → verify tables created |
| **Add database constraints** | Khawa | Ensure:  
- `monthlyRent` > 0  
- `status` enum (VACANT | OCCUPIED)  
- `address` not null |

**Milestone:** DB schema ready, no migrations errors

---

### WEDNESDAY: Property API (Backend)

| Task | Owner | Details |
|------|-------|-------|
| **Create Property service** | Khawa | `server/src/services/property.service.ts`

```ts
async createProperty(data: CreatePropertyDTO, landlordId: number)
async getPropertyById(id: number)
async getPropertiesByLandlord(landlordId: number)
async getVacantProperties() // for tenants
async updateProperty(id: number, data: UpdatePropertyDTO, landlordId: number)
async deleteProperty(id: number, landlordId: number)
async updatePropertyStatus(propertyId: number, status: PropertyStatus)
```

| **Create Property controller** | Khawa | `server/src/controller/property.controller.ts`  

```ts
POST /api/v1/properties → createProperty()
GET /api/v1/properties → getProperties (with filters)
GET /api/v1/properties/:id → getPropertyById()
PUT /api/v1/properties/:id → updateProperty()
DELETE /api/v1/properties/:id → deleteProperty()
GET /api/v1/properties/vacant → getVacantProperties() // for tenants
```

| **Create Property routes** | Khawa | `server/src/router/v1/property.route.ts` |
| **Add property image upload endpoint** | Khawa |  

```ts
POST /api/v1/properties/:id/images
→ multer middleware → S3 upload → save URL in DB
```

| **Add authorization checks** | Khawa | Only landlord can create/edit/delete their own properties |
| **Test with Postman** | Khawa | Create property, upload image, verify in S3 |

**Milestone:** All property API endpoints working

---

### THURSDAY: Frontend - Property Services + Models

| Task | Owner | Details |
|------|-------|-------|
| **Create Property model** | Islam | `client/src/app/models/property.model.ts`

```ts
export interface Property {
  id: number;
  landlordId: number;
  title: string;
  description?: string;
  address: string;
  monthlyRent: number;
  status: 'VACANT' | 'OCCUPIED';
  images: PropertyImage[];
  createdAt: Date;
}
```

| **Create PropertyService** | Islam | `client/src/app/services/property.service.ts`

```ts
getProperties(): Observable<Property[]>
getPropertyById(id: number): Observable<Property>
getVacantProperties(): Observable<Property[]>
createProperty(data: FormData): Observable<Property>
updateProperty(id: number, data: FormData): Observable<Property>
deleteProperty(id: number): Observable<void>
uploadPropertyImage(propertyId: number, file: File): Observable<{ url: string }>
```

| **Setup API service with correct base URL** | Islam | Ensure `PropertyService` uses `ApiService` with proxy to backend |
| **Test API calls in browser console** | Islam | Verify all endpoints return data from backend |

**Milestone:** Frontend can communicate with backend property API

---

### FRIDAY: Frontend - Property Components (Landlord)

| Task | Owner | Details |
|------|-------|-------|
| **Create Property List component** | Islam | `client/src/app/landlord/property-list/property-list.component.ts`

- Display landlord's properties in Material table/cards
- Show status (VACANT/OCCUPIED)
- Add buttons: Edit, Delete, View Details, Upload Image

| **Create Property Form component** | Islam | `client/src/app/landlord/property-form/property-form.component.ts`

- Fields: title, description, address, monthlyRent
- Image upload (multiple files, max 3)
- Submit → create/update property

| **Create Property Detail component** | Islam | `client/src/app/landlord/property-detail/property-detail.component.ts`

- Show full property info + all images
- Edit & delete buttons

| **Add Material components** | Islam | Use:
- `MatTable` for property list
- `MatCard` for property details
- `MatForm` for property form
- `MatButton`, `MatIcon` for actions
- `MatSnackBar` for success/error messages

| **Add image preview** | Islam | Show uploaded images before/after submit |
| **Add form validation** | Islam | Ensure required fields + rent > 0 |

**Milestone:** Landlord can create/view/edit/delete properties with images

---

### SATURDAY: Frontend - Tenant Property Browsing

| Task | Owner | Details |
|------|-------|-------|
| **Create Vacant Properties component** | Islam | `client/src/app/tenant/vacant-properties/vacant-properties.component.ts`

- Display all VACANT properties in Material cards/grid
- Show: title, address, monthlyRent, images
- Add "View Details" button

| **Create Property Detail component (Tenant)** | Islam | `client/src/app/tenant/property-detail/property-detail.component.ts`

- Show property info + all images
- Landlord contact info (if available)

| **Add search/filter** | Islam | Filter by:
- Price range
- Location/address
- (Optional: pagination)

| **Ensure responsive layout** | Islam | Mobile-friendly property cards using CSS Grid/Flexbox |
| **Add Material Pagination (optional)** | Islam | If many properties, add pagination |

**Milestone:** Tenants can browse and view vacant properties

---

### SUNDAY: Integration + Deployment Prep

| Task | Owner | Details |
|------|-------|-------|
| **Full end-to-end test** | All | 

1. Landlord login → create property → upload image
2. Check S3 bucket → image exists
3. Tenant login → browse properties → see image
4. All Material UI working

| **Update Docker Compose** | Khawa | Ensure all services running without errors:

```bash
docker-compose up --build
```

| **Fix any bugs** | All | Test locally, fix issues |
| **Update Git** | All | 

```bash
git add .
git commit -m "Week 2: Properties CRUD + S3 upload + Tenant browsing"
git push origin develop
```

| **Prepare Tenancy API skeleton** | Khawa | Create routes (not implementation yet):

```ts
POST /api/v1/tenancies
GET /api/v1/tenancies/:id
GET /api/v1/tenancies?landlordId=...&tenantId=...
```

**Milestone:** Complete property management working end-to-end

---

## WEEK 2 DELIVERABLES (By Sunday Night)

| Deliverable | Status |
|-----------|--------|
| S3 bucket configured + IAM credentials | Done |
| Property CRUD API (all endpoints) | Done |
| Property image upload → S3 | Done |
| Landlord dashboard: list/create/edit/delete properties | Done |
| Tenant browsing: view all vacant properties | Done |
| Material UI implemented for all property components | Done |
| Full local testing via Docker Compose | Done |
| All code pushed to `develop` branch | Done |

---

## NOTES FOR DEVELOPERS

- **Khawa**: Focus on API stability. Test every endpoint with Postman before Islam integrates.
- **Islam**: Use Material Design consistently. Keep components modular for reuse.
- **Amsyar**: Bridge S3 + frontend. Test image uploads thoroughly.
- **Git**: Commit daily with clear messages. Don't let conflicts pile up.
- **Backup**: Test S3 deletion logic (cascade) before deleting properties in production.
