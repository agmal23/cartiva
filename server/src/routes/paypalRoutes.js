
const express = require('express');
const router = express.Router();
const products = require('../data/products.json');

const PAYPAL_BASE_URL =
  process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';

async function getAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials are missing from server/.env');
  }

  const credentials = Buffer.from(
    `${clientId}:${clientSecret}`
  ).toString('base64');

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error_description || 'PayPal authentication failed.');
  }

  return data.access_token;
}

// Create a PayPal order using a trusted catalogue product ID.
router.post('/create-order', async (req, res) => {
  try {
    const { productId } = req.body || {};

    if (typeof productId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'A valid product ID is required.',
      });
    }

    const product = products.find((item) => item.id === productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in the Cartiva catalogue.',
      });
    }

    if (!Number.isFinite(product.price) || product.price <= 0 ||
        product.stock <= 0 || product.currency !== 'USD') {
      return res.status(400).json({
        success: false,
        message: 'This product is unavailable for checkout.',
      });
    }

    const accessToken = await getAccessToken();

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: product.id,
          description: product.name,
          amount: {
            currency_code: 'USD',
            value: product.price.toFixed(2),
          },
        }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('PayPal order creation failed:', data);
      return res.status(502).json({
        success: false,
        message: 'PayPal could not create the order.',
      });
    }

    res.json({
      success: true,
      orderID: data.id,
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        currency: product.currency,
      },
    });
  } catch (error) {
    console.error('Create order error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to create PayPal order.',
    });
  }
});

// Capture an order after the buyer approves it.
router.post('/capture-order', async (req, res) => {
  try {
    const { orderID } = req.body || {};

    if (
      typeof orderID !== 'string' ||
      !/^[A-Z0-9-]+$/i.test(orderID) ||
      orderID.length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: 'A valid PayPal order ID is required.',
      });
    }

    const accessToken = await getAccessToken();

    const response = await fetch(
      `${PAYPAL_BASE_URL}/v2/checkout/orders/${encodeURIComponent(orderID)}/capture`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('PayPal capture failed:', data);
      return res.status(502).json({
        success: false,
        message: 'PayPal could not capture this order.',
      });
    }

    if (data.status !== 'COMPLETED') {
      return res.status(409).json({
        success: false,
        status: data.status,
        message: 'Payment has not completed.',
      });
    }

    res.json({
      success: true,
      orderID: data.id,
      status: data.status,
      message: 'PayPal Sandbox payment completed successfully.',
    });
  } catch (error) {
    console.error('Capture order error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to capture PayPal payment.',
    });
  }
});

module.exports = router;
