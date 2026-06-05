
# We Are Going — Community ERP + Social Network

A frontend-only, fully mocked React build of a multi-role community portal with a custom "Sandstone & Sapphire" design system, 3D card interactions, Framer Motion transitions, and Recharts analytics.

## Important stack note (please confirm)

The project is on **TanStack Start + TanStack Router** (file-based routing in `src/routes/`), not React Router DOM. I will implement routing the TanStack Start way — same URLs, same UX, same `AnimatePresence` page transitions — just using `createFileRoute` and `<Link>` from `@tanstack/react-router`. If you'd prefer I rip out TanStack and install `react-router-dom` instead, say so before I start; otherwise I'll proceed with TanStack.

Everything else (Tailwind, Framer Motion, Lucide, Recharts, mock data, design system) matches your brief exactly.

## Scope

This is a very large build (3 dashboards, ~40+ pages, ~15 mock data files, full plan/subscription/matrimony/ads modules). I will deliver it in **one full pass** — every route built to production quality, no placeholders, no "coming soon" panels.

## Design system

- Install Google Fonts: Plus Jakarta Sans, Lora, DM Sans
- `src/styles.css`: replace tokens with Sandstone & Sapphire palette in `oklch`, register semantic tokens (`--background`, `--primary`, `--accent`, `--gold`, `--teal`, `--surface`, etc.), add card shadow utility, gold geometric SVG pattern as a background utility, focus ring
- Tailwind utilities for `bg-surface`, `bg-sand`, `bg-lavender`, `text-gold`, `text-teal`, `border-warm`
- Shared primitives in `src/components/ui-wag/`: `AnimatedCard` (3D tilt + shine), `PageTransition`, `StatCard` (counter), `StatusBadge`, `PlanBadge`, `DataTable`, `StepWizard`, `SearchFilterBar`, `DetailDrawer`, `ConfirmModal`, `AvatarCircle`, `EmptyState`, `NotificationToast`, `ModulePermissionGrid`, `PlanComparisonTable`, `ProgressRing`, `SkeletonCard`, `GeometricPattern`, `FloatingOrbs`

## Routing tree (TanStack file routes)

```
src/routes/
  __root.tsx                  (Navbar + Footer + AnimatePresence + AuthProvider)
  index.tsx                   Home
  communities.tsx             Public communities listing
  directory.tsx               Public member directory teaser
  events.tsx                  Public events
  jobs.tsx                    Public jobs
  matrimony.tsx               Public matrimony teaser
  login.tsx
  register.tsx                Member 6-step wizard
  register.community.tsx      Community 5-step wizard
  _authenticated.tsx          Auth gate (reads AuthContext)
  _authenticated/dashboard/...        Member dashboard + 12 sub-pages
  _authenticated/community-admin/...  Community admin + 14 sub-pages
  _authenticated/admin/...            Super admin + 14 sub-pages (incl. subscriptions sub-nav)
```

## Auth

`src/context/AuthContext.tsx` — React context backed by `localStorage`. Roles: `member | community_admin | super_admin`. Login page exposes 3 quick-login demo buttons. `_authenticated` layout redirects to `/login` if no user; role-mismatched routes redirect to the user's own dashboard.

## Mock data (`src/data/`)

`communities.js`, `members.js`, `events.js`, `jobs.js`, `businesses.js`, `matrimony.js`, `donations.js`, `news.js`, `committee.js`, `families.js`, `plans.js`, `transactions.js`, `coupons.js`, `advertisements.js`, `notifications.js`. All entries include realistic Unsplash URLs for covers/avatars/banners.

## Pages

**Public:** Home (hero w/ parallax + floating stat cards, counters, features grid, hierarchy SVG tree, featured communities scroll, how-it-works, events/matrimony/business/testimonials/app-download sections), Communities, Directory, Events, Jobs, Matrimony, Login (split panel), Member Register (6-step wizard w/ success), Community Register (5-step wizard w/ success).

**Member dashboard:** Home, My Profile (tabs), My Family, Member Directory (card/list/map toggle + drawer), Business Directory, Matrimony, Jobs, Events, Donations, Notifications, My Plan, Settings.

**Community admin:** Overview (charts + approvals), Members (tabs + drawer), Committee, Families (tree view), Events (CRUD), News, Gallery, Donations, Jobs, Businesses, Matrimony (incl. Create Match flow with confetti), Reports, My Plan, Settings.

**Super admin:** Dashboard (KPIs + area/pie/bar charts + queue), Communities, Members, Committee, Events, Matrimony (full module incl. manual match), Jobs & Businesses, Donations, Advertisements (slot grid + schedule timeline), **Subscriptions** (Plans builder w/ ModulePermissionGrid, Community Subs, Member Subs, Transactions, Coupons), Reports, CMS, Roles & Permissions, Settings.

## Animation system

- `PageTransition` wraps each route's component with `AnimatePresence` keyed by pathname
- `AnimatedCard` implements mouse-tracked `rotateX/rotateY` with `transformPerspective: 1000`, spring 300/30, white-gradient shine overlay
- Hero floating cards: independent `y` + `rotateZ` loops with offsets
- Scroll reveal via `useInView` + staggered children
- Counters via `requestAnimationFrame` easeOut
- Sidebar collapse spring (260/28), step wizard lateral slide, drawer/modal spring, toast w/ shrinking progress bar
- Recharts: `isAnimationActive`, custom tooltip styled to theme
- Background: floating sapphire orbs + gold gradient waves + low-opacity Indian geometric SVG motif

## 3D / glass / parallax

- Multi-layer shadows + `backdrop-blur-xl` glass containers for hero widgets
- Hero parallax layers driven by `useMotionValue` mouse tracking
- Card hover: lift, shadow expand, image zoom, border glow, shine sweep
- Skeleton shimmer loaders for cards/tables/dashboards
- Custom SVG empty-state illustrations (no-events, no-jobs, no-matches, no-notifications, no-businesses)

## Responsive

Mobile bottom nav for authenticated routes, hamburger overlay for public nav, swipeable horizontal scrolls, touch-friendly tap targets, image `loading="lazy"`.

## Out of scope (frontend-only, explicit)

- No backend, no real auth, no real payments, no real file uploads — all "upload" inputs accept a file and show a local preview only
- Map view is a styled placeholder with dot clusters (no Mapbox/Leaflet)
- PDF/Excel/CSV export buttons are UI-only (no actual file generation)
- QR codes are styled placeholder squares

## Deliverable

One large build. After it lands, you can ask for targeted refinements per page. Ready to proceed on **build mode** confirmation — and please confirm TanStack Router is OK (vs swapping to react-router-dom).
