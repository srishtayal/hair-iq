# Hair IQ - Premium Men's Hair Patch E-commerce (Next.js)

A fully responsive e-commerce scaffold for the Hair IQ brand, built with Next.js App Router, React, Tailwind CSS, and Framer Motion.

## Stack

- Next.js (App Router)
- React 19
- Tailwind CSS
- Framer Motion
- TypeScript

## Run

```bash
npm install
npm run dev
```

## Environment

Create `.env.local` in `/Users/srishtitayal/Projects/hairIQ/frontend`:

```bash
NEXT_PUBLIC_BACKEND_BASE_URL=http://localhost:5000
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_RAZORPAY_ENABLE_COD=false
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_META_PIXEL_ID=123456789012345
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN=your_public_storefront_token
NEXT_PUBLIC_SHOPIFY_STOREFRONT_API_VERSION=2026-07
```

### Shopify product catalog (optional)

When the three `NEXT_PUBLIC_SHOPIFY_*` variables are set, the storefront loads products, variants, prices, and images from Shopify. Selecting checkout creates a Shopify Cart and redirects the buyer to Shopify Checkout, where delivery details and payment are collected. The current Express catalog and Razorpay/COD checkout remain the fallback when the Shopify variables are absent.

Also enable Phone auth in Firebase Console.

After OTP verification in `/auth`, frontend gets Firebase `idToken` via:
- `const idToken = await userCredential.user.getIdToken()`

Then it calls backend:
- `POST /auth/verify-firebase` with body `{ "idToken": "<firebase-id-token>" }`

### Razorpay checkout

Cart checkout now opens Razorpay and verifies the payment signature via backend.

Required backend env (in `/Users/srishtitayal/Projects/hairIQ/backend/.env`):

- `RAZORPAY_KEY_ID=rzp_test_...`
- `RAZORPAY_KEY_SECRET=...`
- `RAZORPAY_ENABLE_COD=true` (for Razorpay Magic Checkout COD)

## Routes

- `/` Home
- `/products` Product listing with filters/sorting
- `/products/[id]` Product detail with gallery, variants, reviews
- `/videos` Video library with modal player
- `/profile` Profile dashboard
- `/auth` Mobile OTP login/signup
- `/order-tracking` Tracking timeline
- `/cart` Cart with editable quantities and summary
- `/wishlist` Wishlist with move-to-cart

## Reusable Components

- `Navbar`
- `Footer`
- `ProductCard`
- `VideoCard`
- `ReviewCard`
- `FilterSidebar`
- `CartItem`
- `Skeleton`
- `EmptyState`

## Notes

- Cart is available without login.
- Login is required for wishlist, order tracking, and checkout action.
- Auth session persists in browser local storage and expires after 30 days.
