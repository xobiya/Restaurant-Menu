# Restaurant Menu & Ordering App

Production-focused full-stack web app for a single restaurant:
- Customer flow: QR table link -> menu -> cart -> checkout -> order tracking
- Admin flow: login -> menu CRUD -> real-time order control -> payment monitoring -> QR generation

Stack:
- Frontend: React + Vite + Tailwind + Zustand + Socket.IO client
- Backend: Express + Prisma + Socket.IO
- Database: MySQL (Prisma datasource)

## Core Features Implemented

- Menu display with availability filtering for customers
- Admin menu management (create, update, delete, availability toggle)
- Order creation with item validation and total calculation
- Order status lifecycle: `Pending -> Preparing -> Ready -> Completed`
- ETA calculation from SRS formula:
  - `Total Time = Σ (prep_time × quantity)`
- Payment workflow with provider choice (`Chapa`, `Telebirr`)
- Payment records + webhook handling + order payment status sync
- Mock payment completion endpoint for local/demo testing
- Real-time order updates via Socket.IO
- Table entity support and QR code generation per table
- Admin JWT authentication

## Project Structure

```txt
client/   # React frontend
server/   # Express API + Prisma
```

## Prerequisites

- Node.js 18+
- MySQL 8+

## Backend Setup

1. Go to backend:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` from example:
```bash
copy .env.example .env
```

4. Run migrations and seed:
```bash
npm run prisma:generate
npx prisma migrate dev
npm run seed
```

5. Create admin account:
```bash
npm run create-admin
```

6. Start server:
```bash
npm run dev
```

API runs on `http://localhost:5000` by default.

## Frontend Setup

1. Go to frontend:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` from example:
```bash
copy .env.example .env
```

4. Start frontend:
```bash
npm run dev
```

Frontend runs on `http://localhost:5173` by default.

## Main API Endpoints

Menu:
- `GET /api/menu`
- `GET /api/menu/admin` (auth)
- `POST /api/menu` (auth)
- `PUT /api/menu/:id` (auth)
- `DELETE /api/menu/:id` (auth)

Orders:
- `POST /api/orders`
- `GET /api/orders/:id`
- `GET /api/orders` (auth)
- `PATCH /api/orders/:id/status` (auth)

Payments:
- `POST /api/payments/initiate`
- `POST /api/payments/webhook`
- `POST /api/payments/mock/complete`
- `GET /api/payments` (auth)

Auth:
- `POST /api/auth/login`
- `GET /api/auth/me` (auth)

## Default Admin Credentials (local)

- Username: `admin`
- Password: `admin123`

Change these immediately in production.
