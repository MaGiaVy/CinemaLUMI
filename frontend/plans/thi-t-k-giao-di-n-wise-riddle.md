# Plan: Lumi Cinema — Full UI Implementation

## Context

Build a complete cinema ticket management system UI for Lumi Cinema. The project is a clean React 19 + Tailwind CSS v4 slate. All 3 user roles (Customer, Staff, Admin) must be implemented with mock/static data, focused on visual design quality. Navigation is state-based (no React Router) via a `currentPage` string managed in App.tsx. The design brief defines a dark-theme design system (#1A1A1A bg, #E63946 red CTAs, #FFB703 gold) with Inter as the primary typeface.

---

## Design System

**Colors** (set as CSS custom properties in `src/index.css`):
- `--bg-primary: #1A1A1A` — page background
- `--bg-secondary: #2D2D2D` — cards, panels
- `--red: #E63946` — primary CTA
- `--gold: #FFB703` — highlights, selected state
- `--blue: #0088FF` — info, secondary CTA
- `--green: #2ECC71` — success
- `--text-primary: #FFFFFF`
- `--text-secondary: #B3B3B3`
- `--border: #404040`

**Font**: Inter (Google Fonts, loaded via `@import` at top of `src/index.css`)

---

## File Structure

```
src/
  App.tsx                  — page state, navigation router
  index.css                — Google Font import, CSS tokens, global styles
  main.tsx                 — unchanged
  data/
    mockData.ts            — all mock movies, tickets, users, screenings, combos, vouchers
  components/
    layout/
      Navbar.tsx           — public + customer top nav
      AdminSidebar.tsx     — admin left sidebar with nav links
      StaffSidebar.tsx     — staff left sidebar
      Footer.tsx           — public footer
    ui/
      Button.tsx           — primary/secondary/danger variants
      Badge.tsx            — status, genre tags
      Modal.tsx            — overlay + dialog wrapper
      Toast.tsx            — top-right notification (auto-dismiss)
      SeatMap.tsx          — interactive seat grid (empty/occupied/selected)
      StarRating.tsx       — 1-5 star click selector + display
      CountdownTimer.tsx   — MM:SS countdown hook + display
      MovieCard.tsx        — poster + title + showtimes card
      StatCard.tsx         — admin KPI card (icon + number + label)
      BarChart.tsx         — simple SVG bar chart for revenue (no dep needed)
  pages/
    public/
      LandingPage.tsx      — hero carousel + movie grid + footer
      LoginPage.tsx        — email/password form + links
      SignUpPage.tsx       — registration form
    customer/
      MovieSchedulePage.tsx   — date tabs + movie+showtime grid + sidebar info
      MovieDetailsPage.tsx    — banner + schedule + recommendations
      SeatSelectionPage.tsx   — seat map + right sidebar (seats/price/timer)
      TicketTypePage.tsx      — Thường/Trẻ em selector + voucher input + price breakdown
      ComboCheckoutPage.tsx   — combo list (left) + order summary (right)
      PaymentPage.tsx         — QR code + payment method + timer + confirm
      MyTicketsPage.tsx       — ticket list + expandable detail + QR
      MovieRatingPage.tsx     — star selector + textarea + existing reviews list
    staff/
      StaffDashboardPage.tsx  — quick search + recent transactions + cancel queue
      TicketLookupPage.tsx    — search bar + ticket detail + actions
    admin/
      AdminDashboardPage.tsx     — 4 stat cards + bar chart + top movies
      MovieManagementPage.tsx    — table + add/edit modal + delete confirm
      ScreeningManagementPage.tsx — calendar grid + add/edit/delete screening
      PricingConfigPage.tsx       — pricing table inline edit + save
      VoucherManagementPage.tsx   — voucher table + add/edit modal
      ComboManagementPage.tsx     — combo table + stock edit + add modal
      ReportsPage.tsx             — date filter + revenue chart + movie perf table + export btn
      ReviewModerationPage.tsx    — reviews list + filter by stars + delete action
```

---

## Navigation Architecture

`App.tsx` holds `currentPage: string` and `currentRole: 'public' | 'customer' | 'staff' | 'admin'` state.

A **demo role switcher** (top-right floating pill) lets users jump between roles so all pages are accessible in the demo. Each role has its own nav layout:
- `public` / `customer` → `Navbar` + page content + `Footer` (public pages only)
- `staff` → `StaffSidebar` + page content  
- `admin` → `AdminSidebar` + page content

Navigation calls are passed as `onNavigate(page: string)` props down to pages and nav components.

---

## Mock Data (`src/data/mockData.ts`)

Exports typed arrays for:
- `movies[]` — 8 Vietnamese/international films with poster (Unsplash URLs), title, genre, duration, rating, description
- `screenings[]` — per movie, multiple dates+times, room, seats available
- `tickets[]` — 6 customer tickets with status (Valid/Used/Cancelled)
- `combos[]` — 4 combos with name, items, price, stock, badge
- `vouchers[]` — 5 vouchers with code, discount, expiry, status
- `reviews[]` — 10 reviews across movies with star rating + comment
- `users[]` — 5 mock user accounts (customer + staff + admin)
- `transactions[]` — 8 recent ticket transactions for staff view
- `revenueData[]` — 7 days of revenue numbers for admin chart

---

## Implementation Order

1. **`src/index.css`** — add `@import` for Inter, CSS custom properties (color tokens), global base styles (scrollbar hide, body bg + color)
2. **`src/data/mockData.ts`** — all mock data with TypeScript types
3. **Shared UI components** — Button, Badge, Modal, Toast, SeatMap, StarRating, CountdownTimer, MovieCard, StatCard, BarChart
4. **Layout components** — Navbar, AdminSidebar, StaffSidebar, Footer
5. **Public pages** — LandingPage, LoginPage, SignUpPage
6. **Customer pages** — in booking flow order (Schedule → Details → Seat → Ticket → Combo → Payment → MyTickets → Rating)
7. **Staff pages** — StaffDashboard, TicketLookup
8. **Admin pages** — Dashboard → Movie → Screening → Pricing → Voucher → Combo → Reports → Reviews
9. **`src/App.tsx`** — wire all pages with navigation state + role switcher

---

## Key Component Details

### SeatMap
- 7 rows × 12 columns grid
- States: `empty` (gray `#404040`), `occupied` (red `#E63946` disabled), `selected` (gold `#FFB703`)
- Click to toggle; occupied seats are non-clickable
- Screen label at top

### CountdownTimer
- `useEffect` + `setInterval` hook, 5:00 countdown
- Displays MM:SS in gold when under 2 min (warning color change)

### BarChart
- Pure SVG, no external charting lib needed
- 7 bars, labeled with days, y-axis with revenue in VNĐ
- Bar color: `#E63946`, hover: `#FFB703`

### AdminSidebar
- Fixed left, 240px wide
- Sections: Dashboard, Movies, Screenings, Pricing, Vouchers, Combos, Reports, Reviews
- Active item highlighted in red

---

## Design Craft Notes

- All cards: `background: #2D2D2D`, `border: 1px solid #404040`, `border-radius: 8px`
- Hover transitions: `transition: all 0.2s ease`
- Toast notifications: positioned `fixed top-4 right-4`, slide in from right
- Modals: `backdrop: rgba(0,0,0,0.8)`, centered dialog with `#2D2D2D` bg
- Status badges: green = Valid/Active, red = Cancelled/Expired, gold = Pending/Warning, gray = Used
- Movie posters from Unsplash with `object-fit: cover` and aspect ratio `2/3`
- Stepper/breadcrumb visible in booking flow pages (Step 1-4 indicator)

---

## Verification

1. Check all pages render without TypeScript errors (Vite hot reload)
2. Test navigation between all pages via the role switcher and nav links
3. Confirm seat map: click to select/deselect, occupied seats non-interactive
4. Confirm countdown timer counts down
5. Confirm modal open/close works (add movie, confirm cancel, delete)
6. Check dark theme consistency across all pages
7. Verify responsive behavior at ~1024px breakpoint
