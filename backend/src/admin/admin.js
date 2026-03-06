const path = require('path');
const fs = require('fs');
const { User, Product, ProductVariant, ProductMedia, Order, OrderItem, Coupon } = require('../models');

const buildProductShowPreview = () => async (response) => {
  if (!response.record || !response.record.params?.id) return response;

  const productId = response.record.params.id;

  const [variants, media] = await Promise.all([
    ProductVariant.findAll({ where: { productId }, order: [['createdAt', 'DESC']], limit: 50 }),
    ProductMedia.findAll({ where: { productId }, order: [['sortOrder', 'ASC']], limit: 50 }),
  ]);

  response.record.params.variantsPreview = variants.length
    ? variants
        .map((v) => `${v.sku} | ${v.size || '-'} | ${v.color || '-'} | Rs ${v.price / 100} | stock=${v.stockQuantity}`)
        .join('\n')
    : 'No variants yet';

  response.record.params.mediaPreview = media.length
    ? media.map((m) => `${m.type} | sort=${m.sortOrder} | ${m.url}`).join('\n')
    : 'No media yet';

  return response;
};

const mountAdmin = async (app) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set to enable AdminJS');
  }

  const [adminModule, adminExpressModule, sequelizeAdapterModule, uploadModule] = await Promise.all([
    import('adminjs'),
    import('@adminjs/express'),
    import('@adminjs/sequelize'),
    import('@adminjs/upload'),
  ]);

  const AdminJS = adminModule.default || adminModule;
  const ComponentLoader = adminModule.ComponentLoader;
  const AdminJSExpress = adminExpressModule.default || adminExpressModule;
  const AdminJSSequelize = sequelizeAdapterModule.default || sequelizeAdapterModule;
  const uploadFeature = uploadModule.default || uploadModule;
  const componentLoader = new ComponentLoader();
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  AdminJS.registerAdapter({
    Database: AdminJSSequelize.Database,
    Resource: AdminJSSequelize.Resource,
  });

  const admin = new AdminJS({
    rootPath: '/admin',
    componentLoader,
    branding: {
      companyName: 'HairIQ Admin',
    },
    resources: [
      {
        resource: User,
        options: {
          navigation: { name: 'Users', icon: 'User' },
          listProperties: ['id', 'name', 'phone', 'email', 'role', 'createdAt'],
          editProperties: ['name', 'phone', 'email', 'role', 'firebase_uid'],
          filterProperties: ['name', 'phone', 'email', 'role'],
        },
      },
      {
        resource: Product,
        options: {
          navigation: { name: 'Catalog', icon: 'Product' },
          listProperties: ['id', 'name', 'slug', 'price', 'category', 'quantity', 'isActive', 'createdAt'],
          editProperties: ['name', 'slug', 'shortDescription', 'longDescription', 'price', 'category', 'quantity', 'isActive'],
          showProperties: [
            'id',
            'name',
            'slug',
            'shortDescription',
            'longDescription',
            'price',
            'category',
            'quantity',
            'isActive',
            'variantsPreview',
            'mediaPreview',
            'createdAt',
            'updatedAt',
          ],
          properties: {
            shortDescription: {
              type: 'textarea',
              props: {
                rows: 4,
              },
            },
            longDescription: {
              type: 'textarea',
              props: {
                rows: 14,
              },
            },
            variantsPreview: {
              type: 'textarea',
              isVisible: { list: false, filter: false, show: true, edit: false },
              label: 'Variants (Linked: ProductVariant resource)',
            },
            mediaPreview: {
              type: 'textarea',
              isVisible: { list: false, filter: false, show: true, edit: false },
              label: 'Media (Linked: ProductMedia resource)',
            },
          },
          actions: {
            show: {
              after: buildProductShowPreview(),
            },
          },
        },
      },
      {
        resource: ProductVariant,
        options: {
          navigation: { name: 'Catalog', icon: 'Product' },
          listProperties: ['id', 'productId', 'sku', 'price', 'stockQuantity', 'size', 'color', 'density'],
          editProperties: ['productId', 'sku', 'price', 'stockQuantity', 'size', 'color', 'density'],
          properties: {
            productId: {
              reference: 'products',
            },
          },
        },
      },
      {
        resource: ProductMedia,
        options: {
          navigation: { name: 'Catalog', icon: 'Product' },
          listProperties: ['id', 'productId', 'type', 'url', 'sortOrder', 'createdAt'],
          editProperties: ['productId', 'type', 'sortOrder', 'uploadFile'],
          properties: {
            productId: {
              reference: 'products',
            },
            uploadFile: {
              isVisible: { list: false, filter: false, show: false, edit: true },
            },
            url: {
              isVisible: { list: true, filter: false, show: true, edit: false },
            },
          },
        },
        features: [
          uploadFeature({
            componentLoader,
            provider: {
              local: {
                bucket: path.join(process.cwd(), 'uploads'),
                opts: {
                  baseUrl: '/uploads',
                },
              },
            },
            properties: {
              key: 'url',
              file: 'uploadFile',
            },
            uploadPath: (record, filename) => {
              const productId = record.get('productId') || 'unknown-product';
              return `product-media/${productId}/${Date.now()}-${filename}`;
            },
          }),
        ],
      },
      {
        resource: Order,
        options: {
          navigation: { name: 'Orders', icon: 'PurchaseTag' },
          listProperties: ['id', 'userId', 'totalAmount', 'paymentStatus', 'orderStatus', 'trackingId', 'createdAt'],
          showProperties: [
            'id',
            'userId',
            'addressId',
            'totalAmount',
            'shippingAmount',
            'discountAmount',
            'paymentStatus',
            'orderStatus',
            'trackingId',
            'createdAt',
            'updatedAt',
          ],
        },
      },
      {
        resource: OrderItem,
        options: {
          navigation: { name: 'Orders', icon: 'PurchaseTag' },
          listProperties: ['id', 'orderId', 'productVariantId', 'quantity', 'priceAtPurchase'],
          properties: {
            orderId: { reference: 'orders' },
            productVariantId: { reference: 'product_variants' },
          },
        },
      },
      {
        resource: Coupon,
        options: {
          navigation: { name: 'Promotions', icon: 'Discount' },
          listProperties: ['id', 'code', 'discountType', 'value', 'expiresAt', 'usageLimit', 'createdAt'],
          editProperties: ['code', 'discountType', 'value', 'minOrderValue', 'maxDiscount', 'expiresAt', 'usageLimit'],
        },
      },
    ],
  });

  // Use AdminJS authenticated router (cookie-based login) instead of HTTP Basic auth.
  // This provides a login page and avoids returning JSON 401 responses for unauthenticated
  // requests to the admin UI.
  const cookiePassword = process.env.ADMIN_COOKIE_PASSWORD || `${adminPassword}-${Date.now()}`;

  const router = AdminJSExpress.buildAuthenticatedRouter(
    admin,
    {
      authenticate: async (email, password) => {
        if (email === adminEmail && password === adminPassword) {
          return Promise.resolve({ email });
        }
        return null;
      },
      cookieName: process.env.ADMIN_COOKIE_NAME || 'adminjs',
      cookiePassword,
    },
    null,
    {
      resave: false,
      saveUninitialized: true,
    }
  );

  app.use(admin.options.rootPath, router);

  return {
    rootPath: admin.options.rootPath,
  };
};

module.exports = {
  mountAdmin,
};
