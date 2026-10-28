
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function searchProducts({ query = '', category = '', maxPrice = '' } = {}) {
  const params = new URLSearchParams();

  if (query.trim()) params.set('q', query.trim());
  if (category) params.set('category', category);
  if (maxPrice !== '') params.set('maxPrice', maxPrice);

  const response = await fetch(
    `${API_URL}/api/products?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error('Unable to fetch products. Please try again.');
  }

  return response.json();
}

export async function getRecommendations({ query, budget, category = '' }) {
  const response = await fetch(`${API_URL}/api/recommendations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, budget, category }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Unable to get recommendations.');
  }

  return result;
}


export async function compareProducts(productIds, priorities = []) {
  const response = await fetch(`${API_URL}/api/compare`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      productIds,
      priorities,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Unable to compare products.');
  }

  return result;
}


export async function searchRetailers({ query = '', budget = null } = {}) {
  const response = await fetch(`${API_URL}/api/retailers/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, budget }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Unable to search retailers.');
  }

  return result;
}

