const { User, Ticket, sequelize } = require('../models');
const { Op } = require('sequelize');
const { validationResult } = require('express-validator');

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private (Admin, IT Staff)
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role } = req.query;
    const where = { isActive: true };

    if (search) {
      where[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { fullName: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (role) where.role = role;

    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: ['id', 'username', 'email', 'fullName', 'role', 'department', 'phone', 'avatarUrl', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit
    });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('GetUsers error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single user
// @route   GET /api/v1/users/:id
// @access  Private
exports.getUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'username', 'email', 'fullName', 'role', 'department', 'phone', 'avatarUrl', 'isActive', 'createdAt']
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('GetUser error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update user
// @route   PUT /api/v1/users/:id
// @access  Private (Own profile or Admin)
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check permission (only own profile or admin)
    if (req.user.userId !== parseInt(req.params.id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { fullName, department, phone, avatarUrl } = req.body;
    const updates = {};

    if (fullName) updates.fullName = fullName;
    if (department) updates.department = department;
    if (phone) updates.phone = phone;
    if (avatarUrl) updates.avatarUrl = avatarUrl;

    // Only admin can update role
    if (req.body.role && req.user.role === 'admin') {
      updates.role = req.body.role;
    }

    await user.update(updates);

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('UpdateUser error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get user's tickets
// @route   GET /api/v1/users/:id/tickets
// @access  Private
exports.getUserTickets = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const where = { requesterId: req.params.id };

    if (status) where.status = status;

    const { count, rows: tickets } = await Ticket.findAndCountAll({
      where,
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'fullName'] },
        { association: 'Category', attributes: ['id', 'name', 'color'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit
    });

    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('GetUserTickets error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get IT staff list (for assignment)
// @route   GET /api/v1/users/staff
// @access  Private (Admin, IT Staff)
exports.getITStaff = async (req, res) => {
  try {
    const staff = await User.findAll({
      where: {
        role: { [Op.in]: ['it_staff', 'admin'] },
        isActive: true
      },
      attributes: ['id', 'username', 'fullName', 'email', 'department']
    });

    res.json({ success: true, data: staff });
  } catch (error) {
    console.error('GetITStaff error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
