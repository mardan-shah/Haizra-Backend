import { Elysia, t } from 'elysia';
import { db } from '../db/db';
import { auctions as auctionsSchema, bids as bidsSchema } from '../db/schema/auctions'; 
import { products as productsSchema, productMedia as productMediaSchema } from '../db/schema/products'; 
import { users as usersSchema } from '../db/schema/users';
import { eq, gt, and, sql, desc } from 'drizzle-orm';
import { auth } from '../utils/auth';

const CreateAuctionBody = t.Object({
    productId: t.String(),
    startPrice: t.Numeric(),
    endTime: t.String({ description: 'ISO Date String' })
});

const PlaceBidBody = t.Object({
    amount: t.Numeric()
});

const IdParam = t.Object({
    id: t.String({ format: 'uuid' })
});

export const auctionApi = new Elysia()
    .use(auth)
    .group('/auction', {
        detail: {
            tags: ['Auctions'],
        }
    }, (app) => app
        // -------------------------------------------------------------------
        // A. POST / - Create Auction
        // -------------------------------------------------------------------
        .post('/', async ({ body, set, headers, jwt }) => {
            const token = headers.authorization?.split(' ')[1];
            if (!token) { set.status = 401; return { error: 'Unauthorized' }; }
            const profile = await jwt.verify(token);
            if (!profile) { set.status = 401; return { error: 'Unauthorized' }; }
            
            // Verify Product Ownership
            const [product] = await db.select().from(productsSchema).where(eq(productsSchema.id, body.productId)).limit(1);

            if (!product) { set.status = 404; return { error: 'Product not found' }; }
            if (product.sellerId !== profile.id) {
                set.status = 403; 
                return { error: 'Forbidden', message: 'You can only auction your own products.' };
            }

            // Check if auction already exists
            const [existing] = await db.select().from(auctionsSchema).where(eq(auctionsSchema.productId, body.productId)).limit(1);
            if (existing) {
                set.status = 409;
                return { error: 'Conflict', message: 'An auction already exists for this product.' };
            }

            // Create Auction
            const [auction] = await db.insert(auctionsSchema).values({
                productId: body.productId,
                sellerId: profile.id as string,
                startPrice: String(body.startPrice),
                currentPrice: String(body.startPrice),
                endTime: new Date(body.endTime),
                status: 'open'
            }).returning();

            set.status = 201;
            return { message: 'Auction created', auction };
        }, {
            body: CreateAuctionBody,
            detail: { summary: 'Create Auction', description: 'Starts a new auction for a product.' }
        })

        // -------------------------------------------------------------------
        // B. POST /:id/bid - Place Bid
        // -------------------------------------------------------------------
        .post('/:id/bid', async ({ params: { id }, body, set, headers, jwt }) => {
            const token = headers.authorization?.split(' ')[1];
            if (!token) { set.status = 401; return { error: 'Unauthorized' }; }
            const profile = await jwt.verify(token);
            if (!profile) { set.status = 401; return { error: 'Unauthorized' }; }
            const bidderId = profile.id as string;

            const auctionId = id;

            // Run in transaction to ensure atomicity
            try {
                const result = await db.transaction(async (tx) => {
                    const [auction] = await tx.select().from(auctionsSchema).where(eq(auctionsSchema.id, auctionId)).limit(1);

                    if (!auction) throw new Error('Auction not found');
                    if (auction.status !== 'open') throw new Error('Auction is closed');
                    if (new Date() > auction.endTime) throw new Error('Auction has ended');
                    if (auction.sellerId === bidderId) throw new Error('Cannot bid on your own auction');

                    const bidAmount = Number(body.amount);
                    const currentPrice = Number(auction.currentPrice);

                    if (bidAmount <= currentPrice) {
                        throw new Error(`Bid must be higher than current price (${currentPrice})`);
                    }

                    // Create Bid
                    const [newBid] = await tx.insert(bidsSchema).values({
                        auctionId,
                        bidderId,
                        amount: String(bidAmount)
                    }).returning();

                    if (!newBid) throw new Error('Failed to create bid record');

                    // Update Auction (Price + Total Bids)
                    await tx.update(auctionsSchema).set({
                        currentPrice: String(bidAmount),
                        winningBidId: newBid.id,
                        winnerId: bidderId,
                        totalBids: sql`${auctionsSchema.totalBids} + 1`
                    }).where(eq(auctionsSchema.id, auctionId));

                    return { newBid, currentPrice: bidAmount };
                });

                return { message: 'Bid placed successfully', bid: result.newBid };

            } catch (e: any) {
                set.status = 400;
                return { error: 'Bid Failed', message: e.message };
            }
        }, {
            body: PlaceBidBody,
            detail: { summary: 'Place Bid', description: 'Place a bid on an active auction.' }
        })

        // -------------------------------------------------------------------
        // C. GET /:id - Get Auction Details (For Polling)
        // -------------------------------------------------------------------
        .get('/:id', async ({ params: { id }, set }) => {
             // Fetch main auction details
             const [auction] = await db.select().from(auctionsSchema).where(eq(auctionsSchema.id, id)).limit(1);

             if (!auction) {
                 set.status = 404;
                 return { error: 'Auction not found' };
             }

             // Fetch related data manually since we aren't using db.query relations here
             const [product] = await db.select().from(productsSchema).where(eq(productsSchema.id, auction.productId)).limit(1);
             const media = await db.select().from(productMediaSchema).where(eq(productMediaSchema.productId, auction.productId));
             const [seller] = await db.select({
                 username: usersSchema.username,
                 sellerRating: usersSchema.sellerRating,
                 profilePictureUrl: usersSchema.profilePictureUrl
             }).from(usersSchema).where(eq(usersSchema.id, auction.sellerId)).limit(1);
             
             let winner = null;
             if (auction.winnerId) {
                 const [w] = await db.select({ username: usersSchema.username }).from(usersSchema).where(eq(usersSchema.id, auction.winnerId)).limit(1);
                 winner = w;
             }

             return {
                 ...auction,
                 product: {
                     ...product,
                     media
                 },
                 seller,
                 winner
             };
        }, {
            params: IdParam,
            detail: { summary: 'Get Auction Details', description: 'Get full details including current price and total bids.' }
        })

        // -------------------------------------------------------------------
        // D. GET / - List Active Auctions
        // -------------------------------------------------------------------
        .get('/', async () => {
             const activeAuctions = await db.select({
                 auction: auctionsSchema,
                 product: productsSchema,
                 seller: {
                     username: usersSchema.username,
                     sellerRating: usersSchema.sellerRating
                 }
             })
             .from(auctionsSchema)
             .innerJoin(productsSchema, eq(auctionsSchema.productId, productsSchema.id))
             .innerJoin(usersSchema, eq(auctionsSchema.sellerId, usersSchema.id))
             .where(eq(auctionsSchema.status, 'open'))
             .limit(20);
             
             // Map result to a cleaner structure if needed
             return activeAuctions.map(row => ({
                 ...row.auction,
                 product: row.product,
                 seller: row.seller
             }));
        }, {
            detail: { summary: 'List Active Auctions', description: 'Get a list of open auctions.' }
        })
    );
