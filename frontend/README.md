# Wear Web Frontend

Frontend application built with React and Vite.

## Scope

This file covers frontend setup and implementation details only.

- Product usage and role flow: [../README.md](../README.md)
- Backend setup and implementation: [../backend/README.md](../backend/README.md)

## Tech Stack

- React 19
- React Router 7
- Zustand
- Axios
- Tailwind CSS 3
- Vite 8
- Stripe client SDK
- Recharts

## Architecture

### Entry

- src/main.jsx mounts the app and registers global browser error handlers.
- src/App.jsx mounts RouterProvider and top-level boundaries.

### Routing

- Router definition: src/app/router.jsx
- Route guards:
  - ProtectedRoute
  - GuestRoute
  - SellerApprovedRoute
- Layout composition:
  - MainLayout
  - AuthLayout
  - SellerLayout
  - SellerTopBarLayout
  - AdminLayout

### State Management

Zustand slices:

- authSlice
- cartSlice
- wishlistSlice
- notificationSlice
- uiSlice

Store exports are centralized in src/app/store.js.

### API Layer

API client: src/shared/services/apiClient.js

Implemented behaviors:

- bearer token injection in request interceptor
- request/response metrics hooks
- 401 refresh-token retry flow with in-flight de-duplication
- normalized getApiError helper

### Styling System

- Tailwind token extensions in tailwind.config.js
- semantic color variables
- spacing/radius/shadow/animation tokens
- theme switching controlled by UI store + root class

### Build Strategy

Vite chunk split configuration:

- router chunk
- charts chunk
- payments chunk
- vendor chunk

## Frontend Runtime Model

### Route Topology

The route tree in src/app/router.jsx is split by role and access level.

- public pages are rendered under MainLayout
- guest-only auth flows are rendered under AuthLayout
- customer protected pages are guarded by ProtectedRoute
- seller pages require both auth and approval checks through SellerApprovedRoute
- admin pages run under AdminLayout with role validation

This route split keeps each panel isolated while sharing one app shell and one API client.

### Request Lifecycle

1. UI action triggers feature hook mutation/query.
2. Hook calls feature API adapter.
3. Adapter calls shared apiClient instance.
4. Request interceptor injects bearer token.
5. On 401, refresh-token flow attempts one controlled retry.
6. Normalized response/error is returned to feature layer.
7. Store slice and local component state are updated.

### Auth and Session Handling

- access token is attached to outgoing API calls
- refresh flow is de-duplicated to prevent token refresh storms
- guarded routes redirect on missing/invalid session
- UI reacts to hold/block status and permission mismatches

### Checkout Integration Contract

The checkout UI depends on backend guarantees:

- selected cart item ids are transformed to order creation payload
- payment intent metadata returns client secret for Stripe Elements
- payment confirmation is mapped to success/failure states
- optimistic updates are minimized in payment-critical flows

### Notifications and Live Updates

- notification slice centralizes unread counters and list state
- polling or event triggers are merged in feature hooks
- UI badge counts are derived from store selectors

### Error Boundaries and Recovery

- top-level boundary in App shell catches render-time failures
- feature-level fallback states handle API/network failures
- getApiError normalization keeps message rendering consistent

### Performance Controls

- route-level lazy loading reduces initial bundle weight
- chart and payment dependencies are split into dedicated chunks
- slow HTTP threshold logging helps identify degraded endpoints
- memoized selectors reduce avoidable rerenders in dense pages

## Folder Structure

```text
frontend/
  src/
    app/
    features/
    pages/
    shared/
    styles/
    App.jsx
    main.jsx
  public/
  index.html
  vite.config.js
  tailwind.config.js
  postcss.config.js
  package.json
```

## Environment Variables

Create frontend/.env.

| Variable | Required | Purpose |
| --- | --- | --- |
| VITE_API_BASE_URL | Yes | Base URL for frontend API calls |
| VITE_STRIPE_PUBLISHABLE_KEY | Required for card UI | Stripe Elements initialization |
| VITE_LOG_HTTP_METRICS | Optional | Enable request/response metrics logs |
| VITE_HTTP_SLOW_MS | Optional | Slow-response threshold in ms |

Example:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_replace_me
VITE_LOG_HTTP_METRICS=true
VITE_HTTP_SLOW_MS=1200
```

## Local Setup

### Prerequisites

- Node.js 20+
- npm 10+
- running backend API

### Install

```bash
cd frontend
npm install
```

### Run

```bash
npm run dev
```

### Build and Preview

```bash
npm run build
npm run start
```

Build + preview in one command:

```bash
npm run start:prod
```

## Scripts

| Script | Command | Purpose |
| --- | --- | --- |
| dev | vite | Start dev server with HMR |
| build | vite build | Create production assets in dist |
| start | vite preview --host 0.0.0.0 --port 4173 | Preview build locally |
| start:prod | npm run build && vite preview --host 0.0.0.0 --port 5173 | Build then preview |

## Development Conventions

### Feature Module Pattern

Recommended structure in src/features/feature-name:

- api/
- hooks/
- components/
- utils/

Keep page route wrappers in src/pages and transport logic in feature api files.

### API Integration Pattern

1. Add endpoint constant in src/shared/constants/api.js.
2. Add API adapter in feature api module.
3. Normalize response in feature hook.
4. Invalidate relevant cache tags on writes.

### UI/State Pattern

- Server state in feature hooks
- Session state in auth slice
- Shared UI state in ui slice
- Component-local transient state in component scope

### File Ownership Guidance

- src/features: domain-specific UI + hooks + adapters
- src/pages: route entry wrappers and role-based composition
- src/shared: reusable components, constants, services, utilities
- src/styles: global tokens and cross-page style baselines

## Stripe and Payment UI Notes

- Stripe publishable key is read from VITE_STRIPE_PUBLISHABLE_KEY
- card capture components should mount only after key availability check
- payment confirmation should handle 3DS and declined-card branches
- never log card-sensitive fields in browser console output

## Observability and Debugging

- enable VITE_LOG_HTTP_METRICS to inspect request duration patterns
- tune VITE_HTTP_SLOW_MS to match environment baseline latency
- inspect network traces around checkout for intent/confirmation mismatch
- keep browser source maps enabled for staging validation

## Deployment Notes

- Set VITE_API_BASE_URL to deployed backend URL.
- Set Stripe publishable key for target environment.
- Serve dist with compression (gzip/brotli).
- Keep lazy route imports to control initial bundle size.

## Troubleshooting

### API calls failing

- Check VITE_API_BASE_URL.
- Check backend CORS CLIENT_URL.
- Check refresh-token endpoint reachability.

### Stripe UI not loading

- Check VITE_STRIPE_PUBLISHABLE_KEY.
- Check checkout page logs for Stripe init errors.

### Data appears stale

- Check invalidateTags in feature mutations.
- Check cache policy for impacted query.
