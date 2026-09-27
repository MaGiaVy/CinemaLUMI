# DESIGN BRIEF - LUMI CINEMA
## Hệ Thống Quản Lý Bán Vé Rạp Phim

---

## 1. OVERVIEW

**Project Name**: Lumi Cinema - Cinema Ticket Management System  
**Platform**: Web  
**Design Style**: Modern + Minimalist Dark Theme  
**Primary Audience**: Movie customers, cinema staff, admin managers  

---

## 2. DESIGN SYSTEM

### Color Palette
- **Primary Red**: #E63946 (CTAs, alerts, highlights)
- **Dark Background**: #1A1A1A (main bg)
- **Dark Secondary**: #2D2D2D (cards, panels)
- **Gold Accent**: #FFB703 (special offers, highlights)
- **Blue Accent**: #0088FF (secondary CTAs, info)
- **Text Primary**: #FFFFFF (main text)
- **Text Secondary**: #B3B3B3 (labels, hints)
- **Success Green**: #2ECC71
- **Border**: #404040 (subtle)

### Typography
- **Heading (H1, H2)**: Bold, 24-32px
- **Subheading (H3)**: Semi-bold, 16-20px
- **Body**: Regular, 14-16px
- **Small/Label**: Regular, 12-14px
- **Font Family**: Any modern sans-serif (Segoe UI, Roboto, Inter recommended)

### Spacing
- Base unit: 8px
- Padding: 8px, 16px, 24px, 32px
- Margin: 8px, 16px, 24px, 32px
- Gap: 8px, 12px, 16px, 24px

### Components
- **Buttons**: Rounded corners (4-6px), min height 44px, hover state darker/lighter
- **Cards**: Rounded (6-8px), 1px border #404040, subtle shadow
- **Input Fields**: Rounded (4px), 1px border, focus highlight with blue
- **Badge/Tag**: Rounded, small padding (4px 8px)

---

## 3. PAGES & SCREENS

### 3.1 PUBLIC PAGES

#### 3.1.1 Landing / Home Page
- Navbar: Logo, Menu (Tổng quan, Nhân viên, Lịch chiếu), Auth buttons
- Hero: Movie carousel/featured movie
- Movie schedule grid: Filter by date/genre
- Footer: Contact, info

#### 3.1.2 Login Page
- Form: Email, Password
- "Forgot password?" link
- "Sign up" link
- Social login options (optional)

#### 3.1.3 Sign Up Page
- Form: Email, Password (min 6 chars), Full name, Phone number
- Terms & conditions checkbox
- "Already have account?" link
- Submit button

---

### 3.2 CUSTOMER PAGES

#### 3.2.1 Movie Schedule (Nhân viên & lịch theo ca)
**Screens needed:**
- Filter: By date, by genre, by movie
- Movie list with showtimes
- Show available seats count
- Status badges (Đủ chỗ / Cảnh báo / Thêu lịch)

**Key Elements:**
- Date tabs (T5, T6, T7, CN...)
- Movie card: Poster thumbnail, title, duration, genre, rating
- Showtime buttons: Time + Room + Available seats
- Sidebar: Movie info, description, reviews (4.7/5 stars)

#### 3.2.2 Seat Selection (Chọn ghế)
**Screens needed:**
- Movie info header: Title, date, time, room
- Seat map: 
  - Legend: Empty (gray), Occupied (red), Selected (yellow)
  - Grid layout (7 rows x 12 cols for example)
  - Screen indicator at top
  - Drag-select or click-select seats
- Right sidebar: Selected seats list, price calculation, 5-min timer countdown
- Action buttons: Clear / Confirm selection

#### 3.2.3 Ticket Type & Voucher Selection
**Screens needed:**
- Ticket type selector: Thường (100%) / Trẻ em (50%)
- Quantity for each type (+ / - buttons)
- Voucher input: Code + Apply button
- Discount visualization (if voucher applied)
- Price breakdown: Original → Discount → Total

#### 3.2.4 Combo Selection & Checkout
**Screens needed:**
- Left panel: Combo list
  - Combo Lumi: Bắp + nước (129k) - "BÁN CHẠY" badge
  - Combo Đôi: Bắp + 2 nước (99k)
  - Bắp Caramel: 69k
  - Quantity selector (- / +) for each
  - "+ Thêm" button to add more combos
- Right panel: Order summary QR
  - Movie + seats + ticket types + combos
  - Total price (yellow highlight)
  - "Tối đã thanh toán" button (red)

#### 3.2.5 Payment / Confirmation
**Screens needed:**
- QR code display (order reference)
- Countdown timer (order expiry)
- Payment method selector: VNPay / Momo
- Total amount display
- Confirmation button
- Post-payment: Ticket + QR code + email confirmation message

#### 3.2.6 My Tickets (Vé của tôi)
**Screens needed:**
- Ticket list: Movie, date, time, seat, price, status (Valid / Used / Cancelled)
- Ticket card expandable: Click to show full details + QR code
- Action buttons per ticket: View details / Cancel (if time allows)

#### 3.2.7 Cancel Ticket (Hủy vé)
**Screens needed:**
- Confirmation dialog: Movie info, conditions (2h rule), final warning
- Cancel button + Keep button
- Success message: "Vé đã hủy" (no refund message explicit)

#### 3.2.8 Movie Rating (Đánh giá phim)
**Screens needed:**
- Movie header: Poster, title, year
- Rating section: 1-5 star selector (click-based)
- Review textarea: "Bình luận về phim này..."
- Submit button
- Reviews list below: Other users' ratings + comments (name, stars, text, date)

#### 3.2.9 Movie Details / Description (Lịch chiếu & giá vé)
**Screens needed:**
- Movie banner: Large poster, title, genre, release date, director
- Movie info: Duration, rating, description (short + "Xem thêm" expand)
- Schedule tabs: By date (Hôm nay, Thứ Năm, Thứ Sáu...)
- Room + Showtimes + Prices
- "Xem suất chiếu" button leads to seat selection
- Recommendation section: "Phim đang chiếu" carousel

---

### 3.3 STAFF PAGES

#### 3.3.1 Staff Dashboard
- Quick search: Ticket lookup by email/phone
- Recent transactions list
- Cancel ticket queue (if any)
- Link to Admin panel

#### 3.3.2 Ticket Lookup / Management
**Screens needed:**
- Search bar: By email / phone number / ticket ID
- Ticket details: Movie, seat, customer info, status
- Actions: View QR / Cancel ticket (with reason)

#### 3.3.3 Voucher Issuance (when cancelling due to cinema fault)
**Screens needed:**
- Confirmation: Movie + seat + customer info
- Reason selector: Mất điện / Lỗi kỹ thuật máy chiếu / Khác
- Generate 50% voucher code
- Send via email/SMS option
- Confirmation message

---

### 3.4 ADMIN PAGES

#### 3.4.1 Admin Dashboard
- 4-card summary: Revenue (VNĐ), Seats sold, Combo revenue, Rating avg
- Revenue by last 7 days (bar chart)
- Top movies by rating (list with thumbnails)
- Alerts: Low stock warnings

#### 3.4.2 Movie Management
**Screens needed:**
- Movie list table: Title, Genre, Duration, Status (Active/Inactive), Actions
- Add/Edit modal: 
  - Movie name, genre, duration, rating, poster upload
  - Description, release date, end date
  - Submit/Cancel buttons
- Delete confirmation dialog (check if any screenings first)

#### 3.4.3 Screening Management
**Screens needed:**
- Screening calendar grid by room
- Add screening form: Movie + Date + Time + Room + Price
- Edit screening: Same fields (disabled after screening starts)
- Delete screening: Warning if tickets sold → auto-refund + voucher issuance
- Screening details: Show seat availability %

#### 3.4.4 Pricing Configuration
**Screens needed:**
- Pricing table: Ticket type (Thường / Trẻ em) + Percentage/Price
- Edit fields (inline or modal)
- Notes: "Applies to new screenings only"
- Save button

#### 3.4.5 Voucher Management
**Screens needed:**
- Voucher list table: Code, Discount %, Max usage, Expiry, Status (Active/Expired)
- Add voucher form: 
  - Code, discount type (% or fixed amount), discount value
  - Min purchase amount, max usage count, expiry date
  - Applicable movies selector
- Edit/Delete actions
- Mark as expired button

#### 3.4.6 Combo Management
**Screens needed:**
- Combo list table: Name, Items, Price, Stock, Actions
- Add/Edit combo form: Name, combo items, price, stock number
- Stock updates: Manual input + current stock display
- Auto-hide when stock = 0 (toggle/info)
- Delete combo button

#### 3.4.7 Reports & Analytics
**Screens needed:**
- Date range filter: From - To
- Revenue report: Total, by movie, by room, by date (line chart)
- Movie performance: Rating avg, ticket sales, fill rate % (table)
- Filters: By movie / By room / By time period
- Export button: PDF / Excel
- Top movies carousel: Thumbnails + revenue

#### 3.4.8 Movie Reviews (Admin view)
**Screens needed:**
- Reviews list: Movie title, reviewer name, rating (stars), comment, date
- Filter by rating (1-5 stars, avg)
- Sort: Latest / Highest / Lowest rating
- Delete review option (spam control)

---

## 4. INTERACTIVE FLOWS

### 4.1 Customer Flow
1. Landing → Browse movies (filter by date/genre)
2. Click movie → See schedule + seat availability
3. Click showtime → Seat selection map
4. Select seats → Choose ticket types (Thường/Trẻ em)
5. Optional: Apply voucher code
6. Review combo options → Add or skip
7. Proceed to payment → QR + VNPay/Momo redirect
8. Post-payment: Ticket confirmation + email
9. My Tickets → View/Cancel past tickets
10. Movie page → Rate movie after watching

### 4.2 Staff Flow
1. Dashboard → Quick actions
2. Search ticket by email/phone
3. View ticket details + QR
4. If cancellation needed (cinema fault): Cancel → Issue 50% voucher → Send to customer email/SMS

### 4.3 Admin Flow
1. Dashboard → Overview stats + charts
2. Manage movies: Add/Edit/Delete
3. Manage screenings: Create → Auto-generate 50 seats
4. Set pricing tiers: Thường/Trẻ em percentages
5. Create/manage vouchers: Code, discount, conditions
6. Create/manage combos: Items, prices, stock levels
7. View reports: Filter by date/movie/room, export data
8. Moderate reviews: View all ratings, delete spam

---

## 5. DESIGN PATTERNS

### Common Patterns
- **Modal dialogs**: For confirmations, forms (overlay 80% dark)
- **Dropdowns**: Filter, date pickers
- **Toast notifications**: Success/error messages (top-right, auto-dismiss 3s)
- **Loading states**: Spinners, skeleton loaders
- **Hover effects**: Slight bg color change, cursor pointer
- **Responsive grid**: 12-column grid for layouts
- **Card grids**: Movies, combos, reviews (auto-wrap on resize)

### Accessibility
- Min contrast ratio 4.5:1
- Focus states: 2px blue outline
- Alt text for all images
- ARIA labels for forms
- Keyboard navigation support

---

## 6. RESPONSIVE BREAKPOINTS
- Desktop: 1920px, 1440px, 1024px (fullscreen)
- Tablet: 768px (if needed later)
- Mobile: 375px (if needed later - currently Web only)

---

## 7. DELIVERABLES

### Figma Components Library
- [ ] Buttons (primary, secondary, danger - normal/hover/disabled)
- [ ] Input fields (text, email, number, textarea - normal/focus/error)
- [ ] Cards (standard, movie, combo, review)
- [ ] Badge/Tags (status, genre, discount)
- [ ] Modal overlay + dialog components
- [ ] Navbar (sticky header)
- [ ] Footer
- [ ] Pagination / Stepper components
- [ ] Notifications/Toasts
- [ ] Seat selector component (grid)
- [ ] Price breakdown component
- [ ] Star rating component

### Page Wireframes/High-Fi
- [ ] Landing / Home
- [ ] Login / Sign Up
- [ ] Movie Schedule
- [ ] Seat Selection
- [ ] Combo & Checkout
- [ ] My Tickets
- [ ] Movie Details & Reviews
- [ ] Admin Dashboard
- [ ] Admin Movie/Screening/Voucher/Combo Management
- [ ] Admin Reports

### Design Specs
- [ ] Color tokens
- [ ] Typography scale
- [ ] Spacing system
- [ ] Shadow/elevation rules
- [ ] Animation guidelines (if needed)

---

## 8. NOTES

- **Dark theme**: All screens use dark background (#1A1A1A) with light text
- **CTA emphasis**: Primary actions use red (#E63946) button
- **Status indicators**: Green (success), Red (error/unavailable), Yellow (selected/alert), Blue (info)
- **Icons**: Use simple, rounded icons (Figma built-in or Feather Icons recommended)
- **Animations**: Keep minimal, focus on usability (no heavy transitions)
- **Consistency**: Maintain Lumi Cinema branding from screenshots provided
- **Mini-timers**: Seat hold timer (5 min countdown) display prominently
- **Combo grill**: Show high-margin items first (Combo Lumi "BÁN CHẠY")
- **QR codes**: For ticket confirmation + reference number overlay

---

## 9. REFERENCE IMAGES
Provided: Lumi Cinema Figma screenshots (10 images) - Use as visual reference for:
- Dark theme color scheme
- Card layouts
- Button styles
- Movie grid presentation
- Seat map UI
- Combo display
- Review/rating display
- Admin dashboard metrics
