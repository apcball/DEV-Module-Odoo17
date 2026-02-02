const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const categoryController = require('../controllers/categoryController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Public routes (for all authenticated users)
router.get('/', categoryController.getCategories);

// Admin only routes
router.post('/', authorize('admin'), [
  body('name').trim().notEmpty().withMessage('Category name is required')
], categoryController.createCategory);

router.put('/:id', authorize('admin'), categoryController.updateCategory);
router.delete('/:id', authorize('admin'), categoryController.deleteCategory);

module.exports = router;
