
const express = require('express');
const router = express.Router();

const products = require('../data/products.json');
const { compareProducts } = require('../services/comparisonService');

router.post('/', (req, res) => {
  try {
    const { productIds, priorities = [] } = req.body;

    if (!Array.isArray(productIds) || productIds.length !== 2) {
      return res.status(400).json({
        success: false,
        message: 'Please provide exactly two product IDs.',
      });
    }

    const selectedProducts = productIds.map((id) =>
      products.find((product) => product.id === id)
    );

    if (selectedProducts.some((product) => !product)) {
      return res.status(404).json({
        success: false,
        message: 'One or more products were not found.',
      });
    }

    const comparison = compareProducts(selectedProducts, priorities);

    return res.json({
      success: true,
      comparison,
    });
  } catch (error) {
    console.error('Comparison error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to compare products.',
    });
  }
});

module.exports = router;
