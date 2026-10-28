
const express = require('express');
const products = require('../data/products.json');

const router = express.Router();

// GET /api/products
// Optional query parameters: q, category, maxPrice
router.get('/', (req, res) => {
  const { q, category, maxPrice } = req.query;

  let results = products.filter((product) => product.stock > 0);

  if (q) {
    const query = q.toLowerCase();

    results = results.filter((product) => {
      const searchableText = [
        product.name,
        product.brand,
        product.category,
        product.description,
        ...product.features,
      ].join(' ').toLowerCase();

      return searchableText.includes(query);
    });
  }

  if (category) {
    results = results.filter(
      (product) => product.category.toLowerCase() === category.toLowerCase()
    );
  }

  if (maxPrice !== undefined) {
    const budget = Number(maxPrice);

    if (!Number.isFinite(budget) || budget < 0) {
      return res.status(400).json({
        success: false,
        message: 'maxPrice must be a non-negative number.',
      });
    }

    results = results.filter((product) => product.price <= budget);
  }

  res.json({
    success: true,
    count: results.length,
    products: results,
  });
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  const product = products.find((item) => item.id === req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found.',
    });
  }

  res.json({ success: true, product });
});

module.exports = router;
