

const demoProducts = [
  {
    id: 'demo-amazon-001',
    name: 'Demo Wireless ANC Headphones',
    brand: 'DemoSound',
    category: 'headphones',
    price: 7999,
    currency: 'INR',
    retailer: 'Amazon India',
    source: 'DEMO',
    isLive: false,
    rating: null,
    specifications: {
      wireless: true,
      noiseCancellation: true,
      batteryHours: 40,
      microphone: true,
    },
    features: [
      'Active noise cancellation',
      '40-hour demo battery specification',
    ],
    productUrl: null,
  },
  {
    id: 'demo-flipkart-001',
    name: 'Demo Pro Wireless Headphones',
    brand: 'AudioDemo',
    category: 'headphones',
    price: 6499,
    currency: 'INR',
    retailer: 'Flipkart',
    source: 'DEMO',
    isLive: false,
    rating: null,
    specifications: {
      wireless: true,
      noiseCancellation: true,
      batteryHours: 35,
      microphone: true,
    },
    features: [
      'Active noise cancellation',
      '35-hour demo battery specification',
    ],
    productUrl: null,
  },
];


function parseRequirements(query) {
  const text = query.toLowerCase();

  const batteryMatch = text.match(
    /(?:at least|minimum|min\.?|over|above)\s*(\d+)\s*(?:hours?|hrs?)/i
  );

  const budgetMatch = text.match(
    /(?:under|below|less than|max(?:imum)?(?: budget)?(?: of)?)\s*₹?\s*(\d[\d,]*)/i
  );

  return {
    requiresWireless: /\bwireless\b/i.test(text),

    requiresNoiseCancellation:
      /noise cancellation|\banc\b/i.test(text),

    minBatteryHours: batteryMatch
      ? Number(batteryMatch[1])
      : null,

    queryBudget: budgetMatch
      ? Number(budgetMatch[1].replace(/,/g, ''))
      : null,

    preferCheapest:
      /cheapest|lowest price|most affordable|budget friendly/i.test(text),

    preferLongBattery:
      /long(?:er)? battery|best battery|battery life is important|battery matters/i.test(text),
  };
}


async function searchRetailers({ query = '', budget = null } = {}) {
  const text = query.trim().toLowerCase();
  const requirements = parseRequirements(text);

  const effectiveBudget =
    budget !== null && budget !== '' && Number.isFinite(Number(budget))
      ? Number(budget)
      : requirements.queryBudget;

  const products = demoProducts
    .filter((product) => {
      if (effectiveBudget !== null && product.price > effectiveBudget) {
        return false;
      }

      if (
        requirements.requiresWireless &&
        product.specifications.wireless !== true
      ) {
        return false;
      }

      if (
        requirements.requiresNoiseCancellation &&
        product.specifications.noiseCancellation !== true
      ) {
        return false;
      }

      if (
        requirements.minBatteryHours !== null &&
        product.specifications.batteryHours < requirements.minBatteryHours
      ) {
        return false;
      }

      const isHeadphoneSearch =
        /\b(headphones?|headsets?|earphones?|earbuds?)\b/i.test(text);

      if (isHeadphoneSearch && product.category !== 'headphones') {
        return false;
      }

      return true;
    })
    
.map((product) => {
  let score = 0;
  const reasons = [];

  if (effectiveBudget !== null) {
    score += 15;
    reasons.push('Within your budget');
  }

  if (requirements.requiresWireless && product.specifications.wireless) {
    score += 20;
    reasons.push('Matches your wireless requirement');
  }

  if (
    requirements.requiresNoiseCancellation &&
    product.specifications.noiseCancellation
  ) {
    score += 25;
    reasons.push('Has noise cancellation');
  }

  if (requirements.minBatteryHours !== null) {
    reasons.push(
      `Meets your minimum battery requirement of ${requirements.minBatteryHours} hours`
    );
  }

  if (product.specifications.microphone) {
    score += 10;
    reasons.push('Includes a microphone');
  }

  if (requirements.preferLongBattery) {
    score += Math.min(
      20,
      (product.specifications.batteryHours / 50) * 20
    );
    reasons.push('Battery life considered in ranking');
  }

  if (requirements.preferCheapest && effectiveBudget !== null) {
    const affordability = Math.max(
      0,
      1 - product.price / effectiveBudget
    );

    score += affordability * 30;
    reasons.push('Ranked for affordability');
  }

  return {
    ...product,
    matchScore: Math.round(Math.min(100, score)),
    reasons,
  };
})

    .sort((a, b) => b.matchScore - a.matchScore || a.price - b.price);

  return {
    mode: 'demo',
    requirements,
    notice:
      'Demo catalogue only. These are fictional products and prices, not live retailer listings. Scores are rule-based, not AI-verified.',
    results: products,
  };
}

module.exports = { searchRetailers };
