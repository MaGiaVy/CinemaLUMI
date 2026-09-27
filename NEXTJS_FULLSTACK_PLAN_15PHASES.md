# NEXT.JS FULL STACK PLAN - LUMI CINEMA

## App Router + Prisma + NextAuth.js + PostgreSQL

---

## TÓTA CÁC THÔNG SỐ ĐÃ XÁC ĐỊNH

| Aspect           | Decision                                        |
| ---------------- | ----------------------------------------------- |
| **Framework**    | Next.js (App Router)                            |
| **Architecture** | Full Stack: Client Components + API Routes      |
| **Database**     | PostgreSQL local + Prisma ORM                   |
| **Auth**         | NextAuth.js (email/password)                    |
| **File Upload**  | Backend route handler → Cloudinary → direct URL |
| **Deployment**   | Vercel                                          |
| **Cron Jobs**    | Vercel Cron (call `/api/cron/release-seats`)    |
| **API Response** | Consistent format: `{ success, data, message }` |
| **Prisma**       | Global instance (`lib/prisma.ts`)               |
| **Timestamps**   | `created_at`, `updated_at` trên mọi bảng        |
| **Soft Delete**  | ❌ Không cần                                    |

---

## PROJECT STRUCTURE

```
lumi-cinema/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   │
│   ├── (customer)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                     # Home / Movie Schedule
│   │   ├── movies/
│   │   │   ├── page.tsx                 # Movie list + filters
│   │   │   └── [id]/
│   │   │       ├── page.tsx             # Movie details + reviews
│   │   │       └── reviews/
│   │   │           └── page.tsx         # Add review
│   │   ├── screenings/
│   │   │   └── [id]/
│   │   │       ├── page.tsx             # Screening details
│   │   │       ├── seats/
│   │   │       │   └── page.tsx         # Seat selection map
│   │   │       ├── checkout/
│   │   │       │   ├── page.tsx         # Ticket type + Voucher
│   │   │       │   ├── combo/
│   │   │       │   │   └── page.tsx     # Combo selection
│   │   │       │   └── payment/
│   │   │       │       └── page.tsx     # Payment summary + QR
│   │   ├── tickets/
│   │   │   ├── page.tsx                 # My tickets list
│   │   │   └── [id]/
│   │   │       ├── page.tsx             # Ticket details + QR
│   │   │       └── cancel/
│   │   │           └── page.tsx         # Cancel confirmation
│   │   └── profile/
│   │       └── page.tsx                 # User profile
│   │
│   ├── (staff)/
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx                 # Staff dashboard
│   │   └── tickets/
│   │       ├── search/
│   │       │   └── page.tsx             # Search customer tickets
│   │       └── [id]/
│   │           └── cancel/
│   │               └── page.tsx         # Cancel + issue voucher
│   │
│   ├── (admin)/
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx                 # Admin dashboard
│   │   ├── movies/
│   │   │   ├── page.tsx                 # Movie management
│   │   │   ├── add/
│   │   │   │   └── page.tsx             # Add movie form
│   │   │   └── [id]/
│   │   │       ├── page.tsx             # Movie details
│   │   │       └── edit/
│   │   │           └── page.tsx         # Edit movie form
│   │   ├── screenings/
│   │   │   ├── page.tsx                 # Screening management
│   │   │   └── add/
│   │   │       └── page.tsx             # Add screening form
│   │   ├── pricing/
│   │   │   └── page.tsx                 # Pricing config
│   │   ├── coupons/
│   │   │   ├── page.tsx                 # Coupon management
│   │   │   └── add/
│   │   │       └── page.tsx             # Add coupon form
│   │   ├── combos/
│   │   │   ├── page.tsx                 # Combo management
│   │   │   └── add/
│   │   │       └── page.tsx             # Add combo form
│   │   ├── reports/
│   │   │   ├── page.tsx                 # Revenue reports
│   │   │   ├── revenue/
│   │   │   │   └── page.tsx
│   │   │   ├── movies/
│   │   │   │   └── page.tsx
│   │   │   └── export/
│   │   │       └── page.tsx
│   │   └── reviews/
│   │       └── page.tsx                 # Review moderation
│   │
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/
│   │   │   │   └── route.ts             # NextAuth config
│   │   │   ├── signup/
│   │   │   │   └── route.ts             # User registration
│   │   │   └── profile/
│   │   │       └── route.ts             # Get user profile
│   │   │
│   │   ├── movies/
│   │   │   ├── route.ts                 # GET/POST movies
│   │   │   ├── [id]/
│   │   │   │   └── route.ts             # GET/PUT/DELETE movie
│   │   │   └── upload/
│   │   │       └── route.ts             # Upload poster to Cloudinary
│   │   │
│   │   ├── screenings/
│   │   │   ├── route.ts                 # GET/POST screenings
│   │   │   └── [id]/
│   │   │       └── route.ts             # GET/PUT/DELETE screening
│   │   │
│   │   ├── seats/
│   │   │   ├── route.ts                 # GET seats (with Lazy Eval)
│   │   │   ├── reserve/
│   │   │   │   └── route.ts             # POST reserve seats
│   │   │   └── release/
│   │   │       └── route.ts             # POST release seats
│   │   │
│   │   ├── pricing/
│   │   │   ├── route.ts                 # GET/PUT pricing
│   │   │   └── calculate/
│   │   │       └── route.ts             # Calculate ticket price
│   │   │
│   │   ├── coupons/
│   │   │   ├── route.ts                 # GET/POST coupons
│   │   │   ├── validate/
│   │   │   │   └── route.ts             # POST validate coupon
│   │   │   ├── [id]/
│   │   │   │   └── route.ts             # GET/PUT/DELETE coupon
│   │   │   └── issue-voucher/
│   │   │       └── route.ts             # POST issue voucher (internal)
│   │   │
│   │   ├── combos/
│   │   │   ├── route.ts                 # GET/POST combos
│   │   │   ├── [id]/
│   │   │   │   └── route.ts             # GET/PUT/DELETE combo
│   │   │   ├── reserve/
│   │   │   │   └── route.ts             # POST reserve combo stock
│   │   │   └── release/
│   │   │       └── route.ts             # POST release combo stock
│   │   │
│   │   ├── payments/
│   │   │   ├── route.ts                 # GET payments
│   │   │   ├── initiate/
│   │   │   │   └── route.ts             # POST initiate payment
│   │   │   ├── [id]/
│   │   │   │   └── route.ts             # GET payment status
│   │   │   ├── vnpay-return/
│   │   │   │   └── route.ts             # GET VNPay return callback
│   │   │   └── vnpay-ipn/
│   │   │       └── route.ts             # GET VNPay IPN webhook
│   │   │
│   │   ├── tickets/
│   │   │   ├── route.ts                 # GET my tickets
│   │   │   ├── [id]/
│   │   │   │   ├── route.ts             # GET ticket details
│   │   │   │   ├── cancel/
│   │   │   │   │   └── route.ts         # DELETE cancel ticket
│   │   │   │   ├── mark-used/
│   │   │   │   │   └── route.ts         # PATCH mark as used
│   │   │   │   └── qr/
│   │   │   │       └── route.ts         # GET QR code
│   │   │
│   │   ├── reviews/
│   │   │   ├── route.ts                 # GET/POST reviews
│   │   │   ├── [id]/
│   │   │   │   └── route.ts             # GET/DELETE review
│   │   │   └── validate/
│   │   │       └── route.ts             # Check if user can review
│   │   │
│   │   ├── staff/
│   │   │   ├── search/
│   │   │   │   └── route.ts             # GET search tickets
│   │   │   ├── cancel-with-voucher/
│   │   │   │   └── route.ts             # POST cancel + voucher
│   │   │   └── dashboard/
│   │   │       └── route.ts             # GET staff stats
│   │   │
│   │   ├── admin/
│   │   │   ├── dashboard/
│   │   │   │   └── route.ts             # GET dashboard stats
│   │   │   └── reports/
│   │   │       ├── revenue/
│   │   │       │   └── route.ts
│   │   │       ├── movies/
│   │   │       │   └── route.ts
│   │   │       └── export/
│   │   │           └── route.ts
│   │   │
│   │   └── cron/
│   │       ├── release-seats/
│   │       │   └── route.ts             # GET release expired seats
│   │       └── release-combos/
│   │           └── route.ts             # GET release expired combos
│   │
│   ├── layout.tsx                       # Root layout
│   ├── page.tsx                         # Landing page (/ redirect to customer)
│   └── middleware.ts                    # Auth check, role-based routing
│
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── Sidebar.tsx
│   │   └── LayoutWrapper.tsx
│   │
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Loader.tsx
│   │   └── ...
│   │
│   ├── movies/
│   │   ├── MovieCard.tsx
│   │   ├── MovieGrid.tsx
│   │   ├── MovieForm.tsx
│   │   └── MovieDetails.tsx
│   │
│   ├── screenings/
│   │   ├── ScreeningCard.tsx
│   │   ├── ScreeningForm.tsx
│   │   └── ScreeningList.tsx
│   │
│   ├── seats/
│   │   ├── SeatMap.tsx
│   │   ├── SeatSelector.tsx
│   │   └── SeatLegend.tsx
│   │
│   ├── checkout/
│   │   ├── TicketTypeSelector.tsx
│   │   ├── VoucherInput.tsx
│   │   ├── ComboSelector.tsx
│   │   ├── OrderSummary.tsx
│   │   └── PaymentSummary.tsx
│   │
│   ├── tickets/
│   │   ├── TicketCard.tsx
│   │   ├── TicketList.tsx
│   │   ├── QRCodeDisplay.tsx
│   │   └── TicketDetails.tsx
│   │
│   ├── reviews/
│   │   ├── ReviewForm.tsx
│   │   ├── ReviewCard.tsx
│   │   ├── StarRating.tsx
│   │   └── ReviewList.tsx
│   │
│   └── dashboard/
│       ├── StatsCard.tsx
│       ├── Chart.tsx
│       └── ReportTable.tsx
│
├── lib/
│   ├── prisma.ts                        # Global Prisma instance
│   ├── auth.ts                          # NextAuth config + helpers
│   ├── email.ts                         # Nodemailer service
│   ├── cloudinary.ts                    # Cloudinary SDK
│   ├── api-response.ts                  # Consistent response formatter
│   ├── validators.ts                    # Input validation
│   ├── qr-code.ts                       # QR code generator
│   └── utils.ts                         # Helper functions
│
├── hooks/
│   ├── useAuth.ts                       # Auth context hook
│   ├── useApi.ts                        # API fetch wrapper
│   └── ...
│
├── types/
│   ├── index.ts                         # Global types
│   ├── models.ts                        # Prisma model types
│   └── ...
│
├── prisma/
│   ├── schema.prisma                    # Prisma schema
│   └── migrations/
│
├── public/
│   ├── images/
│   └── ...
│
├── .env.local                           # Environment variables (local)
├── .env.example                         # Example env
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts                   # Tailwind CSS (if using)
└── README.md
```

---

## PRISMA SCHEMA (schema.prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  user_id    Int      @id @default(autoincrement())
  email      String   @unique
  password   String
  full_name  String
  phone      String?
  role       Role     @default(CUSTOMER)
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  // Relations
  tickets    Ticket[]
  payments   Payment[]
  coupons    Coupon[]
  reviews    Review[]

  @@map("Users")
}

enum Role {
  CUSTOMER
  STAFF
  ADMIN
}

model Movie {
  movie_id    Int       @id @default(autoincrement())
  title       String    @unique
  genre       String?
  duration    Int       // minutes
  poster      String?   // Cloudinary URL
  description String?
  rating      Decimal?  @db.Decimal(3, 1)
  age_rating  String?
  release_date DateTime?
  end_date    DateTime?
  created_at  DateTime  @default(now())
  updated_at  DateTime  @updatedAt

  // Relations
  screenings  Screening[]
  reviews     Review[]
  coupons     Coupon[]

  @@map("Movies")
}

model Screening {
  screening_id Int      @id @default(autoincrement())
  movie_id     Int
  room_number  Int      // 1-5
  screening_date DateTime
  screening_time DateTime
  base_price   Decimal  @db.Decimal(10, 2)
  status       ScreeningStatus @default(UPCOMING)
  created_at   DateTime @default(now())
  updated_at   DateTime @updatedAt

  // Relations
  movie  Movie  @relation(fields: [movie_id], references: [movie_id], onDelete: Restrict)
  seats  Seat[]
  tickets Ticket[]

  @@map("Screenings")
}

enum ScreeningStatus {
  UPCOMING
  SHOWING
  ENDED
}

model Seat {
  seat_id      Int      @id @default(autoincrement())
  screening_id Int
  seat_number  String   // e.g., "A1", "B2"
  status       SeatStatus @default(EMPTY)
  reserved_until DateTime?
  created_at   DateTime @default(now())
  updated_at   DateTime @updatedAt

  // Relations
  screening Screening @relation(fields: [screening_id], references: [screening_id], onDelete: Cascade)
  tickets   Ticket[]

  @@unique([screening_id, seat_number])
  @@map("Seats")
}

enum SeatStatus {
  EMPTY
  RESERVED
  OCCUPIED
}

model Pricing {
  pricing_id       Int     @id @default(autoincrement())
  ticket_type      String  // e.g., "Thường", "Trẻ em"
  price_percentage Decimal @db.Decimal(5, 2) // 1.0 = 100%, 0.5 = 50%
  created_at       DateTime @default(now())
  updated_at       DateTime @updatedAt

  @@unique([ticket_type])
  @@map("Pricing")
}

model Coupon {
  coupon_id           Int      @id @default(autoincrement())
  code                String   @unique
  discount_type       DiscountType
  discount_value      Decimal  @db.Decimal(10, 2)
  min_amount          Decimal  @default(0) @db.Decimal(10, 2)
  max_usage           Int      @default(1)
  used_count          Int      @default(0)
  expiry_date         DateTime
  applicable_movie_id Int?
  user_id             Int?     // For personal vouchers
  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt

  // Relations
  movie Movie? @relation(fields: [applicable_movie_id], references: [movie_id], onDelete: SetNull)
  user  User?  @relation(fields: [user_id], references: [user_id], onDelete: Cascade)

  @@map("Coupons")
}

enum DiscountType {
  PERCENTAGE
  FIXED_AMOUNT
}

model Combo {
  combo_id       Int     @id @default(autoincrement())
  name           String
  description    String?
  price          Decimal @db.Decimal(10, 2)
  stock_quantity Int     @default(0)
  status         ComboStatus @default(ACTIVE)
  created_at     DateTime @default(now())
  updated_at     DateTime @updatedAt

  // Relations
  order_combos OrderCombo[]

  @@map("Combos")
}

enum ComboStatus {
  ACTIVE
  INACTIVE
}

model Payment {
  payment_id      Int      @id @default(autoincrement())
  user_id         Int
  amount          Decimal  @db.Decimal(10, 2)
  payment_method  String?  // VNPay, Momo, Cash
  transaction_code String?
  status          PaymentStatus @default(PENDING)
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  // Relations
  user         User        @relation(fields: [user_id], references: [user_id], onDelete: Restrict)
  tickets      Ticket[]
  order_combos OrderCombo[]

  @@map("Payments")
}

enum PaymentStatus {
  PENDING
  SUCCESS
  FAILED
  REFUNDED
}

model Ticket {
  ticket_id     Int      @id @default(autoincrement())
  user_id       Int
  screening_id  Int
  seat_id       Int
  payment_id    Int
  ticket_type   String   // "Thường", "Trẻ em"
  price         Decimal  @db.Decimal(10, 2)
  purchase_date DateTime @default(now())
  status        TicketStatus @default(VALID)
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt

  // Relations
  user      User      @relation(fields: [user_id], references: [user_id], onDelete: Restrict)
  screening Screening @relation(fields: [screening_id], references: [screening_id], onDelete: Restrict)
  seat      Seat      @relation(fields: [seat_id], references: [seat_id], onDelete: Restrict)
  payment   Payment   @relation(fields: [payment_id], references: [payment_id], onDelete: Restrict)

  @@map("Tickets")
}

enum TicketStatus {
  VALID
  USED
  CANCELLED
}

model OrderCombo {
  order_combo_id Int     @id @default(autoincrement())
  payment_id     Int
  combo_id       Int
  quantity       Int
  price          Decimal @db.Decimal(10, 2) // Price at purchase time
  created_at     DateTime @default(now())
  updated_at     DateTime @updatedAt

  // Relations
  payment Payment @relation(fields: [payment_id], references: [payment_id], onDelete: Cascade)
  combo   Combo   @relation(fields: [combo_id], references: [combo_id], onDelete: Restrict)

  @@map("Order_Combos")
}

model Review {
  review_id  Int     @id @default(autoincrement())
  user_id    Int
  movie_id   Int
  rating     Int     // 1-5
  comment    String?
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  // Relations
  user  User  @relation(fields: [user_id], references: [user_id], onDelete: Cascade)
  movie Movie @relation(fields: [movie_id], references: [movie_id], onDelete: Cascade)

  @@map("Reviews")
}
```

---

## 15 PHASES - CHI TIẾT TỪNG BƯỚC

### **PHASE 1: PROJECT SETUP + PRISMA**

**Goal**: Setup Next.js + Prisma, connect PostgreSQL

**Tasks**:

1. Create Next.js project: `npx create-next-app@latest lumi-cinema --app`
2. Install dependencies:
   ```bash
   npm install @prisma/client prisma next-auth bcryptjs nodemailer next-cloudinary
   npm install -D @types/bcryptjs @types/nodemailer
   ```
3. Setup `.env.local`:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/lumi_cinema
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=<random-secret>
   CLOUDINARY_CLOUD_NAME=<your-cloud-name>
   CLOUDINARY_API_KEY=<your-api-key>
   CLOUDINARY_API_SECRET=<your-api-secret>
   SMTP_HOST=<gmail-smtp>
   SMTP_PORT=587
   SMTP_USER=<your-email>
   SMTP_PASS=<app-password>
   ```
4. Initialize Prisma: `npx prisma init`
5. Create `prisma/schema.prisma` (schema ở trên)
6. Create migration: `npx prisma migrate dev --name init`
7. Create `lib/prisma.ts` (global instance):

   ```typescript
   import { PrismaClient } from "@prisma/client";

   const globalForPrisma = global as unknown as {
     prisma: PrismaClient | undefined;
   };

   export const prisma =
     globalForPrisma.prisma ??
     new PrismaClient({
       log: ["query"],
     });

   if (process.env.NODE_ENV !== "production") {
     globalForPrisma.prisma = prisma;
   }
   ```

8. Test with simple health-check endpoint

**Endpoints**:

- `GET /api/health` → `{ success: true, message: "API running" }`

---

### **PHASE 2: NEXTAUTH.JS + SIGNUP/LOGIN**

**Goal**: User authentication with email/password

**Tasks**:

1. Create `lib/auth.ts` (NextAuth config + password hashing)
2. Setup auth session provider at root layout
3. Create `/api/auth/[...nextauth]/route.ts`:
   - Credentials provider (email/password)
   - Verify password with bcryptjs
   - Generate JWT token
4. Implement `POST /api/auth/signup`:
   - Hash password
   - Create user
   - Return success + redirect to login
5. Create login/signup pages with Client Components
6. Implement logout

**Endpoints**:

- `POST /api/auth/signup` → Register
- `POST /api/auth/signin` (NextAuth) → Login
- `POST /api/auth/callback/credentials` (NextAuth) → Callback
- `GET /api/auth/session` → Get current session
- `POST /api/auth/signout` (NextAuth) → Logout

---

### **PHASE 3: MOVIE MANAGEMENT (ADMIN)**

**Goal**: CRUD movies + Cloudinary upload

**Tasks**:

1. Create `lib/api-response.ts` (consistent response formatter):
   ```typescript
   export const apiResponse = (
     success: boolean,
     data?: any,
     message?: string
   ) => {
     return Response.json({ success, data, message });
   };
   ```
2. Create `POST /api/movies/upload` (Cloudinary upload):
   - Handle FormData with poster file
   - Upload to Cloudinary
   - Return direct URL
3. Create `GET /api/movies` → List all movies
4. Create `POST /api/movies` [Admin] → Create movie
5. Create `GET /api/movies/[id]` → Get movie details
6. Create `PUT /api/movies/[id]` [Admin] → Update movie
7. Create `DELETE /api/movies/[id]` [Admin] → Delete movie (check screenings)
8. Create admin page: Movie management UI

**Endpoints**:

- `POST /api/movies/upload` → Upload poster → get URL
- `GET /api/movies` → List movies
- `POST /api/movies` [Admin] → Create
- `GET /api/movies/[id]` → Details
- `PUT /api/movies/[id]` [Admin] → Update
- `DELETE /api/movies/[id]` [Admin] → Delete

---

### **PHASE 4: SCREENING MANAGEMENT (ADMIN)**

**Goal**: Manage screenings + auto-create 50 seats

**Tasks**:

1. Create `POST /api/screenings` [Admin]:
   - Validate: No 2 screenings in same room at same time
   - Auto-create 50 seats (A1-A50 or A1-G12)
   - status = EMPTY
2. Create `GET /api/screenings` → List with filters
3. Create `PUT /api/screenings/[id]` [Admin] → Update
4. Create `DELETE /api/screenings/[id]` [Admin] → Delete (if sold, refund + voucher)
5. Implement email notify customers on screening delete

**Endpoints**:

- `GET /api/screenings` → List
- `POST /api/screenings` [Admin] → Create
- `PUT /api/screenings/[id]` [Admin] → Update
- `DELETE /api/screenings/[id]` [Admin] → Delete

---

### **PHASE 5: SEATS + LAZY EVALUATION**

**Goal**: Display seats + release expired reservations

**Tasks**:

1. Create `GET /api/seats?screening_id=X`:
   - **Lazy Evaluation**: Before returning, check all Reserved seats:
     ```
     if (seat.reserved_until < NOW) → status = EMPTY
     ```
   - Return seat grid with status
2. Create `POST /api/seats/reserve` [Auth]:
   - Input: screening_id, seat_ids[]
   - Validate: all seats must be EMPTY
   - Update: status = RESERVED, reserved_until = NOW + 10 minutes
   - Return: reservation_token
3. Create `POST /api/seats/release` [Internal]:
   - Update seats: status = EMPTY, reserved_until = NULL
4. Create `GET /api/cron/release-seats` [Vercel Cron]:
   - Find Reserved seats where reserved_until < NOW
   - Update to EMPTY
   - Vercel cron.json: `"schedule": "*/5 * * * *"` (every 5 min)

**Endpoints**:

- `GET /api/seats` → Get seat map (with Lazy Eval)
- `POST /api/seats/reserve` [Auth] → Reserve
- `POST /api/seats/release` [Internal] → Release
- `GET /api/cron/release-seats` [Cron] → Cleanup

---

### **PHASE 6: PRICING**

**Goal**: Manage ticket prices

**Tasks**:

1. Create `GET /api/pricing` → Get all pricing tiers
2. Create `PUT /api/pricing/[type]` [Admin] → Update price_percentage
3. Create `lib/pricing.ts` helper:
   ```typescript
   calculateTicketPrice(base_price, ticket_type, quantity);
   ```

**Endpoints**:

- `GET /api/pricing` → List
- `PUT /api/pricing/[type]` [Admin] → Update

---

### **PHASE 7: COUPONS/VOUCHERS**

**Goal**: Manage discounts + issue vouchers

**Tasks**:

1. Create `GET /api/coupons` [Admin/Customer] → List
2. Create `POST /api/coupons` [Admin] → Create coupon
3. Create `POST /api/coupons/validate` [Auth]:
   - Validate code + expiry + usage + min_amount + applicable_movie
   - Return: discount amount + new total
4. Create `POST /api/coupons/issue-voucher` [Internal]:
   - Create coupon for specific user
   - discount_value = 50% of some amount
   - expiry = NOW + 7 days

**Endpoints**:

- `GET /api/coupons` → List
- `POST /api/coupons` [Admin] → Create
- `POST /api/coupons/validate` [Auth] → Validate
- `POST /api/coupons/issue-voucher` [Internal] → Issue

---

### **PHASE 8: COMBOS**

**Goal**: Manage combos + stock tracking

**Tasks**:

1. Create `GET /api/combos` → List active combos with stock > 0
2. Create `POST /api/combos` [Admin] → Create
3. Create `POST /api/combos/reserve` [Internal]:
   - Deduct stock_quantity
   - set reserved_until = NOW + 10 min
4. Create `POST /api/combos/release` [Internal]:
   - Restore stock_quantity
5. Create `GET /api/cron/release-combos` [Cron]:
   - Release reserved combos after 10 min + restore stock

**Endpoints**:

- `GET /api/combos` → List
- `POST /api/combos` [Admin] → Create
- `POST /api/combos/reserve` [Internal] → Reserve
- `POST /api/combos/release` [Internal] → Release
- `GET /api/cron/release-combos` [Cron] → Cleanup

---

### **PHASE 9: PAYMENT FLOW (MOCK)**

**Goal**: Initiate payment + handle callbacks

**Tasks**:

1. Create `POST /api/payments/initiate` [Auth]:
   - Validate all: screenings, seats, ticket_types, combos, coupon
   - Calculate total (seats + combos - coupon)
   - Create Payment: status = PENDING
   - Reserve seats + combos
   - Return: payment_id + mock VNPay URL
2. Create `GET /api/payments/vnpay-return?payment_id=X&status=success|failed`:
   - Redirect to IPN
3. Create `GET /api/payments/vnpay-ipn?payment_id=X&status=...`:
   - If success:
     - Update Payment: status = SUCCESS
     - Create Tickets (each seat)
     - Confirm combos (don't need extra, already reserved)
     - Increment coupon used_count
     - Send email: ticket + QR + order summary
   - If failed:
     - Update Payment: status = FAILED
     - Release seats + combos

**Endpoints**:

- `POST /api/payments/initiate` [Auth] → Start
- `GET /api/payments/vnpay-return` → Return
- `GET /api/payments/vnpay-ipn` → IPN/Webhook
- `GET /api/payments/[id]` [Auth] → Status

---

### **PHASE 10: TICKETS + CANCELLATION**

**Goal**: Manage tickets + allow cancellation
(ghi chú: Tự động cấp voucher 50% và gửi email cho khách)
**Tasks**:

1. Create `GET /api/tickets` [Auth] → My tickets
2. Create `GET /api/tickets/[id]` [Auth] → Details + QR
3. Create `DELETE /api/tickets/[id]` [Auth]:
   - Validate: NOW + 2 hours <= screening_time
   - Update: status = CANCELLED
   - Release seat
   - No refund
4. Create `PATCH /api/tickets/[id]/mark-used` [Staff]:
   - Update: status = USED
5. Create `GET /api/tickets/[id]/qr`:
   - Generate QR code (ticket_id + verification data)

**Endpoints**:

- `GET /api/tickets` [Auth] → List
- `GET /api/tickets/[id]` [Auth] → Details
- `DELETE /api/tickets/[id]` [Auth] → Cancel
- `PATCH /api/tickets/[id]/mark-used` [Staff] → Mark used
- `GET /api/tickets/[id]/qr` → QR code

---

### **PHASE 11: REVIEWS & RATINGS**

**Goal**: Customer rate + review movies

**Tasks**:

1. Create `POST /api/reviews` [Auth]:
   - Validate: user must have USED ticket for movie
   - Create Review: rating + comment
2. Create `GET /api/reviews?movie_id=X` → List reviews
3. Create `DELETE /api/reviews/[id]` [Admin] → Delete

**Endpoints**:

- `POST /api/reviews` [Auth] → Add
- `GET /api/reviews` → List
- `DELETE /api/reviews/[id]` [Admin] → Delete

---

### **PHASE 12: STAFF FEATURES**

**Goal**: Ticket lookup + voucher issuance

**Tasks**:

1. Create `GET /api/staff/tickets/search?email=X` [Staff]:
   - Search customer tickets
2. Create `POST /api/staff/tickets/[id]/cancel-with-voucher` [Staff]:
   - Validate staff role
   - Cancel ticket (no 2-hour limit)
   - Issue 50% voucher
   - Send email
   - Log action
3. Create `GET /api/staff/dashboard` [Staff]:
   - Today's stats (tickets, revenue, combos)

**Endpoints**:

- `GET /api/staff/tickets/search` [Staff] → Search
- `POST /api/staff/tickets/[id]/cancel-with-voucher` [Staff] → Cancel
- `GET /api/staff/dashboard` [Staff] → Stats

---

### **PHASE 13: ADMIN DASHBOARD & REPORTS**

**Goal**: Analytics + export

**Tasks**:

1. Create `GET /api/admin/dashboard` [Admin]:
   - Revenue (all-time + today + month)
   - Tickets sold
   - Combo revenue
   - Avg rating
   - 7-day trend
   - Top 5 movies
2. Create `GET /api/admin/reports/revenue?from=...&to=...&filter=movie|room|day` [Admin]
3. Create `GET /api/admin/reports/movies` [Admin]:
   - Movie performance + fill_rate%
4. Create `GET /api/admin/reports/export?type=csv|pdf` [Admin]

**Endpoints**:

- `GET /api/admin/dashboard` [Admin] → Dashboard
- `GET /api/admin/reports/revenue` [Admin] → Revenue
- `GET /api/admin/reports/movies` [Admin] → Movies
- `GET /api/admin/reports/export` [Admin] → Export

---

### **PHASE 14: EMAIL SERVICE + QR CODE**

**Goal**: Send emails + generate QR codes

**Tasks**:

1. Create `lib/email.ts` (Nodemailer):
   - Templates: ticket-confirmation, voucher-issued, ticket-cancelled
   - `sendTicketConfirmation(email, order, tickets, qr)`
   - `sendVoucherIssued(email, code, discount, expiry)`
   - `sendTicketCancelled(email, ticket)`
2. Create `lib/qr-code.ts`:
   - Generate QR from ticket_id + verification data

**No new endpoints**, used by other services.

---

### **PHASE 15: MIDDLEWARE + ERROR HANDLING**

**Goal**: Auth checks + centralized error handling

**Tasks**:

1. Create `app/middleware.ts`:
   - Check auth for protected routes
   - Verify role-based access (Admin/Staff)
   - Redirect to login if unauthorized
2. Create global error handler:
   - Catch try/catch in route handlers
   - Return consistent `{ success: false, error: "..." }` format
3. Create input validation helper:
   - Use `lib/validators.ts` + Zod for schema validation
4. Test all endpoints

---

## SUMMARY TABLE

| Phase | Module         | Key Endpoints                                | Status        |
| ----- | -------------- | -------------------------------------------- | ------------- |
| 1     | Setup + Prisma | GET /health                                  | Foundation    |
| 2     | NextAuth       | POST /auth/signup, /signin                   | User auth     |
| 3     | Movies         | POST/GET/PUT/DELETE /movies + upload         | Admin         |
| 4     | Screenings     | POST/GET/PUT/DELETE /screenings              | Scheduling    |
| 5     | Seats          | GET /seats, POST /reserve, /release, Cron    | Seat mgmt     |
| 6     | Pricing        | GET/PUT /pricing                             | Price tiers   |
| 7     | Coupons        | GET/POST /coupons, /validate, /issue         | Discounts     |
| 8     | Combos         | GET/POST /combos, /reserve, /release, Cron   | Combos        |
| 9     | Payments       | POST /initiate, /vnpay-return, /vnpay-ipn    | Transactions  |
| 10    | Tickets        | GET/DELETE /tickets                          | Ticket mgmt   |
| 11    | Reviews        | GET/POST/DELETE /reviews                     | Ratings       |
| 12    | Staff          | GET /staff/search, POST /cancel-with-voucher | Staff tools   |
| 13    | Admin          | GET /admin/dashboard, /reports               | Analytics     |
| 14    | Email + QR     | (Internal)                                   | Notifications |
| 15    | Middleware     | Auth checks                                  | Security      |

---

## DEPLOYMENT CHECKLIST

- [ ] Update `.env.local` → Vercel environment
- [ ] PostgreSQL cloud (Supabase, AWS RDS, hoặc Vercel Postgres)
- [ ] Cloudinary setup
- [ ] SMTP email setup
- [ ] NextAuth secret generated
- [ ] Vercel Cron config (`vercel.json`):
  ```json
  {
    "crons": [
      {
        "path": "/api/cron/release-seats",
        "schedule": "*/5 * * * *"
      },
      {
        "path": "/api/cron/release-combos",
        "schedule": "*/5 * * * *"
      }
    ]
  }
  ```
- [ ] Deploy to Vercel
- [ ] Test all endpoints on production

---

## QUICK QUESTIONS BEFORE STARTING PHASE 1?

1. Seat numbering (A1-A50 hay A1-G12)?
2. Có gì khác cần sửa/thêm không?
3. Sẵn sàng start PHASE 1 code by code không?

Hãy confirm, rồi mình create **PHASE 1 - Step by Step Code** 🚀
