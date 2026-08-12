# E-commerce Mini Platform — Backend

## Day 1 deliverable
- Prisma schema (User, Category, Product, Order, OrderItem) with proper relations & indexes
- Auth: register / login with bcrypt password hashing + JWT
- Middleware: `requireAuth` (validates JWT), `requireAdmin` (role check), centralized error handler
- Zod validation on all input

## Setup (run these on your own machine)

1. Install dependencies (already done if you unzip this as-is):
   ```
   npm install
   ```

2. Get a free PostgreSQL database. Fastest options:
   - [Supabase](https://supabase.com) — free tier, gives you a connection string instantly
   - [Neon](https://neon.tech) — same idea, serverless Postgres
   - Or run Postgres locally / via Docker

3. Copy `.env.example` to `.env` and fill in your real `DATABASE_URL` and a random `JWT_SECRET`:
   ```
   cp .env.example .env
   ```

4. Generate the Prisma client and run the first migration:
   ```
   npx prisma generate
   npx prisma migrate dev --name init
   ```

5. Start the dev server:
   ```
   npm run dev
   ```

6. Test it:
   ```bash
   # Register
   curl -X POST http://localhost:4000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

   # Login
   curl -X POST http://localhost:4000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'

   # Use the returned token to call a protected route
   curl http://localhost:4000/api/users/me \
     -H "Authorization: Bearer <token_from_login>"
   ```

7. (Optional) Browse your data visually:
   ```
   npx prisma studio
   ```

## Design decisions worth mentioning in interviews
- `OrderItem.priceAtPurchase` is stored separately from `Product.price` — product prices
  can change over time, but past orders must keep the price the customer actually paid.
- Password comparison errors return the same generic message for "user not found" and
  "wrong password" — this avoids leaking which emails are registered.
- Error handling is centralized in one Express middleware so every route returns a
  consistent JSON error shape instead of ad-hoc try/catch messages.

## Next up (Day 2)
Product CRUD API + Product listing UI.
