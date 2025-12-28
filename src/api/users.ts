import { Elysia, t } from 'elysia';
import { db } from '../db/db';
import { users as usersSchema } from '../db/schema/users';
import { addresses as addressesSchema, userAddresses as userAddressesSchema } from '../db/schema/addresses';
import { eq, or, and } from 'drizzle-orm';
import { auth } from '../utils/auth';

// -------------------------------------------------------------------
// 1. SCHEMAS FOR VALIDATION AND DOCUMENTATION
// -------------------------------------------------------------------

// Schema for the user sign-up request body
const UserSignUpBody = t.Object({
  email: t.String({ format: 'email', description: 'User\'s email address for login.' }),
  password: t.String({ minLength: 8, description: 'User\'s password (at least 8 characters).' }),
  username: t.String({ minLength: 3, description: 'Public username for display.' }),
  name: t.Optional(t.String({ description: 'Full name of the user.' })),
  phone: t.Optional(t.String()),
});

// Schema for the user sign-in request body
const UserSignInBody = t.Object({
    email: t.String({ description: 'User\'s registered email or username.' }),
    password: t.String({ description: 'User\'s password.' })
});

// Schema for updating user profile
const UpdateProfileBody = t.Object({
    name: t.Optional(t.String()),
    phone: t.Optional(t.String()),
    profilePictureUrl: t.Optional(t.String()),
    email: t.Optional(t.String({ format: 'email' })),
    password: t.Optional(t.String({ minLength: 8 }))
});

// Schema for Adding Address
const CreateAddressBody = t.Object({
    label: t.Optional(t.String({ maxLength: 50 })), // e.g. "Home"
    mainAddress: t.String(),
    secondaryAddress: t.Optional(t.String()),
    city: t.String(),
    state: t.Optional(t.String()),
    country: t.String(),
    zipCode: t.Optional(t.String()),
    phone: t.Optional(t.String()),
    isDefault: t.Optional(t.Boolean())
});

const AddressIdParam = t.Object({ id: t.String({ format: 'uuid' }) });

// Schema for a URL ID parameter
const IdParam = t.Object({
    id: t.String({ format: 'uuid', description: 'The unique numeric ID.' })
});

// Auth Header Schema
const AuthHeader = t.Object({
    authorization: t.Optional(t.String({ description: 'Bearer <token>' }))
});


// -------------------------------------------------------------------
// 2. USER API ROUTES (/user)
// -------------------------------------------------------------------

export const userApi = new Elysia()
  .use(auth) // Use the centralized auth plugin
  .group('/user', {
    detail: {
      tags: ['User'],
    },
  }, (app) =>
    app
      // -------------------------------------------------------------------
      // A. POST /user/signup - Register a new user
      // -------------------------------------------------------------------
      .post('/signup', async ({ body, set, jwt, cookie, request }) => {
          // Check if user already exists (email or username)
          const [existingUser] = await db.select().from(usersSchema)
            .where(or(eq(usersSchema.email, body.email), eq(usersSchema.username, body.username)))
            .limit(1);
            
          if (existingUser) {
              set.status = 409; // Conflict
              const isEmailTaken = existingUser.email === body.email;
              return { 
                  error: 'Conflict', 
                  message: isEmailTaken ? 'Email already in use.' : 'Username already taken.' 
              };
          }

          // Hash the password using Argon2
          const hashedPassword = await Bun.password.hash(body.password);

          // Insert new user into the database
          const [newUser] = await db.insert(usersSchema).values({
            email: body.email,
            username: body.username,
            password: hashedPassword, // Store the hashed password
            name: body.name,
            phone: body.phone,
          }).returning({ id: usersSchema.id, email: usersSchema.email, username: usersSchema.username, role: usersSchema.isVerifiedSeller });

          if (!newUser) {
             set.status = 500;
             return { error: 'Internal Server Error', message: 'Database insertion failed.' };
          }

          // Generate JWT
          const token = await jwt.sign({
              id: newUser.id,
              username: newUser.username,
              email: newUser.email
          });
          
          // Set HttpOnly Cookie for Web Security
          if (cookie && cookie.auth_token) {
             const origin = request.headers.get('origin') || '';
             const isProd = process.env.NODE_ENV === 'production';
             // If from localhost, don't set domain (defaults to host). If prod and not localhost, set .haizra.com
             const cookieDomain = (isProd && !origin.includes('localhost')) ? '.haizra.com' : undefined;

             cookie.auth_token.set({
                 value: token,
                 httpOnly: true,
                 secure: isProd, 
                 maxAge: 7 * 86400, // 7 Days
                 path: '/',
                 domain: cookieDomain
             });
          }
          
          set.status = 201; // Created
          return { 
            message: 'User created successfully',
            user: newUser,
            token // Return for Mobile App use
          };
        },
        {
          body: UserSignUpBody,
          detail: {
            summary: 'Register a new user',
            description: 'Creates a new user account. Returns token in body (for mobile) and sets HttpOnly cookie (for web).',
            responses: {
              201: { description: 'User created successfully.' },
              409: { description: 'Email or username already exists.' },
              500: { description: 'Failed to create user in the database.' },
            }
          }
        }
      )
      // -------------------------------------------------------------------
      // B. POST /user/signin - Authenticate a user
      // -------------------------------------------------------------------
      .post('/signin', async ({ body, set, jwt, cookie, request }) => {
            // Find the user by email OR username
            const [user] = await db.select().from(usersSchema)
                .where(or(eq(usersSchema.email, body.email), eq(usersSchema.username, body.email)))
                .limit(1);

            if (!user) {
                set.status = 401; // Unauthorized
                return { error: 'Unauthorized', message: 'Invalid credentials.' };
            }

            // Verify the password against the stored hash
            const isMatch = await Bun.password.verify(body.password, user.password);

            if (!isMatch) {
                set.status = 401; // Unauthorized
                return { error: 'Unauthorized', message: 'Invalid credentials.' };
            }
            
            // Generate JWT
            const token = await jwt.sign({
                id: user.id,
                username: user.username,
                email: user.email
            });

            // Set HttpOnly Cookie for Web Security
            if (cookie && cookie.auth_token) {
                 const origin = request.headers.get('origin') || '';
                 const isProd = process.env.NODE_ENV === 'production';
                 const cookieDomain = (isProd && !origin.includes('localhost')) ? '.haizra.com' : undefined;

                 cookie.auth_token.set({
                    value: token,
                    httpOnly: true,
                    secure: isProd,
                    maxAge: 7 * 86400, // 7 Days
                    path: '/',
                    domain: cookieDomain
                });
            }

            set.status = 200;
            return {
                message: 'Sign-in successful',
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username
                },
                token // Return for Mobile App use
            };
        }, 
        {
            body: UserSignInBody,
            detail: {
                summary: 'Sign in a user',
                description: 'Authenticates a user. Returns token in body (for mobile) and sets HttpOnly cookie (for web).',
                responses: {
                    200: { description: 'Authentication successful.' },
                    401: { description: 'Invalid credentials.' },
                }
            }
        })
        
      // -------------------------------------------------------------------
      // C. PUT /user/profile - Update User Profile
      // -------------------------------------------------------------------
      .put('/profile', async ({ body, set, headers, jwt, cookie }) => {
            let token = headers.authorization?.split(' ')[1];
            if (!token && cookie && cookie.auth_token) {
                token = cookie.auth_token.value as string | undefined;
            }

            if (!token) { set.status = 401; return { error: 'Unauthorized' }; }
            const profile = await jwt.verify(token);
            if (!profile) { set.status = 401; return { error: 'Unauthorized' }; }
            const userId = profile.id as string; // Ensure UUID string

            const updateData: any = {
                updatedAt: new Date()
            };

            if (body.name) updateData.name = body.name;
            if (body.phone) updateData.phone = body.phone;
            if (body.profilePictureUrl) updateData.profilePictureUrl = body.profilePictureUrl;

            // Logic for Email Update (Check uniqueness)
            if (body.email) {
                const [existing] = await db.select().from(usersSchema)
                    .where(eq(usersSchema.email, body.email)).limit(1);
                
                if (existing && existing.id !== userId) {
                    set.status = 409;
                    return { error: 'Conflict', message: 'Email already in use by another account.' };
                }
                updateData.email = body.email;
            }

            // Logic for Password Update (Hash it)
            if (body.password) {
                updateData.password = await Bun.password.hash(body.password);
            }

            const [updatedUser] = await db.update(usersSchema)
                .set(updateData)
                .where(eq(usersSchema.id, userId))
                .returning({
                    id: usersSchema.id,
                    email: usersSchema.email,
                    username: usersSchema.username,
                    name: usersSchema.name,
                    phone: usersSchema.phone,
                    profilePictureUrl: usersSchema.profilePictureUrl
                });

            return { message: 'Profile updated', user: updatedUser };
      }, {
          body: UpdateProfileBody,
          headers: AuthHeader,
          detail: { 
              summary: 'Update Profile', 
              description: 'Update details including email and password. Requires Auth Token.',
              security: [{ bearerAuth: [] }]
          }
      })

      // -------------------------------------------------------------------
      // D. Address Management
      // -------------------------------------------------------------------
      .group('/address', (app) => app
          // POST /user/address - Create Address
          .post('/', async ({ body, set, headers, jwt, cookie }) => {
              let token = headers.authorization?.split(' ')[1];
              if (!token && cookie && cookie.auth_token) token = cookie.auth_token.value as string | undefined;
              if (!token) { set.status = 401; return { error: 'Unauthorized' }; }
              const profile = await jwt.verify(token);
              if (!profile) { set.status = 401; return { error: 'Unauthorized' }; }
              const userId = profile.id as string;

              // 1. Create physical address record
              const [newAddress] = await db.insert(addressesSchema).values({
                  mainAddress: body.mainAddress,
                  secondaryAddress: body.secondaryAddress,
                  city: body.city,
                  state: body.state,
                  country: body.country,
                  zipCode: body.zipCode,
                  phone: body.phone
              }).returning();

              if (!newAddress) {
                  set.status = 500;
                  return { error: 'Internal Server Error', message: 'Failed to create address record.' };
              }

              // 2. Link to user
              if (body.isDefault) {
                  await db.update(userAddressesSchema)
                      .set({ isDefault: false })
                      .where(eq(userAddressesSchema.userId, userId));
              }

              await db.insert(userAddressesSchema).values({
                  userId,
                  addressId: newAddress.id,
                  addressType: 'shipping', // Defaulting to shipping for general add
                  label: body.label,
                  isDefault: body.isDefault || false
              });

              return { message: 'Address added', address: newAddress };
          }, {
              body: CreateAddressBody,
              headers: AuthHeader,
              detail: { 
                  summary: 'Add Address', 
                  description: 'Add a new address line for the user. Requires Auth Token.',
                  security: [{ bearerAuth: [] }]
              }
          })

          // GET /user/address - List Addresses
          .get('/', async ({ headers, set, jwt, cookie }) => {
              let token = headers.authorization?.split(' ')[1];
              if (!token && cookie && cookie.auth_token) token = cookie.auth_token.value as string | undefined;
              if (!token) { set.status = 401; return { error: 'Unauthorized' }; }
              const profile = await jwt.verify(token);
              if (!profile) { set.status = 401; return { error: 'Unauthorized' }; }
              const userId = profile.id as string;

              // Join userAddresses with addresses
              const result = await db.select({
                  id: addressesSchema.id,
                  label: userAddressesSchema.label,
                  isDefault: userAddressesSchema.isDefault,
                  mainAddress: addressesSchema.mainAddress,
                  secondaryAddress: addressesSchema.secondaryAddress,
                  city: addressesSchema.city,
                  state: addressesSchema.state,
                  country: addressesSchema.country,
                  zipCode: addressesSchema.zipCode,
                  phone: addressesSchema.phone
              })
              .from(userAddressesSchema)
              .innerJoin(addressesSchema, eq(userAddressesSchema.addressId, addressesSchema.id))
              .where(eq(userAddressesSchema.userId, userId));

              return result;
          }, {
              headers: AuthHeader,
              detail: { 
                  summary: 'List Addresses', 
                  description: 'Get all addresses for the user. Requires Auth Token.',
                  security: [{ bearerAuth: [] }]
              }
          })

          // PUT /user/address/:id/default - Set Default
          .put('/:id/default', async ({ params: { id }, headers, set, jwt, cookie }) => {
              let token = headers.authorization?.split(' ')[1];
              if (!token && cookie && cookie.auth_token) token = cookie.auth_token.value as string | undefined;
              if (!token) { set.status = 401; return { error: 'Unauthorized' }; }
              const profile = await jwt.verify(token);
              if (!profile) { set.status = 401; return { error: 'Unauthorized' }; }
              const userId = profile.id as string;
              const addressId = id;

              // Unset previous default
              await db.update(userAddressesSchema)
                  .set({ isDefault: false })
                  .where(eq(userAddressesSchema.userId, userId));

              // Set new default
              const [updated] = await db.update(userAddressesSchema)
                  .set({ isDefault: true })
                  .where(and(
                      eq(userAddressesSchema.userId, userId),
                      eq(userAddressesSchema.addressId, addressId)
                  ))
                  .returning();
              
              if (!updated) {
                  set.status = 404;
                  return { error: 'Address not found linked to this user' };
              }

              return { message: 'Default address updated' };
          }, {
              params: AddressIdParam,
              headers: AuthHeader,
              detail: { 
                  summary: 'Set Default Address', 
                  description: 'Mark a specific address as default. Requires Auth Token.',
                  security: [{ bearerAuth: [] }]
              }
          })
      )

      // -------------------------------------------------------------------
      // E. GET /user/profile - Retrieve current user profile
      // -------------------------------------------------------------------
      .get('/profile', async ({ jwt, headers, set, cookie }) => {
            // Try Header first (Mobile), then Cookie (Web)
            let token = headers.authorization?.split(' ')[1];
            if (!token && cookie && cookie.auth_token) {
                token = cookie.auth_token.value as string | undefined;
            }

            if (!token) {
                set.status = 401;
                return { error: 'Unauthorized', message: 'Missing token' };
            }

            const profile = await jwt.verify(token);
            if (!profile) {
                set.status = 401;
                return { error: 'Unauthorized', message: 'Invalid token' };
            }
            
            // Fetch full details from DB
            const [user] = await db.select({
                id: usersSchema.id,
                email: usersSchema.email,
                username: usersSchema.username,
                name: usersSchema.name,
                phone: usersSchema.phone,
                profilePictureUrl: usersSchema.profilePictureUrl,
                isVerifiedSeller: usersSchema.isVerifiedSeller,
                sellerRating: usersSchema.sellerRating,
                buyerRating: usersSchema.buyerRating
            }).from(usersSchema).where(eq(usersSchema.id, profile.id as string)).limit(1);

            if (!user) {
                set.status = 404;
                return { error: 'Not Found', message: 'User not found' };
            }

            return user;
      }, {
          headers: AuthHeader,
          detail: {
              summary: 'Get Current User Profile',
              description: 'Returns the profile of the currently logged-in user. Supports both Cookie and Bearer token.',
              tags: ['User'],
              security: [{ bearerAuth: [] }]
          }
      })
      // -------------------------------------------------------------------
      // F. GET /user/:id - Retrieve a user's public data
      // -------------------------------------------------------------------
      .get('/:id', async ({ params: { id }, set }) => {
            const [user] = await db.select({
                id: usersSchema.id,
                email: usersSchema.email,
                username: usersSchema.username,
                name: usersSchema.name,
                profilePictureUrl: usersSchema.profilePictureUrl,
                sellerRating: usersSchema.sellerRating,
                buyerRating: usersSchema.buyerRating,
                isVerifiedSeller: usersSchema.isVerifiedSeller
            }).from(usersSchema).where(eq(usersSchema.id, id)).limit(1);

            if (!user) {
                set.status = 404;
                return { error: 'Not Found', message: `User with ID ${id} not found.`};
            }

            return user;
        }, {
            params: IdParam,
            detail: {
                summary: 'Get User Data by ID',
                description: 'Retrieves all public information for a single user by their unique numeric ID.',
                responses: {
                    200: { description: 'User data returned successfully.' },
                    404: { description: 'User not found.' },
                }
            }
        })
);
