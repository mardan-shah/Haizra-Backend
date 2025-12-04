import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { db } from './db/db';
import { usersRoute } from './api/users'; // Import the usersRoute

const app = new Elysia()
  .use(
    swagger({
      path: '/api-docs',
      documentation: {
        info: {
          title: 'Haizra API',
          description: 'API documentation for Haizra',
          version: '1.0.0',
        },
        tags: [
          {
            name: '/',
            description: 'General health checks and root endpoints',
          },
          {
            name: 'Users',
            description: 'User management',
          },       
        ],
      },
    })
  )
  .decorate('db', db)
    .use(usersRoute) 
  .get('/', () => 'Haizra Backend is Live', {
    detail: {
      tags: ['/'], 
      summary: 'Root Welcome Message',
    }
  });

app.listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}/api-docs`
);