# Ethiopian Restaurant Menu & Ordering App

Customer-first full-stack ordering app tailored for Ethiopian restaurant service.

## What Changed

The current frontend now focuses on the customer journey described in the SRS:

- Home screen with Amharic-first UX
- Ethiopian menu categories and dish metadata
- Cash-first checkout with Telebirr plus additional local payment labels
- Offline-friendly menu browsing
- Queued order sync when connectivity returns
- Local order history for reopening tracking and payment
- PWA shell with service worker registration and install manifest

The backend schema is intentionally kept stable to avoid risky database breakage during this upgrade. The API still supports the existing order/payment flow while the client now behaves more like the Ethiopia-optimized product spec.

## Stack

- Frontend: React + Vite + Tailwind + Zustand + Socket.IO client
- Backend: Express + Prisma + Socket.IO
- Database: MySQL / MariaDB via Prisma

## Project Structure

```txt
client/   Customer PWA frontend
server/   Express API + Prisma
```

## Local Setup

### Backend

```bash
cd server
npm install
copy .env.example .env
npm run prisma:generate
npx prisma migrate dev
npm run seed
npm run dev
```

Notes:

- `postinstall` now runs `prisma generate` automatically.
- `npm run seed` now inserts Ethiopian sample categories and dishes.
- Running the seed script clears existing demo menu/order/payment data first.

### Frontend

```bash
cd client
npm install
copy .env.example .env
npm run dev
```

## Main Customer Flow

1. Open the app from `/` or a `/table/:tableNum` QR link.
2. Browse localized menu categories.
3. Toggle low-data mode or fasting-first filtering.
4. Add items to the cart.
5. Checkout with cash, Telebirr, or another local payment label.
6. If offline, the order is queued locally and syncs automatically later.
7. Reopen tracking or payment from the Orders screen.

## Main API Endpoints

Menu:

- `GET /api/menu`
- `GET /api/menu/categories`

Orders:

- `POST /api/orders`
- `GET /api/orders/:id`

Payments:

- `POST /api/payments/initiate`
- `POST /api/payments/mock/complete`
- `GET /api/payments/tx/:txRef`

Health:

- `GET /api/health`

## Current Gaps vs Full SRS

The current implementation moves strongly toward the SRS, but a few production-market items are still future work:

- Real Telebirr / M-Pesa / CBE Birr gateway integrations
- SMS fallback notifications
- Ethiopian calendar formatting
- Dedicated restaurant-operations backend separate from the customer app

## Verification

- `client`: `npm run build`
- `server`: `npm run dev` and `GET /api/health`
