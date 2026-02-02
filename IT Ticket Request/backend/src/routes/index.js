const express = require('express');
const router = express.Router();

// Import routes
const authRoutes = require('./auth');
const ticketRoutes = require('./tickets');
const userRoutes = require('./users');
const categoryRoutes = require('./categories');
const reportRoutes = require('./reports');

// Mount routes
router.use('/auth', authRoutes);
router.use('/tickets', ticketRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/reports', reportRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

module.exports = router;
