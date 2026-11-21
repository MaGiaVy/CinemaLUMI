# CODE STANDARDS & BEST PRACTICES
## LUMI CINEMA - Next.js Full Stack

**Goal**: Đảm bảo code quality, consistency, maintainability từ Phase 1 → Phase 15

---

## 1. NAMING CONVENTIONS

### TypeScript/JavaScript
```typescript
// ✅ CORRECT
const getUserById = async (userId: number) => { }
const isValidEmail = (email: string): boolean => { }
const MAX_RETRIES = 3
const userRepository = { /* ... */ }

// ❌ WRONG
const get_user_by_id = () => { }
const GetUserById = () => { }
const getUserbyid = () => { }
const GETUSERBYID = () => { }
```

**Rules**:
- Functions/methods: `camelCase` (e.g., `getUserById`, `calculatePrice`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_SEAT_HOLD_TIME`, `API_VERSION`)
- Variables: `camelCase` (e.g., `currentUser`, `totalPrice`)
- Classes/Interfaces: `PascalCase` (e.g., `UserService`, `IMovie`)
- Files: `kebab-case` for folders & components, `camelCase` for utilities
  - ✅ `user-profile.tsx`, `lib/email-service.ts`
  - ❌ `UserProfile.tsx`, `emailService.ts`

### Database
```sql
-- ✅ CORRECT
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  first_name VARCHAR(100),
  created_at TIMESTAMP
);

-- ❌ WRONG
CREATE TABLE Users (user_id INT PRIMARY KEY);
CREATE TABLE tbl_users (UserID INT);
```

**Rules**:
- Table names: `snake_case`, lowercase (e.g., `users`, `order_combos`)
- Column names: `snake_case`, lowercase (e.g., `user_id`, `created_at`)
- Foreign keys: `{table_name}_id` (e.g., `user_id`, `movie_id`)

---

## 2. FOLDER & FILE STRUCTURE

### CORRECT
```
app/
├── api/
│   ├── movies/
│   │   ├── route.ts                  # GET/POST /api/movies
│   │   ├── [id]/
│   │   │   └── route.ts              # GET/PUT/DELETE /api/movies/[id]
│   │   └── upload/
│   │       └── route.ts              # POST /api/movies/upload
│   └── ...
├── (customer)/                       # Route group
│   ├── layout.tsx
│   ├── movies/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   └── ...
└── middleware.ts

components/
├── ui/                               # Reusable UI components
│   ├── button.tsx                    # Single component per file
│   ├── modal.tsx
│   └── ...
├── movies/                           # Feature-specific components
│   ├── movie-card.tsx
│   ├── movie-form.tsx
│   └── ...
└── layout/
    ├── navbar.tsx
    └── sidebar.tsx

lib/
├── prisma.ts                         # Database client
├── auth.ts                           # NextAuth config
├── api-response.ts                   # Response formatter
├── email.ts                          # Email service
├── validators.ts                     # Input validation
└── utils.ts                          # Helper functions

types/
├── index.ts                          # Main types export
├── models.ts                         # Prisma model types
└── api.ts                            # API request/response types

hooks/
├── use-auth.ts
├── use-api.ts
└── ...
```

### WRONG ❌
```
src/
├── pages/                            # ❌ Old Pages Router
├── services/
│   ├── userService.ts               # ❌ PascalCase
│   ├── MovieService.ts
│   └── paymentService.js            # ❌ .js in TS project
└── utils/
    ├── helper.ts                    # ❌ Generic names
    └── index.js
```

---

## 3. TYPESCRIPT STRICT MODE

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  }
}
```

**Code Examples**:
```typescript
// ✅ CORRECT - Full typing
interface User {
  id: number;
  email: string;
  name: string;
}

async function getUserById(id: number): Promise<User | null> {
  const user = await prisma.user.findUnique({ where: { id } });
  return user;
}

// ❌ WRONG - No types
const getUserById = async (id) => {
  const user = await prisma.user.findUnique({ where: { id } });
  return user;
}

// ❌ WRONG - Any type
const value: any = getUserData();
```

---

## 4. ERROR HANDLING PATTERN

### Centralized Error Handling

**Create `lib/error.ts`**:
```typescript
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code: string,
  ) {
    super(message);
  }
}

export const handleError = (error: unknown) => {
  if (error instanceof AppError) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
    };
  }

  if (error instanceof Error) {
    console.error("[Error]", error.message);
    return {
      success: false,
      error: "Internal server error",
      statusCode: 500,
    };
  }

  return {
    success: false,
    error: "Unknown error",
    statusCode: 500,
  };
};
```

**In API Routes**:
```typescript
// app/api/movies/route.ts
import { handleError, AppError } from "@/lib/error";

export async function GET(request: Request) {
  try {
    const movies = await prisma.movie.findMany();
    return Response.json({
      success: true,
      data: movies,
    });
  } catch (error) {
    const errorResponse = handleError(error);
    return Response.json(
      errorResponse,
      { status: errorResponse.statusCode }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validation
    if (!body.title || !body.genre) {
      throw new AppError(400, "Title and genre are required", "INVALID_INPUT");
    }

    if (body.title.length < 3) {
      throw new AppError(
        400,
        "Title must be at least 3 characters",
        "INVALID_TITLE"
      );
    }

    const movie = await prisma.movie.create({ data: body });
    return Response.json(
      { success: true, data: movie },
      { status: 201 }
    );
  } catch (error) {
    const errorResponse = handleError(error);
    return Response.json(
      errorResponse,
      { status: errorResponse.statusCode }
    );
  }
}
```

---

## 5. API RESPONSE FORMAT (CONSISTENT)

**All endpoints must return**:
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
  timestamp?: string;
}
```

**Examples**:

✅ **Success**:
```json
{
  "success": true,
  "data": {
    "movie_id": 1,
    "title": "Huyết Nguyệt",
    "poster": "https://res.cloudinary.com/.../poster.webp"
  }
}
```

✅ **Error**:
```json
{
  "success": false,
  "error": "Movie not found",
  "code": "NOT_FOUND",
  "statusCode": 404
}
```

✅ **With Message**:
```json
{
  "success": true,
  "data": { "ticket_id": 123 },
  "message": "Ticket created successfully"
}
```

---

## 6. DATABASE QUERIES - BEST PRACTICES

### Pattern 1: Use `include`/`select` for related data

```typescript
// ✅ CORRECT - Load related data efficiently
const screening = await prisma.screening.findUnique({
  where: { screening_id: 5 },
  include: {
    movie: true,
    seats: {
      where: { status: "RESERVED" },
    },
  },
});

// ❌ WRONG - N+1 query problem
const screening = await prisma.screening.findUnique({
  where: { screening_id: 5 },
});
const movie = await prisma.movie.findUnique({
  where: { movie_id: screening.movie_id },
});
const seats = await prisma.seat.findMany({
  where: { screening_id: 5 },
});
```

### Pattern 2: Use `select` for performance

```typescript
// ✅ CORRECT - Only select needed fields
const users = await prisma.user.findMany({
  select: {
    user_id: true,
    email: true,
    full_name: true,
    // Don't load password or timestamps if not needed
  },
  take: 10,
});

// ❌ WRONG - Load unnecessary data
const users = await prisma.user.findMany({
  take: 10,
});
```

### Pattern 3: Transactions for atomic operations

```typescript
// ✅ CORRECT - Atomic payment + ticket creation
const result = await prisma.$transaction(async (tx) => {
  // 1. Update payment status
  const payment = await tx.payment.update({
    where: { payment_id },
    data: { status: "SUCCESS" },
  });

  // 2. Create tickets
  const tickets = await tx.ticket.createMany({
    data: seat_ids.map((seat_id) => ({
      user_id,
      screening_id,
      seat_id,
      payment_id,
      ticket_type: "Thường",
      price: base_price,
    })),
  });

  // 3. Update seats
  await tx.seat.updateMany({
    where: { seat_id: { in: seat_ids } },
    data: { status: "OCCUPIED" },
  });

  return { payment, tickets };
});

// ❌ WRONG - Multiple separate operations (can fail mid-way)
await prisma.payment.update({ ... });
await prisma.ticket.createMany({ ... });
await prisma.seat.updateMany({ ... });
```

---

## 7. INPUT VALIDATION

**Create `lib/validators.ts`**:
```typescript
import { z } from "zod";

export const movieSchema = z.object({
  title: z.string().min(3).max(255),
  genre: z.string().min(1),
  duration: z.number().int().positive(),
  description: z.string().optional(),
  release_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
});

export type MovieInput = z.infer<typeof movieSchema>;

export const validateMovie = (data: unknown) => {
  return movieSchema.parse(data);
};
```

**In API Routes**:
```typescript
import { validateMovie, AppError } from "@/lib";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = validateMovie(body);

    const movie = await prisma.movie.create({
      data: validatedData,
    });

    return Response.json({ success: true, data: movie }, { status: 201 });
  } catch (error) {
    // Zod validation error
    if (error instanceof z.ZodError) {
      return Response.json(
        {
          success: false,
          error: "Validation error",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // Other errors
    return Response.json(handleError(error));
  }
}
```

---

## 8. API ROUTE TEMPLATE

**Use this template for every route**:

```typescript
// app/api/[resource]/route.ts
import { prisma } from "@/lib/prisma";
import { handleError, AppError } from "@/lib/error";
import { validate[Resource] } from "@/lib/validators";
import { auth } from "@/lib/auth";

// GET - List
export async function GET(request: Request) {
  try {
    const data = await prisma.[resource].findMany({
      select: { /* fields */ },
      take: 20,
    });

    return Response.json({
      success: true,
      data,
    });
  } catch (error) {
    return Response.json(
      handleError(error),
      { status: 500 }
    );
  }
}

// POST - Create
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      throw new AppError(403, "Unauthorized", "FORBIDDEN");
    }

    const body = await request.json();
    const validated = validate[Resource](body);

    const created = await prisma.[resource].create({
      data: validated,
    });

    return Response.json(
      { success: true, data: created, message: "[Resource] created" },
      { status: 201 }
    );
  } catch (error) {
    const errorResponse = handleError(error);
    return Response.json(
      errorResponse,
      { status: errorResponse.statusCode || 500 }
    );
  }
}
```

---

## 9. COMPONENT STRUCTURE

### Page Components (Client Components by default)

```typescript
// app/(customer)/movies/page.tsx
"use client";

import { useState, useEffect } from "react";
import { MovieGrid } from "@/components/movies/movie-grid";

export default function MoviesPage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      const res = await fetch("/api/movies");
      const json = await res.json();

      if (!json.success) throw new Error(json.error);
      setMovies(json.data);
    } catch (error) {
      console.error("Failed to fetch movies", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Movies</h1>
      <MovieGrid movies={movies} />
    </div>
  );
}
```

### UI Components (Can be Server or Client, prefer Server)

```typescript
// components/ui/button.tsx
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}

export function Button({
  children,
  onClick,
  variant = "primary",
  disabled,
}: ButtonProps) {
  const baseStyles = "px-4 py-2 rounded font-medium transition";
  const variants = {
    primary: "bg-red-500 text-white hover:bg-red-600",
    secondary: "bg-gray-300 text-black hover:bg-gray-400",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
```

---

## 10. AUTHENTICATION & ROLE CHECKS

**Pattern for protected routes**:

```typescript
// app/api/movies/route.ts (Admin only)
import { auth } from "@/lib/auth";
import { AppError } from "@/lib/error";

export async function POST(request: Request) {
  try {
    const session = await auth();

    // Check authentication
    if (!session) {
      throw new AppError(401, "Unauthorized", "UNAUTHENTICATED");
    }

    // Check role
    if (session.user.role !== "ADMIN") {
      throw new AppError(403, "Only admins can create movies", "FORBIDDEN");
    }

    // Rest of logic...
  } catch (error) {
    return Response.json(handleError(error));
  }
}
```

**Middleware for layout protection**:

```typescript
// app/(admin)/layout.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  return <div>{children}</div>;
}
```

---

## 11. ENVIRONMENT VARIABLES

**.env.local**:
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/lumi_cinema

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generated-secret>

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# API
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

**Rules**:
- ✅ Prefix public vars with `NEXT_PUBLIC_`
- ✅ Keep `.env.local` in `.gitignore`
- ✅ Create `.env.example` with placeholder values
- ❌ Never commit real secrets

---

## 12. CODE REVIEW CHECKLIST (Before commit)

- [ ] Naming conventions followed (camelCase, UPPER_SNAKE_CASE)
- [ ] TypeScript strict mode - no `any` types
- [ ] Error handling with custom `AppError`
- [ ] API response format consistent
- [ ] Database queries use `include`/`select` efficiently
- [ ] Input validation with Zod
- [ ] Authentication/role checks for protected routes
- [ ] No console.log in production code (use proper logging)
- [ ] No hardcoded values (use .env)
- [ ] No N+1 queries
- [ ] No unused imports/variables
- [ ] Comments for complex logic only
- [ ] README updated if needed

---

## 13. GIT COMMIT MESSAGE CONVENTION

```bash
# ✅ CORRECT
git commit -m "feat: add movie creation endpoint with Cloudinary upload"
git commit -m "fix: handle seat reservation timeout correctly"
git commit -m "docs: update API documentation"
git commit -m "refactor: extract payment logic into separate service"
git commit -m "test: add unit tests for pricing calculator"

# ❌ WRONG
git commit -m "fixed bug"
git commit -m "Update"
git commit -m "WIP"
git commit -m "asd"
```

**Format**: `<type>: <subject>`

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `style`

---

## 14. LOGGING PATTERN

```typescript
// ✅ CORRECT - Structured logging
console.error("[MovieAPI] Failed to fetch movie:", { movieId, error: error.message });
console.info("[PaymentAPI] Payment processed successfully:", { paymentId, amount });

// ❌ WRONG
console.log("error");
console.log(error);
console.log("wtf");
```

---

## 15. TESTING (Optional but recommended)

```typescript
// __tests__/lib/pricing.test.ts
import { calculateTicketPrice } from "@/lib/pricing";

describe("calculateTicketPrice", () => {
  it("should calculate regular ticket price", () => {
    const price = calculateTicketPrice(100000, "Thường", 1);
    expect(price).toBe(100000);
  });

  it("should calculate child ticket price (50%)", () => {
    const price = calculateTicketPrice(100000, "Trẻ em", 1);
    expect(price).toBe(50000);
  });

  it("should calculate multiple tickets", () => {
    const price = calculateTicketPrice(100000, "Thường", 2);
    expect(price).toBe(200000);
  });
});
```

---

## 16. QUICK START CHECKLIST

Before starting Phase 1, verify:

- [ ] Node.js 18+ installed
- [ ] PostgreSQL running locally
- [ ] `.env.local` created with all required variables
- [ ] `tsconfig.json` has `strict: true`
- [ ] ESLint configured (if using)
- [ ] Prettier configured for consistent formatting
- [ ] `.gitignore` includes `.env.local`, `node_modules`, `.next`

---

## 17. FOLDER CHECKLIST FOR EACH PHASE

When starting each phase, ensure:
- [ ] Proper folder created
- [ ] Appropriate files created
- [ ] Naming conventions followed
- [ ] TypeScript types defined
- [ ] Error handling implemented
- [ ] API response format consistent
- [ ] Database queries optimized
- [ ] Tests written (if applicable)
- [ ] Code reviewed against checklist
- [ ] Git commit with proper message

---

Đây là **CODE STANDARDS** sẽ giữ cho project không bị tùm lum từ Phase 1 → Phase 15! 💪

Hãy confirm bạn hiểu rõ, rồi mình sẽ bắt đầu **PHASE 1 - Step by Step Code** ngay! 🚀
