import { Elysia, t } from 'elysia';
import { db } from '../db/db';
import { users as usersSchema, storefronts as storefrontsSchema } from '../db/schema/users'; 
import { products as productsSchema } from '../db/schema/products'; 
import { eq } from 'drizzle-orm';
import { auth } from '../utils/auth';

const CreateStoreBody = t.Object({
    storeName: t.String(),
    description: t.Optional(t.String())
});

// Auth Header Schema
const AuthHeader = t.Object({
    authorization: t.Optional(t.String({ description: 'Bearer <token>' }))
});

export const storefrontApi = new Elysia()
    .use(auth)
    .group('/store', {
        detail: {
            tags: ['Storefront']

        }
    }, (app) => app
        // -------------------------------------------------------------------
        // A. POST /apply-verification - Request Seller Verification
        // -------------------------------------------------------------------
        .post('/apply-verification', async ({ set, headers, jwt }) => {
            const token = headers.authorization?.split(' ')[1];
            if (!token) { set.status = 401; return { error: 'Unauthorized' }; }
            const profile = await jwt.verify(token);
            if (!profile) { set.status = 401; return { error: 'Unauthorized' }; }

            // Update status to pending
            await db.update(usersSchema)
                .set({ idVerificationStatus: 'pending' })
                .where(eq(usersSchema.id, profile.id as string));

            return { message: 'Verification application submitted. Admin will review your ID.' };
        }, {
            headers: AuthHeader,
            detail: { 
                summary: 'Apply for Verification', 
                description: 'Sets user ID verification status to pending. Requires Auth Token.',
                security: [{ bearerAuth: [] }]
            }
        })

        // -------------------------------------------------------------------
        // B. POST / - Create/Update Storefront
        // -------------------------------------------------------------------
        .post('/', async ({ body, set, headers, jwt }) => {
            const token = headers.authorization?.split(' ')[1];
            if (!token) { set.status = 401; return { error: 'Unauthorized' }; }
            const profile = await jwt.verify(token);
            if (!profile) { set.status = 401; return { error: 'Unauthorized' }; }
            const userId = profile.id as string;

            // Check if user is verified seller (Requirement?)
            const [user] = await db.select().from(usersSchema).where(eq(usersSchema.id, userId)).limit(1);
            if (!user?.isVerifiedSeller) {
                // Optional: Block if not verified? Or allow creating store but mark as unverified?
                // User requirement: "upgrade option to be able to register a business... so they can be verified sellers"
                // We'll allow creating the store entry, but maybe it's hidden until verified.
            }

            // Upsert Storefront
            const [existingStore] = await db.select().from(storefrontsSchema).where(eq(storefrontsSchema.userId, userId)).limit(1);
            
            if (existingStore) {
                 const [updated] = await db.update(storefrontsSchema)
                    .set({ storeName: body.storeName, description: body.description })
                    .where(eq(storefrontsSchema.id, existingStore.id))
                    .returning();
                 
                 if (!updated) { set.status = 500; return { error: 'Internal Server Error' }; }
                 return { message: 'Store updated', store: updated };
            } else {
                 const [created] = await db.insert(storefrontsSchema)
                    .values({ userId, storeName: body.storeName, description: body.description })
                    .returning();
                 
                 if (!created) { set.status = 500; return { error: 'Internal Server Error' }; }
                 set.status = 201;
                 return { message: 'Store created', store: created };
            }
        }, {
            body: CreateStoreBody,
            headers: AuthHeader,
            detail: { 
                summary: 'Create/Update Store', 
                security: [{ bearerAuth: [] }]
            }
        })

        // -------------------------------------------------------------------
        // C. GET /:userId - Get Storefront by User ID
        // -------------------------------------------------------------------
        .get('/:userId', async ({ params: { userId }, set }) => {
            const [store] = await db.select().from(storefrontsSchema).where(eq(storefrontsSchema.userId, userId)).limit(1);

            if (!store) {
                set.status = 404;
                return { error: 'Store not found for this user.' };
            }

            const [user] = await db.select({
                username: usersSchema.username,
                profilePictureUrl: usersSchema.profilePictureUrl,
                sellerRating: usersSchema.sellerRating,
                isVerifiedSeller: usersSchema.isVerifiedSeller
            }).from(usersSchema).where(eq(usersSchema.id, store.userId)).limit(1);

            return {
                ...store,
                user
            };
        }, {
            detail: { summary: 'Get Storefront', description: 'Get public storefront details.' }
        })
    );