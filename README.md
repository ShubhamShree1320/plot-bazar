# PlotBazaar — Real Estate Plot Listing Platform

A full-stack real estate plot listing platform built with **Next.js 14+ (App Router)**, TypeScript, PostgreSQL/Prisma, OTP-based auth, Razorpay payments, and interactive maps.

---

## Features

- **OTP Authentication** — Email (Nodemailer/Resend) + SMS (Twilio), no passwords
- **Plot Listings** — Add, search, filter plots with image upload and coordinate tagging
- **Paywall** — First 3 listings free; ₹200 via Razorpay for additional listings
- **Token Payment** — Buyers pay a token (set by admin) to reveal seller contact
- **Seller Feedback Loop** — Auto-email 48h after contact reveal; 3 negative reports = auto-block
- **Map View** — Leaflet + OpenStreetMap with clustered markers synced with listing sidebar
- **Admin Panel** — Full dashboard: stats, user management, plot approvals, payment logs, settings
- **Image Coordinate Tagger** — Click images to place pins with labels

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Database | PostgreSQL + Prisma ORM |
| Auth | Custom OTP + JWT (httpOnly cookies) |
| Email | Nodemailer + Resend SMTP |
| SMS | Twilio |
| Payments | Razorpay |
| Storage | AWS S3 |
| Maps | Leaflet + OpenStreetMap |
| Styling | Tailwind CSS |
| Charts | Recharts |
| State | Zustand |

---

## Quick Start

### 1. Clone and install

```bash
git clone <repo-url>
cd real-state
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in all required values in `.env.local`:

- `DATABASE_URL` — PostgreSQL connection string (Supabase/Neon/PlanetScale)
- `JWT_SECRET` — Random 64+ char string
- `RESEND_API_KEY` or SMTP credentials — For OTP emails
- `TWILIO_*` — For OTP SMS
- `RAZORPAY_*` — Payment gateway
- `AWS_*` — S3 image storage
- `NEXT_PUBLIC_APP_URL` — Your domain (e.g., `https://plotbazaar.in`)

### 3. Set up database

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed with sample data (2 admins, 5 users, 10 plots)
npm run db:seed
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Database Management

```bash
npm run db:studio    # Open Prisma Studio (visual DB editor)
npm run db:push      # Push schema without migration (development)
npm run db:migrate   # Create and run migration
```

---

## Project Structure

```
app/
  (public)/           Homepage, search, plot detail, feedback
  (auth)/             Login, register, verify OTP
  (dashboard)/        User dashboard, new plot form
  (admin)/            Full admin panel
  api/                All API routes

components/
  auth/               OTPInput
  plots/              PlotCard, PlotImageWithPins, ImageUploader, CoordinateTagger
  map/                MapView (Leaflet)
  admin/              AdminTable, AdminSidebar
  ui/                 SearchBar, PaymentModal, Navbar, BlockBanner

lib/                  prisma, jwt, otp, email, sms, s3, razorpay, api-response
store/                Zustand auth store
types/                TypeScript type definitions
prisma/
  schema.prisma       Full schema with all models
  seed.ts             Sample data seeder
```

---

## API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register with email/phone |
| POST | `/api/auth/verify-otp` | Verify OTP and get JWT cookie |
| POST | `/api/auth/login` | Login (sends new OTP) |
| POST | `/api/auth/logout` | Clear auth cookie |
| GET | `/api/auth/me` | Get current user |

### Plots
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/plots` | Search/filter active plots |
| POST | `/api/plots` | Create plot (paywall at 3 free) |
| GET | `/api/plots/:id` | Get plot with images |
| PUT | `/api/plots/:id` | Update plot (owner/admin) |
| DELETE | `/api/plots/:id` | Soft-delete plot |
| POST | `/api/plots/:id/images` | Upload image with coordinates |
| GET | `/api/plots/:id/seller-contact` | Reveal seller contact |
| POST | `/api/plots/confirm-payment` | Confirm listing fee payment |

### Payments
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/token-payment/create-order` | Create Razorpay order for token |
| POST | `/api/token-payment/verify` | Verify payment + unlock contact |
| POST | `/api/webhooks/razorpay` | Razorpay webhook handler |

### Feedback
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/feedback/:token` | Get feedback form data |
| POST | `/api/feedback/:token` | Submit seller feedback |

### Admin (require ADMIN role)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/admin/users` | List users |
| PUT | `/api/admin/users/:id` | Update user role |
| POST | `/api/admin/users/:id/block` | Block user |
| POST | `/api/admin/users/:id/unblock` | Unblock user |
| GET | `/api/admin/plots` | List all plots |
| POST | `/api/admin/plots/:id/approve` | Approve/reject plot |
| PUT | `/api/admin/plots/:id/token` | Set token amount |
| GET | `/api/admin/payments` | Payment logs |
| GET | `/api/admin/feedback` | Feedback logs |
| GET | `/api/admin/block-logs` | Block history |
| GET/PUT | `/api/admin/settings` | Platform settings |

---

## Deployment on Vercel + Supabase

### 1. Set up Supabase

1. Create project at supabase.com
2. Copy the connection string from Project Settings → Database → Connection string (URI mode)
3. Use the pooler URL for serverless

### 2. Deploy to Vercel

```bash
npx vercel
```

Add all environment variables from `.env.example` in the Vercel dashboard.

### 3. Run migrations on production

```bash
DATABASE_URL="your-prod-url" npx prisma migrate deploy
DATABASE_URL="your-prod-url" npm run db:seed
```

### 4. Configure Razorpay Webhook

In Razorpay Dashboard → Webhooks:
- URL: `https://your-domain.com/api/webhooks/razorpay`
- Events: `payment.captured`, `payment.failed`
- Copy the webhook secret to `RAZORPAY_WEBHOOK_SECRET`

---

## Security Notes

- OTPs are **bcrypt-hashed** before storage
- JWTs are stored in **httpOnly cookies** (not localStorage)
- Failed OTP attempts: locked for 15 minutes after 3 failures
- Blocked users receive 403 on all protected operations
- Razorpay payments verified via HMAC-SHA256 signature
- API routes return consistent `{ success, data?, error? }` shapes

---

## Seed Data

After running `npm run db:seed`:

| Type | Email | Role |
|---|---|---|
| Admin | admin@plotbazaar.in | ADMIN |
| Admin | superadmin@plotbazaar.in | ADMIN |
| Seller | seller1@example.com | USER |
| Seller | seller2@example.com | USER |
| Buyer | buyer1@example.com | USER |

All logins use OTP. In development, check your terminal/email for OTP codes.

---

## License

MIT
