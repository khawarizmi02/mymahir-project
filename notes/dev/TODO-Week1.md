Absolutely! Here’s a **detailed, actionable, and team-ready TODO list for Week 1** of your **House Rental Management System MVP**.

---

## WEEK 1: PROJECT SETUP + AUTH (EMAIL PIN)
**Goal:** Fully working **Email PIN Authentication** + **Project Foundations**  
**Duration:** 7 days (Mon–Sun)  
**Team:** 3 Developers  
**Deliverable by Sunday:**  
> Users can **request a PIN → receive email → verify PIN → log in**  
> Repo is **Dockerized**, **CI/CD ready**, and **deployable**

---

## TEAM ROLES (Week 1)

| Dev | Focus |
|-----|-------|
| **Dev 1 (Backend Lead)** | Express server, Prisma, Auth API, Docker |
| **Dev 2 (Frontend Lead)** | Angular setup, Auth UI, HTTP service |
| **Dev 3 (Ops / Full-Stack)** | Email (Nodemailer), S3 bucket, CI/CD, Docker Compose |

---

## DAILY TODO LIST (Monday → Sunday)

---

### MONDAY: Project Init & Repo Setup
| Task | Owner | Details |
|------|-------|-------|
| Create GitHub repo: `rental-mvp-2025` | All | Private or public? → Use **main + develop** branches |
| Add `.gitignore` (Node + Angular) | Dev 1 | [Use this template](https://github.com/github/gitignore/blob/main/Node.gitignore) |
| Create folder structure | All |  

```bash
rental-mvp-2025/
├── client/
├── notes/
├── server/
├── docker-compose.yml
└── README.md
``` 

#### Initialize server (`server/`) | Dev 1  

```bash
cd server
npm init -y
npm install express typescript ts-node-dev prisma @prisma/client bcrypt jsonwebtoken cors helmet express-rate-limit
npm install -D @types/express @types/node
npx tsc --init
```

#### Initialize client (`client/`) | Dev 2   

```bash
ng new client --routing --style=scss --strict
cd client
ng add @angular/material
ng add @angular/pwa
``` 

#### Add `README.md` with: | Dev 3 
> Project overview, setup steps, env example 

**Milestone:** Repo live, server/client initialized

---

### TUESDAY: Database + Prisma Setup
| Task | Owner | Details |
|------|-------|-------|
| Spin up **MariaDB** locally | Dev 3 | Use `docker-compose.yml`  

```yaml
services:
  db:
    image: mariadb:10.11
    environment:
      MYSQL_ROOT_PASSWORD: rootpass
      MYSQL_DATABASE: rentaldb
      MYSQL_USER: user
      MYSQL_PASSWORD: pass
    ports: ["3306:3306"]
    volumes: ["db_data:/var/lib/mysql"]
volumes:
  db_data:
``` 

#### Add Prisma schema | Dev 1 | Copy from `main-idea.md` → `server/prisma/schema.prisma`  

```bash
npx prisma init
```
#### Run first migration | Dev 1 |  
```bash
npx prisma migrate dev --name init
npx prisma generate
```

#### Test DB connection | Dev 1 | Create `prisma.ts`  
```ts
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  const users = await prisma.user.findMany();
  console.log(users);
}
test();
```
#### Add `.env` (server) | Dev 1 |  
```env
DATABASE_URL="mysql://user:pass@localhost:3306/rentaldb"
JWT_SECRET=supersecretkey_change_in_prod
PORT=4000
```

**Milestone:** DB up, Prisma working, first migration done

---

### WEDNESDAY: Server + Auth API Skeleton
| Task | Owner | Details |
|------|-------|-------|
| Setup Express server | Dev 1 | `src/server.ts`  

```ts
import express from 'express';
const app = express();
app.use(express.json());
app.listen(4000, () => console.log('Server on 4000'));
```
#### Add middleware: CORS, helmet, rate-limit | Dev 1 |  
```ts
app.use(cors({ origin: 'http://localhost:4200' }));
app.use(helmet());
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
``` 
#### Create auth routes | Dev 1 | `src/routes/auth.routes.ts`  
```ts
router.post('/pin/request', requestPin);
router.post('/pin/verify', verifyPin);
```
#### Create `User` service | Dev 1 | Functions:  
- `findUserByEmail()`  
- `createUser()`  
- `updatePinHash()`  
- `clearPin()`

#### Generate JWT on login | Dev 1 |  
```ts
import jwt from 'jsonwebtoken';
const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
```

**Milestone:** API skeleton ready, `/api/auth/pin/request` returns 200

---

### THURSDAY: Email PIN Flow (Backend)
| Task | Owner | Details |
|------|-------|-------|
| Setup Nodemailer | Dev 3 | Use **Ethereal** (fake SMTP for dev)  

```ts
npm install nodemailer
```  
→ Get test account: https://ethereal.email/create |
| Implement `requestPin` | Dev 1 |  

```ts
// 1. Generate 6-digit PIN
const pin = Math.floor(100000 + Math.random() * 900000).toString();
// 2. Hash with bcrypt
const hash = await bcrypt.hash(pin, 10);
// 3. Save to user: emailPinHash, emailPinExpiry = now + 10min
// 4. Send email via Nodemailer
``` 
#### Implement `verifyPin` | Dev 1 |  

```ts
// 1. Find user by email
// 2. Compare PIN with hash
// 3. Check expiry
// 4. Clear PIN fields
// 5. Return JWT + user role
```
#### Add rate limiting per email | Dev 1 | Use `express-rate-limit` + memory store or Redis later |
| Test with Postman | Dev 1 |  
→ `POST /api/auth/pin/request` → email received  
→ `POST /api/auth/pin/verify` → JWT returned |

**Milestone:** Full PIN flow works end-to-end (backend only)

---

### FRIDAY: Frontend Auth UI + HTTP Service
| Task | Owner | Details |
|------|-------|-------|
| Create `AuthService` | Dev 2 | `auth.service.ts`  

```ts
requestPin(email: string)
verifyPin(email: string, pin: string): Observable<{ token: string, user: User }>
```

| Create `HttpInterceptor` | Dev 2 | Add JWT to headers after login |
| Build **PIN Request Form** | Dev 2 | `pin-request.component`  
→ Email input → "Send PIN" → success message |
| Build **PIN Verify Form** | Dev 2 | `pin-verify.component`  
→ Email + 6-digit input → "Login" → redirect to dashboard |
| Store JWT in `localStorage` | Dev 2 |  

```ts
localStorage.setItem('token', token);
```
#### Add route guard | Dev 2 | `AuthGuard` → protect `/dashboard` |

**Milestone:** Frontend can request/verify PIN and stay logged in

---

### SATURDAY: Connect Client + Server
| Task | Owner | Details |
|------|-------|-------|
| Setup proxy (dev) | Dev 2 | `frontend/proxy.conf.json`  

```json
{
  "/api": {
    "target": "http://localhost:4000",
    "secure": false
  }
}
``` 

→ `ng serve --proxy-config proxy.conf.json` |
| Test full login flow | All |  
1. Enter email → PIN sent  
2. Check Ethereal → copy PIN  
3. Enter PIN → redirect to dashboard  
4. JWT in dev tools |
| Add basic dashboard | Dev 2 | `dashboard.component` with "Welcome, [Role]" |
| Add role-based routing | Dev 2 |  
→ `/landlord/*` → only if `role === 'LANDLORD'` |

**Milestone:** **Full login works in browser**

---

### SUNDAY: Docker + CI/CD + Deployment Prep
| Task | Owner | Details |
|------|-------|-------|
| Dockerize server | Dev 3 | `server/Dockerfile`  

```dockerfile
FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
CMD ["npm", "run", "dev"]
``` 
#### Update `docker-compose.yml` | Dev 3 |  

```yaml
services:
  server:
    build: ./server
    ports: ["4000:4000"]
    environment:
      DATABASE_URL: "mysql://user:pass@db:3306/rentaldb"
    depends_on: [db]
  frontend:
    image: node:24-alpine
    working_dir: /app
    volumes: ['./frontend:/app']
    ports: ['4200:4200']
    command: npm start
  db: ...
```
#### Test locally | All |  

```bash
docker-compose up --build
``` 

→ login works |
| Setup GitHub Actions | Dev 3 | `.github/workflows/deploy.yml`  
→ On push to `main` → build + deploy to **Railway** or **Fly.io** |
| Create Railway project | Dev 3 | Add MariaDB plugin + link GitHub repo |
| Add env vars in Railway | Dev 3 | `DATABASE_URL`, `JWT_SECRET` |

**Milestone:** App runs in Docker, ready for CI/CD

---

## WEEK 1 DELIVERABLES (By Sunday Night)

| Deliverable | Status |
|-----------|--------|
| GitHub repo with `main` + `develop` | Done |
| Docker Compose: DB + Server + Client | Done |
| Email PIN login (full flow) | Done |
| JWT auth + role-based routing | Done |
| App running locally via `docker-compose` | Done |
| CI/CD pipeline ready (Railway) | Done |
| Demo video (30 sec): login flow | Done |

---

## TOOLS TO USE

| Tool | Purpose |
|------|-------|
| **Ethereal.email** | Fake SMTP for dev |
| **Postman** | Test API |
| **ngrok** | Test webhook later |
| **Railway.app** | Deploy (free tier) |
| **GitHub Actions** | CI/CD |

---

<!-- ## PRO TIPS

- Use **Prisma Studio** to inspect DB: `npx prisma studio`
- Log PIN in console during dev (remove later)
- Use **Angular Material** `MatSnackBar` for success/error
- Commit **every day** with clear messages

---

**You’re now UNBLOCKED for Week 1.**

Want me to:
- Generate the **GitHub repo template**?
- Write the **Postman collection**?
- Create **Figma login wireframe**?

Just say the word — let’s **ship this MVP**. -->