import { Elysia, t } from 'elysia';
import { db } from '../db/db';
import { reviews as reviewsSchema } from '../db/schema/ratings';
import { orders as ordersSchema, orderItems as orderItemsSchema } from '../db/schema/orders';
import { products as productsSchema } from '../db/schema/products';
import { users as usersSchema } from '../db/schema/users';
import { eq, or, and, desc } from 'drizzle-orm';
import { auth } from '../utils/auth';

// -------------------------------------------------------------------
// 1. SCHEMAS FOR VALIDATION AND DOCUMENTATION
// -------------------------------------------------------------------

// Schema for Creating a Review
const CreateReviewBody = t.Object({
    orderId: t.Numeric(),
    rating: t.Numeric({ minimum: 1, maximum: 5 }),
    comment: t.Optional(t.String()),
    targetType: t.Union([t.Literal('product'), t.Literal('seller')]), // Simplified for typical flow
    targetProductId: t.Optional(t.Numeric({ description: 'Required if targetType is product' }))
});

// Schema for a User ID parameter in the URL
const UserIdParam = t.Object({
    userId: t.Numeric({ description: 'The unique numeric ID of the user whose reviews are being requested.' })
});

// -------------------------------------------------------------------
// 2. REVIEWS API ROUTES (/reviews)
// -------------------------------------------------------------------

export const reviewApi = new Elysia()
    .use(auth)
    .group('/reviews', {
        detail: {
            tags: ['Reviews']
        }
    }, (app) => 
        app
        // -------------------------------------------------------------------
        // A. POST / - Create a Review
        // -------------------------------------------------------------------
        .post('/', async ({ body, set, headers, jwt }) => {
            const token = headers.authorization?.split(' ')[1];
            if (!token) { set.status = 401; return { error: 'Unauthorized' }; }
            const profile = await jwt.verify(token);
            if (!profile) { set.status = 401; return { error: 'Unauthorized' }; }
            const reviewerId = Number(profile.id);

            // 1. Verify Order Existence & Ownership
            const [order] = await db.select().from(ordersSchema).where(eq(ordersSchema.id, body.orderId)).limit(1);

            if (!order) { set.status = 404; return { error: 'Order not found' }; }
            if (order.buyerId !== reviewerId) {
                set.status = 403;
                return { error: 'Forbidden', message: 'You can only review orders you purchased.' };
            }
            if (order.status !== 'delivered') {
                set.status = 400;
                return { error: 'Bad Request', message: 'You can only review delivered orders.' };
            }

            // Fetch items to verify product was in order
            const items = await db.select().from(orderItemsSchema).where(eq(orderItemsSchema.orderId, order.id));

            let targetSellerId = null;
            let targetProductId = null;

            // 2. Determine Target Logic
            if (body.targetType === 'product') {
                if (!body.targetProductId) {
                    set.status = 400; 
                    return { error: 'Missing Field', message: 'targetProductId is required for product reviews.' };
                }
                // Check if product was actually in the order
                const itemInOrder = items.find(i => i.productId === body.targetProductId);
                if (!itemInOrder) {
                    set.status = 400;
                    return { error: 'Invalid Product', message: 'This product was not in the specified order.' };
                }
                targetProductId = body.targetProductId;
                
                // Optional: Get seller ID from product to link it if needed, though schema allows null
                const [prod] = await db.select().from(productsSchema).where(eq(productsSchema.id, targetProductId)).limit(1);
                if (prod) targetSellerId = prod.sellerId;

            } else if (body.targetType === 'seller') {
                // Find a seller from the order items
                if (items.length > 0) {
                    const firstItem = items[0]; // Type narrowing
                    if (firstItem) {
                        const [prod] = await db.select().from(productsSchema).where(eq(productsSchema.id, firstItem.productId)).limit(1);
                        if (prod) targetSellerId = prod.sellerId;
                    }
                }
            }

            // 3. Prevent Duplicate Reviews
            const [existing] = await db.select().from(reviewsSchema).where(and(
                eq(reviewsSchema.reviewerId, reviewerId),
                eq(reviewsSchema.orderId, body.orderId),
                eq(reviewsSchema.reviewTargetType, body.targetType)
            )).limit(1);

            if (existing) {
                set.status = 409;
                return { error: 'Conflict', message: 'You have already reviewed this target for this order.' };
            }

            try {
                const [newReview] = await db.insert(reviewsSchema).values({
                    reviewerId,
                    orderId: body.orderId,
                    rating: body.rating,
                    comment: body.comment,
                    reviewTargetType: body.targetType,
                    targetProductId,
                    targetSellerId,
                    isNegative: body.rating <= 2 // Auto-flag negative reviews
                }).returning();

                if (!newReview) throw new Error('Failed to create review');

                return { message: 'Review posted', review: newReview };
            } catch (e: any) {
                if (e.code === '23505') { // Unique violation (just in case race condition)
                    set.status = 409;
                    return { error: 'Conflict', message: 'You have already reviewed this target for this order.' };
                }
                throw e;
            }

        }, {
            body: CreateReviewBody,
            detail: { summary: 'Post Review', description: 'Rate a product or seller based on a delivered order.' }
        })

        // -------------------------------------------------------------------
        // B. GET /reviews/for-user/:userId - Retrieve all reviews for a specific user
        // -------------------------------------------------------------------
        .get('/for-user/:userId', async ({ params: { userId } }) => {
            // Find all reviews where the user is either the seller being reviewed
            // or the buyer being reviewed.
            const userReviews = await db.select().from(reviewsSchema).where(
                or(
                    eq(reviewsSchema.targetSellerId, userId),
                    eq(reviewsSchema.targetBuyerId, userId)
                )
            ).orderBy(desc(reviewsSchema.createdAt));

            // Enrich with reviewer and product details
            const result = [];
            for (const review of userReviews) {
                const [reviewer] = await db.select({ id: usersSchema.id, username: usersSchema.username })
                    .from(usersSchema)
                    .where(eq(usersSchema.id, review.reviewerId))
                    .limit(1);
                
                let targetProduct = null;
                if (review.targetProductId) {
                    [targetProduct] = await db.select({ id: productsSchema.id, name: productsSchema.name })
                        .from(productsSchema)
                        .where(eq(productsSchema.id, review.targetProductId))
                        .limit(1);
                }

                result.push({
                    ...review,
                    reviewer,
                    targetProduct
                });
            }

            return result;
        }, {
            params: UserIdParam,
            detail: {
                summary: 'Get Reviews for a User',
                description: 'Retrieves a list of all reviews where the specified user is the subject (either as a buyer or a seller).',
                responses: {
                    200: { description: 'Returned a list of reviews.' },
                }
            }
        })
    );