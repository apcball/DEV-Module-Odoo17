const { Category } = require('../models');
const { validationResult } = require('express-validator');

// @desc    Get all categories
// @route   GET /api/v1/categories
// @access  Private
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']]
    });

    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('GetCategories error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create category
// @route   POST /api/v1/categories
// @access  Private (Admin)
exports.createCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, description, icon, color } = req.body;

    const category = await Category.create({
      name,
      description,
      icon,
      color
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    console.error('CreateCategory error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update category
// @route   PUT /api/v1/categories/:id
// @access  Private (Admin)
exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const { name, description, icon, color, isActive } = req.body;
    
    await category.update({
      name: name || category.name,
      description: description || category.description,
      icon: icon || category.icon,
      color: color || category.color,
      isActive: isActive !== undefined ? isActive : category.isActive
    });

    res.json({ success: true, data: category });
  } catch (error) {
    console.error('UpdateCategory error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete category
// @route   DELETE /api/v1/categories/:id
// @access  Private (Admin)
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    await category.update({ isActive: false });

    res.json({ success: true, message: 'Category deactivated successfully' });
  } catch (error) {
    console.error('DeleteCategory error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
