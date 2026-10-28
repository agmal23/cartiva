
const express = require('express');
const router = express.Router();

const { searchRetailers } = require('../services/retailerService');

router.post('/search', async (req, res) => {
  try {
    const { query = '', budget = null } = req.body || {};

    if (typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Query must be a string.',
      });
    }

    if (
      budget !== null &&
      (!Number.isFinite(Number(budget)) || Number(budget) < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Budget must be a valid non-negative number.',
      });
    }

    const result = await searchRetailers({ query, budget });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Retailer search error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Unable to search retailer products.',
    });
  }
});

module.exports = router;
