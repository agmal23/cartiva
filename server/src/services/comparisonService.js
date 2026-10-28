
function compareProducts(products, priorities = []) {
  if (!Array.isArray(products) || products.length < 2) {
    throw new Error('At least two products are required for comparison.');
  }

  return products.map((product) => {
    const features = (product.features || []).join(' ').toLowerCase();
    const description = (product.description || '').toLowerCase();
    const text = `${features} ${description}`;

    const batteryMatch = text.match(/(\d+)\s*-\s*hour battery/);
    const batteryHours = batteryMatch ? Number(batteryMatch[1]) : null;

    const noiseCancellation =
      /noise cancellation/.test(text);

    const matchedPriorities = priorities.filter((priority) => {
      const words = String(priority)
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((word) => word.length > 2);

      return words.length > 0 &&
        words.every((word) => text.includes(word));
    });

    return {
      id: product.id,
      name: product.name,
      price: product.price,
      rating: product.rating,
      batteryHours,
      noiseCancellation,
      matchedPriorities,
      matchScore: product.matchScore,
    };
  });
}

module.exports = { compareProducts };
