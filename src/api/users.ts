import { Elysia, t } from 'elysia';
import { db } from '../db/db';
import { users } from '../db/schema';

// Exported instance, configured to automatically tag all nested routes
export const usersRoute = new Elysia()
  // ------------------------------------------------------------------
  // FIX: Use the .group() method's second argument to apply hooks/detail.
  // This ensures the tag is inherited by all subsequent routes in this group.
  // ------------------------------------------------------------------
  .group('/users', {
    // 🛑 Direct property setting on the group hook guarantees inheritance
    detail: {
      tags: ['Users'], 
      summary: 'User Management Operations',
    }
  }, (app) =>
    app
      .get('/', async () => {
        return await db.select().from(users);
      })
      .post(
        '/',
        async ({ body }) => {
          await db.insert(users).values(body).execute();
          return { message: 'User created successfully' };
        },
        {
          body: t.Object({
            email: t.String(),
            password: t.String(),
            firstName: t.String(),
            lastName: t.String(),
            address: t.String(),
            city: t.String(),
            state: t.String(),
            country: t.String(),
            zipCode: t.String(),
            phone: t.String(),
            username: t.String(),
          }),
          // Optional: You can override or add to the inherited detail here
          detail: {
              summary: 'Create a new user', 
          }
        }
      )
  );