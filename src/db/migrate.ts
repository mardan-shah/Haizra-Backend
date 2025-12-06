import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const DB_URL = process.env.DATABASE_URL;

if (!DB_URL) {
  throw new Error('DATABASE_URL environment variable is not set in .env or environment.');
}

const migrationClient = postgres(DB_URL, { 
    ssl: { 
        rejectUnauthorized: false 
    },
    max: 1
});
const db = drizzle(migrationClient);

async function main() {
  console.log('--- Starting Database Migrations ---');
  
  await migrate(db, { migrationsFolder: './drizzle' });
  
  console.log('--- Migrations complete! ---');
  
  await migrationClient.end(); 
  process.exit(0);
}

main().catch((err) => {
  console.error('\n--- Migrations failed! ---');
  console.error(err);
  
  process.exit(1); 
});