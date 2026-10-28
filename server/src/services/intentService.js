

const OpenAI = require('openai');

const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

async function extractShoppingIntent(query, budget = null) {
  const response = await openrouter.chat.completions.create({
    model: process.env.OPENROUTER_MODEL || 'openrouter/free',
    messages: [
      {
        role: 'system',
        content: `You are Cartiva's shopping intent analyzer.
Return exactly one valid JSON object with these fields:
{
  "category": "string",
  "useCase": "string",
  "budget": number or null,
  "priorities": ["string"],
  "keywords": ["string"]
}

Rules:
- Identify the product category from the request.
- For headphones, use "headphones".
- Identify the intended use.
- List requested features in priority order.
- Include relevant product search terms.
- Use the supplied budget if the request doesn't specify another.
- Return empty arrays only when no relevant features or keywords exist.
- Do not include Markdown or explanations outside the JSON object.`,
      },
      {
        role: 'user',
        content: JSON.stringify({ query, budget }),
      },
    ],
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error('The AI returned an empty shopping intent.');
  }

  const cleaned = content
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');

  if (start === -1 || end === -1 || end < start) {
    throw new Error(
      `Model did not return JSON. Response: ${cleaned.slice(0, 300)}`
    );
  }

  let intent;

  try {
    intent = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    throw new Error('Model returned invalid JSON. Try another model.');
  }

  if (
    typeof intent !== 'object' ||
    intent === null ||
    typeof intent.category !== 'string' ||
    typeof intent.useCase !== 'string' ||
    !Array.isArray(intent.priorities) ||
    !Array.isArray(intent.keywords)
  ) {
    throw new Error('The AI returned an invalid shopping intent.');
  }

  intent.priorities = intent.priorities.filter(
    (item) => typeof item === 'string'
  );

  intent.keywords = intent.keywords.filter(
    (item) => typeof item === 'string'
  );

  if (budget !== null && budget !== undefined && budget !== '') {
    intent.budget = Number(budget);
  }

  return intent;
}

module.exports = { extractShoppingIntent };
