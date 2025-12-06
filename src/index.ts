import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { db } from './db/db';
import { userApi } from './api/users';
import { productApi } from './api/products';
import { reviewApi } from './api/reviews';
import { orderApi } from './api/orders';
import { auctionApi } from './api/auctions';
import { storefrontApi } from './api/storefronts';

const app = new Elysia()
  .use(
    swagger({
      path: '/api-docs',
      documentation: {
        info: {
          title: 'Haizra API',
          description: 'API documentation for Haizra E-commerce Platform',
          version: '1.0.0',
        },
        tags: [
          { name: 'General', description: 'General health checks and root endpoints' },
          { name: 'User', description: 'User management and authentication' },
          { name: 'Products', description: 'Endpoints for managing products' },
          { name: 'Reviews', description: 'Endpoints for retrieving reviews' },
          { name: 'Orders', description: 'Order processing, payments, and escrow.' },
          { name: 'Auctions', description: 'Bidding and Auction management.' },
          { name: 'Storefront', description: 'Manage seller storefronts and verification.' },
        ],
      },
    })
  )
  .decorate('db', db)
  // --- Mount API modules ---
  .use(userApi)
  .use(productApi)
  .use(reviewApi)
  .use(orderApi)
  .use(auctionApi)
  .use(storefrontApi)
  .get('/', () => 'Haizra Backend is Live', {
    detail: {
      tags: ['General'], 
      summary: 'Root Welcome Message',
    }
  });

app.listen(process.env.PORT || 3000);

console.log(
  `🦊 Haizra API is running at http://${app.server?.hostname}:${app.server?.port}`
);
console.log(
  `Swagger UI available at http://${app.server?.hostname}:${app.server?.port}/api-docs`
);