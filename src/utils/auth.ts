import { jwt } from '@elysiajs/jwt';
import { Elysia } from 'elysia';

export const auth = new Elysia()
    .use(
        jwt({
            name: 'jwt',
            secret: process.env.JWT_SECRET || 'haizra_secret_key_change_me',
        })
    );
