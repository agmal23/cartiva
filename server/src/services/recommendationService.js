


const products = require('../data/products.json');

function normalize(value) {
  return String(value || '').toLowerCase().trim();
}


function priorityMatches(searchableText, priority) {
  const normalizedPriority = normalize(priority);

  // Map common shopping requests to catalogue terminology.
  const synonyms = {
    'long battery life': ['battery', 'hour'],
    'battery life': ['battery'],
    'noise cancellation': ['noise cancellation'],
    'excellent noise cancellation': ['noise cancellation'],
    'active noise cancellation': ['active noise cancellation'],
    wireless: ['wireless'],
    lightweight: ['lightweight'],
  };

  const mappedTerms = synonyms[normalizedPriority];

  if (mappedTerms) {
    return mappedTerms.every((term) => searchableText.includes(term));
  }

  // For other priorities, require all meaningful words.
  const terms = normalizedPriority
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 2);

  return (
    terms.length > 0 &&
    terms.every((term) => searchableText.includes(term))
  );
}


function recommendProducts({
  query = '',
  budget = null,
  category = '',
  priorities = [],
  keywords = [],
}) {
  const words = [...new Set(
    `${query} ${keywords.join(' ')}`
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 2)
  )];

  const normalizedCategory = normalize(category);
  const priorityTerms = priorities.map(normalize);

  const results = products
    .filter((product) => product.stock > 0)
    .filter((product) => budget === null || product.price <= budget)
    .filter(
      (product) =>
        !normalizedCategory ||
        normalize(product.category) === normalizedCategory
    )
    .map((product) => {
      const searchableText = normalize([
        product.name,
        product.brand,
        product.category,
        product.description,
        ...product.features,
      ].join(' '));

      const matchedWords = words.filter((word) =>
        searchableText.includes(word)
      );

      const matchedPriorities = priorityTerms.filter((priority) =>
        priorityMatches(searchableText, priority)
      );

      // Give the user's stated priorities the strongest influence.
      const priorityBonus = priorityTerms.reduce(
        (score, priority, index) => {
          if (!priorityMatches(searchableText, priority)) return score;

          // First priority: 30 points; second: 20; third: 10; then 5.
          const weight = index === 0
            ? 30
            : index === 1
              ? 20
              : index === 2
                ? 10
                : 5;

          return score + weight;
        },
        0
      );

      
const featureBonus = product.features.length * 0.5;

// Normalize rating to a small, predictable contribution.
const ratingBonus = Number(product.rating || 0) * 2;

// Reward actual feature matches more than general keyword matches.
const keywordBonus = matchedWords.length * 0.25;

// Compare battery duration when battery life is a stated priority.
const batteryMatch = priorityTerms.some((priority) =>
  priority.includes('battery')
);

const batteryMatchText = searchableText.match(/(\d+)\s*-\s*hour battery/);
const batteryHours = batteryMatchText
  ? Number(batteryMatchText[1])
  : 0;

const batteryBonus = batteryMatch
  ? Math.min(batteryHours, 50) * 0.5
  : 0;

const matchScore =
  priorityBonus +
  featureBonus +
  ratingBonus +
  keywordBonus +
  batteryBonus;


      
const unmatchedPriorities = priorityTerms.filter(
  (priority) => !matchedPriorities.includes(priority)
);

const reasons = [];

if (matchedPriorities.length > 0) {
  reasons.push(
    `Matches your preferences for ${matchedPriorities.join(' and ')}`
  );
}

if (unmatchedPriorities.length > 0) {
  reasons.push(
    `Does not explicitly match ${unmatchedPriorities.join(' and ')}`
  );
}

if (budget !== null && product.price <= budget) {
  reasons.push(`Within your $${budget} budget`);
}

return {
  ...product,
  matchScore: Math.round(matchScore * 10) / 10,
  matchedTerms: matchedWords,
  matchedPriorities,
  unmatchedPriorities,
  reasons,
};

    });

  results.sort((a, b) => b.matchScore - a.matchScore);

  return results.slice(0, 5);
}

module.exports = { recommendProducts };
