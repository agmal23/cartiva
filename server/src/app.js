

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Import routes
const productRoutes = require('./routes/productRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const comparisonRoutes = require('./routes/comparisonRoutes');
const retailerRoutes = require('./routes/retailerRoutes');
const paypalRoutes = require('./routes/paypalRoutes');
// Middleware
app.use(cors({
  origin: [
    'https://cartiva-cyan.vercel.app',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175'
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Cartiva API is running!',
  });
});

// API routes
app.use('/api/products', productRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/compare', comparisonRoutes);
app.use('/api/retailers', retailerRoutes);
app.use('/api/paypal', paypalRoutes);
// Start server
app.listen(PORT, () => {
  console.log(`Cartiva API running at http://localhost:${PORT}`);
});
