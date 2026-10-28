
const OpenAI = require('openai');

const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'http://localhost:5173',
    'X-Title': 'Cartiva AI Shopping Assistant',
  },
});

async function generateShoppingAdvice(query, products, budget) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is missing from server/.env');
  }

  const response = await openrouter.chat.completions.create({
    model: process.env.OPENROUTER_MODEL || 'openrouter/free',
    messages: [
      {
        role: 'system',
        content: `You are Cartiva, an AI shopping assistant.
Help users understand which products best match their needs.
Recommend only products supplied in the product catalogue.
Never invent product names, prices, ratings, or features.
Use simple, helpful language.
If no products match, explain that clearly.
Do not claim that you purchased or ordered anything.`,
      },
      {
        role: 'user',
        content: JSON.stringify({
          shoppingRequest: query,
          budget,
          availableProducts: products,
          task: 'Explain which available products best match the request and why.',
        }),
      },
    ],
  });

  return response.choices[0]?.message?.content ||
    'I could not generate shopping advice. Please try again.';
}

module.exports = { generateShoppingAdvice };
