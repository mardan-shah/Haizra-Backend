import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './db';

async function main() {
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migrations complete!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migrations failed!', err);
  process.exit(1);
});
