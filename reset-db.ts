import { db } from './src/db/db';
import { sql } from 'drizzle-orm';

async function reset() {
    console.log('Dropping all tables...');
    await db.execute(sql`DROP SCHEMA public CASCADE; CREATE SCHEMA public;`);
    console.log('Done.');
    process.exit(0);
}

reset();