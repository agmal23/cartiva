import ReactMarkdown from 'react-markdown';
import {
  PayPalProvider,
  PayPalOneTimePaymentButton,
} from '@paypal/react-paypal-js/sdk-v6';
import {
  searchProducts,
  getRecommendations,
  compareProducts,
  searchRetailers,
} from './services/api';
import { useState } from 'react'

const suggestions = [
  { icon: '🎧', label: 'Headphones for studying', prompt: 'Find wireless headphones for studying under $100' },
  { icon: '⌨️', label: 'A keyboard for coding', prompt: 'Find a comfortable mechanical keyboard for coding' },
  { icon: '🖥️', label: 'A monitor for my setup', prompt: 'Recommend a monitor for programming and productivity' },
  { icon: '🎒', label: 'Everyday essentials', prompt: 'Find useful everyday tech essentials within a budget' },
]
function ProductCheckout({ product, onPaymentSuccess }) {
  const [paymentMessage, setPaymentMessage] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [processing, setProcessing] = useState(false);

  const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  if (!clientId) {
    return (
      <p className="mt-3 text-sm text-red-600">
        PayPal Client ID is missing. Check client/.env.
      </p>
    );
  }

  async function createOrder() {
    setPaymentError('');
    setPaymentMessage('');
    setProcessing(true);

    try {
      const response = await fetch(`${apiUrl}/api/paypal/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.orderID) {
        throw new Error(data.message || 'Unable to create PayPal order.');
      }

      return { orderId: data.orderID };
    } catch (error) {
      setPaymentError(error.message || 'Unable to start checkout.');
      setProcessing(false);
      throw error;
    }
  }

  async function capturePayment({ orderId }) {
    try {
      const response = await fetch(`${apiUrl}/api/paypal/capture-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderID: orderId }),
      });

      const data = await response.json();

      if (!response.ok || !data.success || data.status !== 'COMPLETED') {
        throw new Error(data.message || 'Payment could not be confirmed.');
      }

      setPaymentMessage(`Sandbox payment completed for ${product.name}.`);
      onPaymentSuccess?.(data);
    } catch (error) {
      setPaymentError(error.message || 'Payment confirmation failed.');
      throw error;
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="mt-4 border-t border-neutral-100 pt-4">
      <p className="mb-3 text-sm text-neutral-500">
        Demo checkout · ${product.price.toFixed(2)} USD
      </p>

      <PayPalProvider
        clientId={clientId}
        environment="sandbox"
        components={['paypal-payments']}
        pageType="checkout"
      >
        <PayPalOneTimePaymentButton
          createOrder={createOrder}
          onApprove={capturePayment}
          onCancel={() => {
            setProcessing(false);
            setPaymentMessage('Checkout cancelled. You have not completed payment.');
          }}
          onError={(error) => {
            setProcessing(false);
            setPaymentError(error?.message || 'PayPal checkout encountered an error.');
          }}
          type="checkout"
        />
      </PayPalProvider>

      {processing && (
        <p className="mt-2 text-sm text-neutral-500">
          Preparing your checkout...
        </p>
      )}

      {paymentMessage && (
        <p role="status" className="mt-3 text-sm text-green-700">
          {paymentMessage}
        </p>
      )}

      {paymentError && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {paymentError}
        </p>
      )}
    </div>
  );
}
function App() {
const [query, setQuery] = useState('')
const [products, setProducts] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
const [budget, setBudget] = useState('10000');
const [recommendationMode, setRecommendationMode] = useState(true);
const [explanation, setExplanation] = useState('');
const [selectedForComparison, setSelectedForComparison] = useState([]);
const [comparison, setComparison] = useState(null);
const [comparisonLoading, setComparisonLoading] = useState(false);
const [comparisonError, setComparisonError] = useState('');
async function handleSubmit(event) {
  event.preventDefault();

  if (!query.trim()) return;

  setLoading(true);
  setError('');
  setProducts([]);

  try {
    const result = await getRecommendations({
      query,
      budget: budget === '' ? null : Number(budget),
    });

    setProducts(result.products);
    setExplanation(result.explanation || '');
  } catch (err) {
    setError(err.message || 'Something went wrong.');
  } finally {
    setLoading(false);
  }
}


function toggleComparison(product) {
  setComparison(null);
  setComparisonError('');

  setSelectedForComparison((current) => {
    const alreadySelected = current.some((item) => item.id === product.id);

    if (alreadySelected) {
      return current.filter((item) => item.id !== product.id);
    }

    if (current.length >= 2) {
      setComparisonError('Select only two products to compare.');
      return current;
    }

    return [...current, product];
  });
}

async function handleCompare() {
  if (selectedForComparison.length !== 2) {
    setComparisonError('Please select two products first.');
    return;
  }

  setComparisonLoading(true);
  setComparisonError('');
  setComparison(null);

  try {
    const result = await compareProducts(
      selectedForComparison.map((product) => product.id),
      ['noise cancellation', 'long battery life']
    );

    setComparison(result.comparison);
  } catch (error) {
    setComparisonError(error.message || 'Unable to compare products.');
  } finally {
    setComparisonLoading(false);
  }
}

async function handleRetailerSearch() {
  if (!query.trim()) {
    setError('Please enter a product to search for.');
    return;
  }

  setLoading(true);
  setError('');
  setProducts([]);
  setExplanation('');
  setComparison(null);
  setSelectedForComparison([]);

  try {
    console.log('Starting retailer search:', query);

    const result = await searchRetailers({
      query: query.trim(),
      budget: budget === '' ? null : Number(budget),
    });

    console.log('Retailer search response:', result);

    if (!result.success) {
      throw new Error(result.message || 'Retailer search failed.');
    }

    setProducts(result.results || []);
    setExplanation(result.notice || 'Search completed.');
  } catch (err) {
    console.error('Retailer search failed:', err);
    setError(err.message || 'Unable to search retailer products.');
  } finally {
    setLoading(false);
  }
}


  return (
    <div className="min-h-screen bg-[#faf9f6] text-neutral-900">
      <header className="flex items-center justify-between border-b border-neutral-200/80 px-6 py-5 md:px-12">
        <a href="/" className="text-2xl font-bold tracking-tight">
          cartiva<span className="text-orange-600">.</span>
        </a>

        <nav className="hidden items-center gap-8 text-sm text-neutral-600 md:flex">
          <a href="#how-it-works" className="transition hover:text-black">How it works</a>
          <a href="#discover" className="transition hover:text-black">Discover</a>
        </nav>

        <button
          onClick={() => document.getElementById('shopping-prompt')?.focus()}
          className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700"
        >
          Start shopping <span aria-hidden="true">↗</span>
        </button>
      </header>

      <main>
        <section className="mx-auto flex max-w-5xl flex-col items-center px-5 pb-20 pt-20 text-center sm:pt-28">
          <div className="mb-7 flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-medium text-orange-800">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            YOUR PERSONAL AI SHOPPING AGENT
          </div>

          <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-tight sm:text-6xl md:text-7xl">
            Less searching.
            <br />
            <span className="text-orange-600">More finding.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-neutral-500 sm:text-lg">
            Tell Cartiva what you need. Get thoughtful recommendations,
            compare your options, and shop with confidence.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-10 w-full max-w-2xl rounded-3xl border border-neutral-200 bg-white p-3 text-left shadow-[0_12px_50px_rgba(0,0,0,0.05)] transition focus-within:border-orange-300"
          >
            <label htmlFor="shopping-prompt" className="sr-only">
              Describe what you want to buy
            </label>
            <textarea
              id="shopping-prompt"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="I'm looking for headphones under $100 with great noise cancellation..."
              rows={3}
              className="w-full resize-none bg-transparent px-4 py-3 text-base outline-none placeholder:text-neutral-400"
            />
            
<div className="px-4 pb-3">
  <label
    htmlFor="shopping-budget"
    className="mb-2 block text-sm font-medium text-neutral-700"
  >
    Maximum budget (USD)
  </label>

  <input
    id="shopping-budget"
    type="number"
    min="0"
    value={budget}
    onChange={(event) => setBudget(event.target.value)}
    placeholder="100"
    className="w-full rounded-xl border border-neutral-200 px-3 py-2 outline-none focus:border-orange-400"
  />
</div>

            <div className="flex flex-col items-stretch gap-3 px-2 pb-1 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-neutral-400">Your needs. Your budget. Your choice.</span>
              <button
                type="submit"
                className="shrink-0 rounded-full bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-700 w-full sm:w-auto"
              >
                Find my match <span aria-hidden="true">→</span>
              </button>
              <button
  type="button"
  onClick={handleRetailerSearch}
  disabled={loading || !query.trim()}
  className="shrink-0 rounded-full border border-orange-600 px-5 py-3 text-sm font-semibold text-orange-700 hover:bg-orange-50 disabled:opacity-50 w-full sm:w-auto"
>
  Search retailers
</button>
            </div>
          </form>

          <div id="discover" className="mt-10 w-full max-w-2xl text-left">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
              Not sure where to start?
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((item) => (
                <button
                  key={item.label}
                  onClick={() => setQuery(item.prompt)}
                  className="rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-600 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-800"
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </section>

<section className="mx-auto max-w-5xl px-5 pb-16">
  {loading && (
    <p className="text-center text-neutral-500">
      Searching the Cartiva catalogue...
    </p>
  )}

  {error && (
    <p className="text-center text-red-600">{error}</p>
  )}

  {products.length > 0 && (
    <>
      <h2 className="mb-6 text-2xl font-semibold">
        Products for you
      </h2>
{/* NEW CODE: AI explanation starts here */}

{explanation && (
  <section className="mb-8 overflow-hidden rounded-3xl border border-orange-200 bg-white shadow-sm">
    {/* Header */}
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-orange-100 bg-orange-50 px-5 py-5 sm:px-7">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-xl text-white shadow-sm">
          ✦
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">
            AI-powered shopping
          </p>

          <h3 className="mt-1 text-lg font-semibold tracking-tight text-neutral-900 sm:text-xl">
            Your recommendations
          </h3>
        </div>
      </div>

      <span className="rounded-full border border-orange-200 bg-white px-3 py-1.5 text-xs font-medium text-orange-700">
        Cartiva AI
      </span>
    </div>

    {/* AI response */}
    <div className="p-5 sm:p-7">
      <p className="mb-4 text-sm leading-6 text-neutral-500">
        Recommendations based on your shopping request and budget.
      </p>

      <div className="wrap-break-words text-sm leading-7 text-neutral-700 sm:text-base [&_h1]:mb-3 [&_h1]:mt-5 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:font-semibold [&_p]:mb-3 [&_strong]:font-semibold [&_strong]:text-neutral-900 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5">
  <ReactMarkdown>{explanation}</ReactMarkdown>
</div>
    </div>
  </section>
)}

{/* NEW CODE: AI explanation ends here */}
      <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
        {products.map((product) => (
          <article
  key={product.id}
  className="group flex min-w-0 flex-col rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg sm:p-6"
>
            <p className="text-xs font-medium uppercase tracking-wider text-orange-600">
              {product.brand} · {product.category}
            </p>

            <h3 className="mt-3 text-lg font-semibold">
              {product.name}
            </h3>

            <p className="mt-2 min-h-12 text-sm leading-6 text-neutral-500">
  {product.description}
</p>

            <div className="mt-5 flex items-center justify-between gap-3 border-t border-neutral-100 pt-4">
              <span className="text-xl font-semibold">
                ${product.price}
              </span>
              <span className="text-sm text-neutral-500">
  {product.rating != null ? `★ ${product.rating}` : 'Rating unavailable'}
</span>
            </div>

           
<ul className="mt-4 space-y-2 text-sm text-neutral-600">
  {product.features.map((feature) => (
    <li key={feature} className="flex items-start gap-2 leading-5">
      <span className="mt-0.5 font-semibold text-orange-500">✓</span>
      <span>{feature}</span>
    </li>
  ))}
</ul>

{/* NEW: Match score and reasons */}
{product.matchScore !== undefined && (
  <div className="mt-4 rounded-xl bg-orange-50 p-4">
    <div className="flex items-center justify-between">
      <span className="text-sm font-semibold text-gray-900">
        Cartiva match score
      </span>
      <span className="text-lg font-bold text-orange-600">
        {product.matchScore}/100
      </span>
    </div>

    <div className="mt-2 h-2 overflow-hidden rounded-full bg-orange-100">
      <div
        className="h-full rounded-full bg-orange-500"
        style={{
          width: `${Math.min(100, Math.max(0, product.matchScore))}%`,
        }}
      />
    </div>

    {product.reasons?.length > 0 && (
      <ul className="mt-3 space-y-1 text-sm text-gray-700">
        {product.reasons.map((reason) => (
          <li key={reason}>✓ {reason}</li>
        ))}
      </ul>
    )}
  </div>
)}


{/* Compare button */}
<button
  type="button"
  onClick={() => toggleComparison(product)}

  
  className={`mt-4 w-full rounded-lg border px-4 py-2 text-sm font-medium ${
    selectedForComparison.some((item) => item.id === product.id)
      ? 'border-orange-600 bg-orange-600 text-white'
      : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
  }`}
>
  {selectedForComparison.some((item) => item.id === product.id)
    ? 'Selected for comparison'
    : 'Compare this product'}
</button>
{/* PayPal checkout */}
<ProductCheckout
  product={product}
  onPaymentSuccess={(payment) => {
    console.log('PayPal Sandbox payment completed:', payment.orderID);
  }}
/>
          </article>
        ))}
        


{/* ADD THE COMPARISON SECTION HERE */}
{/* Product comparison section */}
{selectedForComparison.length > 0 && (
  <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5">
    <p className="mb-3 text-sm text-neutral-600">
      {selectedForComparison.length} of 2 products selected
    </p>
{/* PayPal checkout */}

    <button
      type="button"
      onClick={handleCompare}
      disabled={selectedForComparison.length !== 2 || comparisonLoading}
      className="rounded-lg bg-orange-600 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      {comparisonLoading ? 'Comparing...' : 'Compare selected products'}
    </button>

    {comparisonError && (
      <p className="mt-3 text-sm text-red-600">{comparisonError}</p>
    )}

    {comparison && (
      <div className="mt-5 w-full min-w-0 rounded-xl border border-gray-200 p-4">
        <h3 className="mb-4 text-xl font-semibold">
          Product comparison
        </h3>

        <table className="w-full table-fixed text-left text-sm">
          <thead>
            <tr>
              <th className="p-2">Feature</th>
              {comparison.map((product) => (
                <th key={product.id} className="p-2">
                  {product.name}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {[
              ['Price', (p) => `$${p.price}`],
              ['Rating', (p) => `${p.rating}/5`],
              [
                'Battery life',
                (p) =>
                  p.batteryHours == null
                    ? 'Not specified'
                    : `${p.batteryHours} hours`,
              ],
              [
                'Noise cancellation',
                (p) => (p.noiseCancellation ? 'Yes' : 'Not listed'),
              ],
              [
                'Matched priorities',
                (p) =>
                  p.matchedPriorities?.length
                    ? p.matchedPriorities.join(', ')
                    : 'None',
              ],
            ].map(([label, getValue]) => (
              <tr key={label} className="border-t border-gray-100">
                <td className="p-2 font-medium">{label}</td>

                {comparison.map((product) => (
                  <td key={product.id} className="p-2">
                    {getValue(product)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
)}

{/* Existing content below this point */}

      </div>
    </>
  )}

  {!loading && !error && products.length === 0 && query.trim() && (
    <p className="text-center text-neutral-500">
      No matching products found. Try a different search.
    </p>
  )}
</section>

        <section id="how-it-works" className="border-t border-neutral-200/80 bg-white px-6 py-16 md:px-12">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">
                  Shopping, rethought
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                  A smarter way to choose.
                </h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-neutral-500">
                From your first question to checkout, stay in control of every decision.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                { number: '01', title: 'Tell us what matters', description: 'Share your needs, budget, and must-have features in plain language.' },
                { number: '02', title: 'Compare with clarity', description: 'Explore matching products and understand the trade-offs before choosing.' },
                { number: '03', title: 'Checkout with control', description: 'Review your order and approve payment through PayPal Sandbox.' },
              ].map((step) => (
                <article key={step.number} className="rounded-2xl border border-neutral-200 bg-[#faf9f6] p-6">
                  <span className="text-sm font-semibold text-orange-600">{step.number}</span>
                  <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-neutral-500">{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="flex flex-col items-center justify-between gap-3 border-t border-neutral-200 px-6 py-6 text-sm text-neutral-500 sm:flex-row md:px-12">
        <span className="font-semibold tracking-tight text-neutral-800">cartiva.</span>
        <span>Intelligent shopping. Confident decisions.</span>
        <span>AI-assisted · Always your choice</span>
      </footer>
    </div>
  )
}

export default App
