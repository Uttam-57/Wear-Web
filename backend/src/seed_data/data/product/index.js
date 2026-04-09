import { SHIRT_PRODUCT_CATALOG } from './shirt/shirt_seedData.js';
import { TSHIRT_PRODUCT_CATALOG } from './tshirt/tshirt_seedData.js';
import { FORMALWEAR_PRODUCT_CATALOG } from './formalwear/formalwear_seedData.js';
import { TRADITIONALWEAR_PRODUCT_CATALOG } from './traditionalwear/traditionalwear_seedData.js';
import { WATCH_PRODUCT_CATALOG } from './watch/watch_seedData.js';
import { SHOES_PRODUCT_CATALOG } from './shoes/shoes_seedData.js';
import { ACCESSORY_PRODUCT_CATALOG } from './accessory/accessory_seedData.js';

export const PRODUCT_CATALOG = [
  ...SHIRT_PRODUCT_CATALOG,
  ...TSHIRT_PRODUCT_CATALOG,
  ...FORMALWEAR_PRODUCT_CATALOG,
  ...TRADITIONALWEAR_PRODUCT_CATALOG,
  ...WATCH_PRODUCT_CATALOG,
  ...SHOES_PRODUCT_CATALOG,
  ...ACCESSORY_PRODUCT_CATALOG,
];
