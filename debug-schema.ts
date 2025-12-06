
import * as schema from './src/db/schema/index';


console.log('All Keys:', Object.keys(schema).sort());
console.log('Has products:', 'products' in schema);
console.log('Has productsRelations:', 'productsRelations' in schema);

