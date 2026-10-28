

const products = require('./src/data/products.json');
const { compareProducts } = require('./src/services/comparisonService');

const selectedProducts = products.filter((product) =>
  ['headphone-001', 'headphone-003'].includes(product.id)
);

console.log(
  JSON.stringify(
    compareProducts(selectedProducts, [
      'noise cancellation',
      'long battery life',
    ]),
    null,
    2
  )
);

