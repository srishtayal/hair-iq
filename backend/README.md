## Backend Setup

1. Install dependencies:
   npm install
2. Create environment file:
   cp .env.example .env
3. Set required env values:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `FIREBASE_SERVICE_ACCOUNT_PATH`
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - `CLOUDINARY_URL` (optional; if omitted, media is saved locally in `/uploads`)

## Run

1. Dev:
   npm run dev
2. Start:
   npm start

Startup does:
- `sequelize.authenticate()`
- `sequelize.sync({ alter: true })` (dev only; remove in production)

## Auth Login (Firebase)

`POST /auth/verify-firebase`

```json
{ "idToken": "<FIREBASE_ID_TOKEN>" }
```

Returns server JWT.
Use in protected routes:

`Authorization: Bearer <server-jwt>`

You can keep using Firebase test phone numbers for this flow.

## Product APIs

### Public
- `GET /products?page=1&limit=12&search=&category=`
- `GET /products/:slug`

### Admin (JWT + admin role)
- `POST /admin-api/products`
- `PUT /admin-api/products/:id`
- `DELETE /admin-api/products/:id`
- `POST /admin-api/products/:id/variants`
- `PUT /admin-api/products/:id/variants/:variantId`
- `POST /admin-api/products/:id/media` (multipart/form-data: `file`)

## Wishlist APIs (Authenticated)

- `POST /wishlist`

```json
{ "productId": "<product-uuid>" }
```

- `GET /wishlist`
- `DELETE /wishlist/:productId`

Duplicate add returns `409`.

## Address APIs (Authenticated)

- `POST /addresses`

```json
{
  "fullName": "John Doe",
  "phone": "+919999999999",
  "addressLine1": "221B Baker Street",
  "addressLine2": "Near Metro",
  "city": "Bengaluru",
  "state": "Karnataka",
  "pincode": "560001",
  "isDefault": true
}
```

- `GET /addresses`
- `PUT /addresses/:id`
- `DELETE /addresses/:id`

## Cart APIs (Guest + Logged-In)

- `POST /cart/add`

Guest request:

```json
{ "productVariantId": "<variant-uuid>", "quantity": 2, "sessionId": "guest-abc-123" }
```

Logged-in request:

```json
{ "productVariantId": "<variant-uuid>", "quantity": 2 }
```

- `GET /cart?sessionId=guest-abc-123` (guest)
- `GET /cart` with bearer token (logged-in)
- `PUT /cart/item/:id`

```json
{ "quantity": 3, "sessionId": "guest-abc-123" }
```

- `DELETE /cart/item/:id?sessionId=guest-abc-123` (guest)
- `DELETE /cart/item/:id` with bearer token (logged-in)

### Merge guest cart into user cart

`POST /cart/merge` (authenticated)

```json
{ "sessionId": "guest-abc-123" }
```

## Order + Razorpay APIs

### Create order (authenticated)

`POST /orders/create`

From cart:

```json
{
  "cartId": "<cart-uuid>",
  "addressId": "<address-uuid>",
  "couponCode": "NEWUSER10"
}
```

Direct items:

```json
{
  "items": [
    { "productVariantId": "<variant-uuid>", "quantity": 2 }
  ],
  "addressId": "<address-uuid>",
  "couponCode": "NEWUSER10"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "orderId": "...",
    "razorpayOrderId": "order_...",
    "razorpayKeyId": "rzp_test_...",
    "amount": 159900
  }
}
```

### Razorpay webhook

`POST /webhooks/razorpay`

- Verify signature via `x-razorpay-signature`
- On `payment.captured`:
  - Payment -> `paid`
  - Order -> `paymentStatus=paid`, `orderStatus=confirmed`
  - Reduce stock in DB transaction
  - Save full webhook payload in `payments.rawResponse`

### Quick checkout order (authenticated)

`POST /payments/create-order`

```json
{
  "amountInRupees": 499
}
```

Response:

```json
{
  "success": true,
  "data": {
    "razorpayOrderId": "order_...",
    "razorpayKeyId": "rzp_test_...",
    "amount": 49900,
    "currency": "INR",
    "codEnabled": false
  }
}
```

If COD is enabled (`RAZORPAY_ENABLE_COD=true`), send Magic Checkout line items:

```json
{
  "amountInRupees": 499,
  "lineItems": [
    {
      "sku": "VARIANT_1",
      "variant_id": "VARIANT_1",
      "price": 49900,
      "offer_price": 49900,
      "tax_amount": 0,
      "quantity": 1,
      "name": "Signature Lace Pro",
      "description": "Breathable lace hair patch",
      "image_url": "https://example.com/image.jpg",
      "product_url": "https://example.com/products/signature-lace-pro"
    }
  ]
}
```

### Verify Razorpay payment signature

`POST /orders/verify-signature`

```json
{
  "razorpay_order_id": "order_...",
  "razorpay_payment_id": "pay_...",
  "razorpay_signature": "..."
}
```

### COD order (authenticated)

`POST /orders/cod`

```json
{
  "items": [
    { "productVariantId": "<variant-uuid>", "quantity": 1 }
  ],
  "customerDetails": {
    "fullName": "Rahul Sharma",
    "phone": "+919999999999",
    "addressLine1": "221B Baker Street",
    "addressLine2": "Near Metro",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pincode": "560001"
  }
}
```

Behavior:
- Creates order with `orderStatus=COD_PENDING`, `paymentStatus=COD_PENDING`
- No Razorpay payment is created for COD

### Mark COD order delivered + paid (admin)

`PATCH /orders/:id/cod-delivered`

Behavior:
- Allowed only for admin user
- Converts `COD_PENDING` order to `orderStatus=delivered`, `paymentStatus=paid`

### Magic Checkout support APIs (public)

`POST /magic-checkout/shipping-info`

`POST /magic-checkout/get-promotions`

`POST /magic-checkout/apply-promotions`

These APIs are used by Razorpay Magic Checkout for COD/shipping/promotions.

Set these in Razorpay Magic Checkout dashboard:

- Shipping Info API URL: `https://<your-domain>/magic-checkout/shipping-info`
- Get Promotions API URL: `https://<your-domain>/magic-checkout/get-promotions`
- Apply Promotions API URL: `https://<your-domain>/magic-checkout/apply-promotions`

## Razorpay Sample Code

Create Razorpay order:

```js
const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
const order = await razorpay.orders.create({ amount: 159900, currency: 'INR', receipt: 'order-receipt-1' });
```

Verify webhook signature (HMAC-SHA256):

```js
const crypto = require('crypto');
const expected = crypto
  .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
  .update(rawBody)
  .digest('hex');
const isValid = expected === req.headers['x-razorpay-signature'];
```

## Postman + Razorpay Sandbox Test

1. Use Razorpay test keys (`rzp_test_...`) in `.env`.
2. Login and get server JWT.
3. Call `POST /orders/create` with JWT.
4. Simulate webhook in Postman:
   - URL: `POST http://localhost:5000/webhooks/razorpay`
   - Header: `Content-Type: application/json`
   - Header: `x-razorpay-signature: <computed_signature>`
   - Body (raw JSON), sample:

```json
{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_test_123",
        "order_id": "order_XXXXXXXX",
        "status": "captured",
        "amount": 159900
      }
    }
  }
}
```

5. Generate signature for test payload (exact raw body string):

```bash
BODY='{"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_test_123","order_id":"order_XXXXXXXX","status":"captured","amount":159900}}}}'
echo -n "$BODY" | openssl dgst -sha256 -hmac "$RAZORPAY_KEY_SECRET"
```

Use resulting hex digest as `x-razorpay-signature`.

## Troubleshooting

- `Unauthorized`: token missing/invalid or wrong bearer format
- `Forbidden`: user is not admin for admin routes
- `Insufficient stock`: requested quantity is above variant stock
- `Invalid webhook signature`: payload string used for HMAC differs from sent body
- `ENOTFOUND db....supabase.co`: incorrect DB host/project ref

## AdminJS Panel (Non-Technical Guide)

Admin dashboard URL:
- `http://localhost:5000/admin`

Login:
- Email: value from `ADMIN_EMAIL` in backend `.env`
- Password: value from `ADMIN_PASSWORD` in backend `.env`

How to create products:
1. Open **Catalog > Product**
2. Click **New** and fill name, slug, description, category, quantity, active status
3. Save
4. Open **Catalog > ProductVariant**
5. Click **New**, select the product, add SKU/price/stock/size/color/density, save
6. Open **Catalog > ProductMedia**
7. Click **New**, select product, set type (`image`/`video`), upload file, save

How to manage orders:
1. Open **Orders > Order**
2. View `paymentStatus`, `orderStatus`, `trackingId`, totals, timestamps
3. Open **Orders > OrderItem** to see item-level quantities and prices

Notes:
- Admin product APIs are available under `/admin-api/*` for Postman/integration use.
- AdminJS is for operations team usage via browser.
