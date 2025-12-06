import { Elysia, t } from 'elysia';
import { db } from '../db/db';
import { orders as ordersSchema, orderItems as orderItemsSchema } from '../db/schema/orders';
import { users as usersSchema } from '../db/schema/users';
import { products as productsSchema } from '../db/schema/products';
import { addresses as addressesSchema } from '../db/schema/addresses';
import { payments as paymentsSchema, escrow as escrowSchema } from '../db/schema/transactions';
import { eq, sql, and, exists } from 'drizzle-orm';
import { auth } from '../utils/auth';

// Schema for creating an order
const CreateOrderBody = t.Object({
    shippingAddressId: t.Numeric(),
    billingAddressId: t.Optional(t.Numeric()),
    paymentMethod: t.Union([
        t.Literal('card'), 
        t.Literal('easypaisa'), 
        t.Literal('jazzcash'), 
        t.Literal('cash_on_delivery')
    ]),
    items: t.Array(t.Object({
        productId: t.Numeric(),
        quantity: t.Numeric()
    }))
});

// Schema for Payment
const PayOrderBody = t.Object({
    provider: t.Union([t.Literal('stripe'), t.Literal('easypaisa'), t.Literal('jazzcash')]),
    transactionId: t.String()
});

export const orderApi = new Elysia()
    .use(auth)
    .group('/order', {
        detail: {
            tags: ['Orders'],
        }
    }, (app) => app
        // -------------------------------------------------------------------
        // A. POST / - Create a new order
        // -------------------------------------------------------------------
        .post('/', async ({ body, set, headers, jwt }) => {
            // 1. Authenticate User
            const token = headers.authorization?.split(' ')[1];
            if (!token) { set.status = 401; return { error: 'Unauthorized' }; }
            const profile = await jwt.verify(token);
            if (!profile) { set.status = 401; return { error: 'Unauthorized' }; }
            const buyerId = Number(profile.id);

            // 2. Validate COD Strikes if method is COD
            if (body.paymentMethod === 'cash_on_delivery') {
                const [user] = await db.select().from(usersSchema).where(eq(usersSchema.id, buyerId)).limit(1);
                if (!user) { set.status = 404; return { error: 'User not found' }; }
                
                if (user.codStrikes >= 3) {
                    set.status = 403; // Forbidden
                    return { 
                        error: 'COD Restricted', 
                        message: 'You have 3 or more COD strikes. Please use online payment.' 
                    };
                }
            }

            // 3. Calculate Total & Verify Products
            let totalAmount = 0;
            // Explicit type definition to fix TS error
            const productDetails: { productId: number; price: string; quantity: number }[] = [];

            for (const item of body.items) {
                const [product] = await db.select().from(productsSchema).where(eq(productsSchema.id, item.productId)).limit(1);
                
                if (!product) {
                    set.status = 400;
                    return { error: 'Bad Request', message: `Product ID ${item.productId} not found.` };
                }
                const lineTotal = Number(product.price) * item.quantity;
                totalAmount += lineTotal;
                productDetails.push({
                    productId: item.productId,
                    price: product.price,
                    quantity: item.quantity
                });
            }

            // 4. Transaction: Create Order, Items, Payment Record
            try {
                const result = await db.transaction(async (tx) => {
                    // Create Order
                    const [newOrder] = await tx.insert(ordersSchema).values({
                        buyerId,
                        shippingAddressId: body.shippingAddressId,
                        billingAddressId: body.billingAddressId || body.shippingAddressId,
                        status: 'pending_payment',
                        paymentMethod: body.paymentMethod,
                        totalAmount: totalAmount.toFixed(2),
                        deliveryStatus: 'processing'
                    }).returning();

                    if (!newOrder) throw new Error('Failed to create order');

                    // Create Order Items
                    for (const p of productDetails) {
                        await tx.insert(orderItemsSchema).values({
                            orderId: newOrder.id,
                            productId: p.productId,
                            quantity: p.quantity,
                            priceAtPurchase: p.price
                        });
                    }

                    // Create Initial Payment Record
                    const [payment] = await tx.insert(paymentsSchema).values({
                        orderId: newOrder.id,
                        amount: totalAmount.toFixed(2),
                        provider: body.paymentMethod === 'cash_on_delivery' ? 'cod_internal' : 'stripe', 
                        status: 'pending', 
                    }).returning();

                    if (!payment) throw new Error('Failed to create payment record');
                    
                    return { order: newOrder, payment };
                });

                set.status = 201;
                return { message: 'Order created', order: result.order, paymentId: result.payment.id };

            } catch (e: any) {
                console.error(e);
                set.status = 500;
                return { error: 'Internal Server Error', message: e.message || 'Failed to create order.' };
            }
        }, {
            body: CreateOrderBody,
            detail: {
                summary: 'Create Order',
                description: 'Creates an order. Checks for COD strikes. Initializes payment record.'
            }
        })

        // -------------------------------------------------------------------
        // B. POST /:id/pay - Mock Payment Gateway Webhook / Confirmation
        // -------------------------------------------------------------------
        .post('/:id/pay', async ({ params: { id }, body, set }) => {
            
            const [payment] = await db.select().from(paymentsSchema).where(eq(paymentsSchema.orderId, Number(id))).limit(1);
            
            if (!payment) {
                set.status = 404;
                return { error: 'Payment record not found for this order' };
            }

            if (payment.status === 'paid' || payment.status === 'held_in_escrow') {
                return { message: 'Already paid' };
            }

            // Update Payment to 'held_in_escrow' (Secure payment)
            await db.transaction(async (tx) => {
                const [updatedPayment] = await tx.update(paymentsSchema)
                    .set({ 
                        status: 'held_in_escrow', 
                        transactionId: body.transactionId,
                        provider: body.provider as any
                    })
                    .where(eq(paymentsSchema.id, payment.id))
                    .returning();

                if (!updatedPayment) throw new Error('Failed to update payment');

                // Create Escrow Record
                await tx.insert(escrowSchema).values({
                    paymentId: updatedPayment.id,
                    status: 'held',
                });

                // Update Order Status
                await tx.update(ordersSchema)
                    .set({ status: 'processing' })
                    .where(eq(ordersSchema.id, Number(id)));
            });

            return { message: 'Payment received and held in escrow.' };
        }, {
            body: PayOrderBody,
            detail: {
                summary: 'Process Payment',
                description: 'Updates payment status to "held_in_escrow" and creates an escrow record.'
            }
        })

        // -------------------------------------------------------------------
        // C. POST /:id/confirm-delivery - Buyer Confirms Receipt (Releases Escrow)
        // -------------------------------------------------------------------
        .post('/:id/confirm-delivery', async ({ params: { id }, headers, set, jwt }) => {
             const token = headers.authorization?.split(' ')[1];
             if (!token) { set.status = 401; return { error: 'Unauthorized' }; }
             const profile = await jwt.verify(token);
             if (!profile) { set.status = 401; return { error: 'Unauthorized' }; }
 
             // Verify User is the Buyer - Using select instead of query to avoid type issues
             const [order] = await db.select().from(ordersSchema).where(eq(ordersSchema.id, Number(id))).limit(1);

             if (!order) { set.status = 404; return { error: 'Order not found' }; }
             if (order.buyerId !== Number(profile.id)) {
                 set.status = 403;
                 return { error: 'Forbidden', message: 'Only the buyer can confirm delivery.' };
             }

             // Release Funds
             await db.transaction(async (tx) => {
                 // Update Order
                 await tx.update(ordersSchema).set({ status: 'delivered', deliveryStatus: 'delivered' }).where(eq(ordersSchema.id, order.id));
                 
                 // Find associated payment and escrow
                 // Manual fetch since we aren't using relations here
                 const [payment] = await tx.select().from(paymentsSchema).where(eq(paymentsSchema.orderId, order.id)).limit(1);
                 
                 if (payment) {
                     const [escrowRecord] = await tx.select().from(escrowSchema).where(eq(escrowSchema.paymentId, payment.id)).limit(1);

                     if (escrowRecord && escrowRecord.status === 'held') {
                         await tx.update(escrowSchema)
                             .set({ status: 'released', releaseAt: new Date() })
                             .where(eq(escrowSchema.id, escrowRecord.id));
                     }
                 }
             });

             return { message: 'Delivery confirmed. Funds released to seller.' };
        }, {
            detail: {
                summary: 'Confirm Delivery',
                description: 'Buyer confirms receipt. Releases funds from escrow to the seller.'
            }
        })
        // -------------------------------------------------------------------
        // D. GET /seller-orders - Get Orders for Seller (Admin Panel)
        // -------------------------------------------------------------------
        .get('/seller-orders', async ({ headers, set, jwt }) => {
             const token = headers.authorization?.split(' ')[1];
             if (!token) { set.status = 401; return { error: 'Unauthorized' }; }
             const profile = await jwt.verify(token);
             if (!profile) { set.status = 401; return { error: 'Unauthorized' }; }
             const sellerId = Number(profile.id);

             // Find order items for products sold by this user
             // Using explicit table selection to avoid type errors with nesting
             const items = await db.select({
                 orderItem: orderItemsSchema,
                 product: productsSchema,
                 order: ordersSchema,
                 buyer: usersSchema,
                 shippingAddress: addressesSchema
             })
             .from(orderItemsSchema)
             .innerJoin(productsSchema, eq(orderItemsSchema.productId, productsSchema.id))
             .innerJoin(ordersSchema, eq(orderItemsSchema.orderId, ordersSchema.id))
             .innerJoin(usersSchema, eq(ordersSchema.buyerId, usersSchema.id))
             .innerJoin(addressesSchema, eq(ordersSchema.shippingAddressId, addressesSchema.id))
             .where(eq(productsSchema.sellerId, sellerId));

             // Transform result to match expected nested structure
             return items.map(row => ({
                 ...row.orderItem,
                 product: row.product,
                 order: {
                     ...row.order,
                     buyer: {
                         email: row.buyer.email,
                         username: row.buyer.username
                     },
                     shippingAddress: row.shippingAddress
                 }
             }));
        }, {
            detail: {
                summary: 'Get Seller Orders',
                description: 'Retrieve list of order items sold by the authenticated user.'
            }
        })
    );
