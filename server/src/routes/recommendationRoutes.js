


const express = require('express');
const router = express.Router();

const { recommendProducts } = require('../services/recommendationService');
const { extractShoppingIntent } = require('../services/intentService');
const { generateShoppingAdvice } = require('../services/aiService');

router.post('/', async (req, res) => {
  try {
    const { query, budget, category = '' } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a shopping request.',
      });
    }

    const parsedBudget =
      budget === null || budget === undefined || budget === ''
        ? null
        : Number(budget);

    if (
      parsedBudget !== null &&
      (!Number.isFinite(parsedBudget) || parsedBudget < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Budget must be a valid non-negative number.',
      });
    }

    // Extract shopping requirements with AI.
    let intent = {
      category,
      budget: parsedBudget,
      priorities: [],
      keywords: [],
    };

    try {
      intent = await extractShoppingIntent(query.trim(), parsedBudget);
    } catch (error) {
      console.error('AI intent extraction failed:', error.message);
      // Continue with keyword-based recommendations if AI fails.
      intent = {
        category,
        budget: parsedBudget,
        priorities: [],
        keywords: [],
      };
    }

    // An explicitly supplied budget takes precedence over AI output.
    const effectiveBudget =
      parsedBudget !== null ? parsedBudget : intent.budget ?? null;

    // Rank products using the extracted priorities.
    const requestedCategory =
  (category || intent.category || '').toLowerCase().trim();

const products = recommendProducts({
  query: query.trim(),
  budget: effectiveBudget,
  category: requestedCategory,
  priorities: intent.priorities || [],
  keywords: intent.keywords || [],
});

    // Generate an explanation based on the returned products.
    const advice = await generateShoppingAdvice(
      query.trim(),
      products,
      effectiveBudget
    );

    return res.json({
      success: true,
      count: products.length,
      intent,
      explanation: advice,
      products,
    });
  } catch (error) {
    console.error('Recommendation error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to generate recommendations. Please try again.',
    });
  }
});

module.exports = router;
