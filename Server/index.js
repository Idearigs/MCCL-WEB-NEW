const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Sample products API endpoint
app.get('/api/products', (req, res) => {
  const products = [
    {
      id: 1,
      name: 'Diamond Constellation Necklace',
      category: 'necklaces',
      collection: 'The Celestial',
      price: 4500,
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=300&fit=crop'
    },
    {
      id: 2,
      name: 'Sapphire Royal Ring',
      category: 'rings',
      collection: 'Royal Heritage',
      price: 3200,
      image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=300&fit=crop'
    },
    {
      id: 3,
      name: 'Minimalist Diamond Earrings',
      category: 'earrings',
      collection: 'Modern Minimalist',
      price: 1800,
      image: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=400&h=300&fit=crop'
    }
  ];
  
  res.json(products);
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../Client/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../Client/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
