import { Elysia, t } from 'elysia';
import { db } from '../db/db';
import { products as productsSchema, categories as categoriesSchema, productMedia as productMediaSchema } from '../db/schema/products'; 
import { users as usersSchema } from '../db/schema/users'; 
import { eq, isNull, and } from 'drizzle-orm';
import { auth } from '../utils/auth';

// -------------------------------------------------------------------
// 1. SCHEMAS FOR VALIDATION AND DOCUMENTATION
// -------------------------------------------------------------------

// Schema for creating a product (listing)
const CreateProductBody = t.Object({
    name: t.String(),
    description: t.Optional(t.String()),
    price: t.Numeric(),
    categoryId: t.Optional(t.Numeric()),
    media: t.Optional(t.Array(t.Object({
        url: t.String(),
        type: t.Union([t.Literal('image'), t.Literal('video')])
    })))
});

// Schema for updating a product
const UpdateProductBody = t.Object({
    name: t.Optional(t.String()),
    description: t.Optional(t.String()),
    price: t.Optional(t.Numeric()),
    categoryId: t.Optional(t.Numeric())
});

// Schema for creating a category
const CreateCategoryBody = t.Object({
    name: t.String(),
    description: t.Optional(t.String()),
    parentId: t.Optional(t.Numeric())
});

// Schema for a URL ID parameter
const IdParam = t.Object({
    id: t.Numeric({ description: 'The unique numeric ID.' })
});

// Schema for a User ID parameter in the URL
const UserIdParam = t.Object({
    userId: t.Numeric({ description: 'The unique numeric ID of the user.' })
});

// -------------------------------------------------------------------
// 2. PRODUCT API ROUTES
// -------------------------------------------------------------------

export const productApi = new Elysia()
    .use(auth)
    // --- Group: Products ---
    .group('/product', {
        detail: {
            tags: ['Products'],
        }
    }, (app) => 
        app
        // -------------------------------------------------------------------
        // A. POST / - Create a new Product Listing
        // -------------------------------------------------------------------
        .post('/', async ({ body, set, headers, jwt }) => {
            const token = headers.authorization?.split(' ')[1];
            if (!token) { set.status = 401; return { error: 'Unauthorized' }; }
            const profile = await jwt.verify(token);
            if (!profile) { set.status = 401; return { error: 'Unauthorized' }; }

            // Create Product
            const [newProduct] = await db.insert(productsSchema).values({
                sellerId: Number(profile.id),
                name: body.name,
                description: body.description,
                price: String(body.price), // Convert number to string for decimal/numeric column
                categoryId: body.categoryId
            }).returning();

            if (!newProduct) {
                set.status = 500;
                return { error: 'Internal Server Error', message: 'Failed to create product.' };
            }

            // Add Media (if any)
            if (body.media && body.media.length > 0) {
                for (const m of body.media) {
                    await db.insert(productMediaSchema).values({
                        productId: newProduct.id,
                        mediaType: m.type,
                        url: m.url,
                        // Simple mock watermark key generation. 
                        // In production, this should be a hash of the file content.
                        watermarkKey: `${newProduct.id}-${Math.random().toString(36).substring(7)}` 
                    });
                }
            }

            set.status = 201;
            return { message: 'Product listing created', product: newProduct };
        }, {
            body: CreateProductBody,
            detail: { summary: 'Create Product', description: 'List a new product for sale.' }
        })

        // -------------------------------------------------------------------
        // B. PUT /:id - Update a Product (Seller Only)
        // -------------------------------------------------------------------
        .put('/:id', async ({ params: { id }, body, set, headers, jwt }) => {
            const token = headers.authorization?.split(' ')[1];
            if (!token) { set.status = 401; return { error: 'Unauthorized' }; }
            const profile = await jwt.verify(token);
            if (!profile) { set.status = 401; return { error: 'Unauthorized' }; }

            // Verify Ownership
            const [existingProduct] = await db.select().from(productsSchema).where(eq(productsSchema.id, id)).limit(1);

            if (!existingProduct) { set.status = 404; return { error: 'Product not found' }; }
            if (existingProduct.sellerId !== Number(profile.id)) {
                set.status = 403; 
                return { error: 'Forbidden', message: 'You can only edit your own products.' };
            }

            const updateData: any = { updatedAt: new Date() };
            if (body.name) updateData.name = body.name;
            if (body.description) updateData.description = body.description;
            if (body.price !== undefined) updateData.price = String(body.price); // Convert number to string
            if (body.categoryId) updateData.categoryId = body.categoryId;

            const [updated] = await db.update(productsSchema)
                .set(updateData)
                .where(eq(productsSchema.id, id))
                .returning();

            return { message: 'Product updated', product: updated };
        }, {
            params: IdParam,
            body: UpdateProductBody,
            detail: { summary: 'Update Product', description: 'Modify product details.' }
        })

        // -------------------------------------------------------------------
        // C. DELETE /:id - Delete a Product (Seller Only)
        // -------------------------------------------------------------------
        .delete('/:id', async ({ params: { id }, set, headers, jwt }) => {
            const token = headers.authorization?.split(' ')[1];
            if (!token) { set.status = 401; return { error: 'Unauthorized' }; }
            const profile = await jwt.verify(token);
            if (!profile) { set.status = 401; return { error: 'Unauthorized' }; }

            // Verify Ownership
            const [existingProduct] = await db.select().from(productsSchema).where(eq(productsSchema.id, id)).limit(1);

            if (!existingProduct) { set.status = 404; return { error: 'Product not found' }; }
            if (existingProduct.sellerId !== Number(profile.id)) {
                set.status = 403; 
                return { error: 'Forbidden', message: 'You can only delete your own products.' };
            }

            await db.delete(productsSchema).where(eq(productsSchema.id, id));

            return { message: 'Product deleted successfully' };
        }, {
            params: IdParam,
            detail: { summary: 'Delete Product' }
        })

        // -------------------------------------------------------------------
        // D. GET /:id - Retrieve a single product by its ID
        // -------------------------------------------------------------------
        .get('/:id', async ({ params: { id }, set }) => {
            // Manual nested fetching
            const [product] = await db.select().from(productsSchema).where(eq(productsSchema.id, id)).limit(1);

            if (!product) {
                set.status = 404;
                return { error: 'Not Found', message: `Product with ID ${id} not found.` };
            }

            const media = await db.select().from(productMediaSchema).where(eq(productMediaSchema.productId, product.id));
            const [seller] = await db.select({
                id: usersSchema.id,
                username: usersSchema.username
            }).from(usersSchema).where(eq(usersSchema.id, product.sellerId)).limit(1);
            
            let category = null;
            if (product.categoryId) {
                [category] = await db.select().from(categoriesSchema).where(eq(categoriesSchema.id, product.categoryId)).limit(1);
            }

            return {
                ...product,
                media,
                seller,
                category
            };
        }, {
            params: IdParam,
            detail: { summary: 'Get Product by ID' }
        })

        // -------------------------------------------------------------------
        // C. GET /listed-by/:userId - Retrieve all products listed by a user
        // -------------------------------------------------------------------
        .get('/listed-by/:userId', async ({ params: { userId } }) => {
            const userProducts = await db.select().from(productsSchema).where(eq(productsSchema.sellerId, userId));
            
            // Fetch first media for each product (inefficient N+1 but simple for now given previous constraints)
            // Better approach: separate query for media or simple loop
            const result = [];
            for (const prod of userProducts) {
                const [firstMedia] = await db.select().from(productMediaSchema)
                    .where(eq(productMediaSchema.productId, prod.id))
                    .limit(1);
                
                let category = null;
                if (prod.categoryId) {
                    [category] = await db.select().from(categoriesSchema).where(eq(categoriesSchema.id, prod.categoryId)).limit(1);
                }

                result.push({
                    ...prod,
                    media: firstMedia ? [firstMedia] : [],
                    category
                });
            }

            return result;
        }, {
            params: UserIdParam,
            detail: { summary: 'Get Products by User' }
        })
    )
    
    // --- Group: Categories ---
    .group('/categories', {
        detail: {
            tags: ['Categories'],
            summary: 'Browse and manage categories.'
        }
    }, (app) => 
        app
        // -------------------------------------------------------------------
        // D. GET / - Get all Root Categories (with children)
        // -------------------------------------------------------------------
        .get('/', async () => {
            // Fetch all categories and reconstruct hierarchy in memory or just return flat list for client to parse
            // For now: Fetch Roots and their direct children manually
            const roots = await db.select().from(categoriesSchema).where(isNull(categoriesSchema.parentId));
            
            // Simple 1-level deep fetch
            const result = [];
            for (const root of roots) {
                const children = await db.select().from(categoriesSchema).where(eq(categoriesSchema.parentId, root.id));
                result.push({ ...root, children });
            }
            return result;
        }, {
            detail: { summary: 'Get Root Categories', description: 'Returns top-level categories with their immediate subcategories.' }
        })

        // -------------------------------------------------------------------
        // E. GET /:id - Get Category by ID (with children)
        // -------------------------------------------------------------------
        .get('/:id', async ({ params: { id }, set }) => {
            const [category] = await db.select().from(categoriesSchema).where(eq(categoriesSchema.id, id)).limit(1);

            if (!category) {
                set.status = 404;
                return { error: 'Category not found' };
            }
            
            const children = await db.select().from(categoriesSchema).where(eq(categoriesSchema.parentId, category.id));

            return { ...category, children };
        }, {
            params: IdParam,
            detail: { summary: 'Get Category', description: 'Returns a specific category and its subcategories.' }
        })

        // -------------------------------------------------------------------
        // F. POST / - Create Category (Admin/User for now)
        // -------------------------------------------------------------------
        .post('/', async ({ body, set }) => {
            // TODO: Add Admin Check
            const [newCategory] = await db.insert(categoriesSchema).values({
                name: body.name,
                description: body.description,
                parentId: body.parentId
            }).returning();

            set.status = 201;
            return newCategory;
        }, {
            body: CreateCategoryBody,
            detail: { summary: 'Create Category', description: 'Add a new category or subcategory.' }
        })
    );

