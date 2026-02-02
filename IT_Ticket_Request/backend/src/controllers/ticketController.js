const { Ticket, User, Category, TicketComment, TicketHistory, sequelize } = require('../models');
const { Op } = require('sequelize');
const { validationResult } = require('express-validator');
const dayjs = require('dayjs');

// @desc    Get all tickets
// @route   GET /api/v1/tickets
// @access  Private
exports.getTickets = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      category,
      assignedTo,
      search,
      myTickets
    } = req.query;

    const where = {};
    const offset = (page - 1) * limit;

    // Filter by status
    if (status) where.status = status;

    // Filter by priority
    if (priority) where.priority = priority;

    // Filter by category
    if (category) where.categoryId = category;

    // Filter by assigned user
    if (assignedTo) where.assignedTo = assignedTo;

    // Show only user's tickets (for non-admin/it_staff)
    if (myTickets === 'true' && req.user.role === 'user') {
      where.requesterId = req.user.userId;
    }

    // Search in title and description
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { ticketNumber: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: tickets } = await Ticket.findAndCountAll({
      where,
      include: [
        { model: User, as: 'requester', attributes: ['id', 'fullName', 'department'] },
        { model: User, as: 'assignee', attributes: ['id', 'fullName'] },
        { model: Category, attributes: ['id', 'name', 'color'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
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
    console.error('GetTickets error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single ticket
// @route   GET /api/v1/tickets/:id
// @access  Private
exports.getTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id, {
      include: [
        { model: User, as: 'requester', attributes: ['id', 'username', 'fullName', 'department', 'email'] },
        { model: User, as: 'assignee', attributes: ['id', 'username', 'fullName'] },
        { model: Category, attributes: ['id', 'name', 'color'] },
        { 
          model: TicketComment, 
          as: 'comments',
          include: [{ model: User, as: 'author', attributes: ['id', 'fullName', 'role'] }],
          order: [['createdAt', 'DESC']]
        },
        { 
          model: TicketHistory, 
          as: 'history',
          include: [{ model: User, attributes: ['id', 'fullName'] }],
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Check permission (only requester, assignee, admin, or it_staff can view)
    const isAuthorized = 
      req.user.role === 'admin' || 
      req.user.role === 'it_staff' ||
      ticket.requesterId === req.user.userId ||
      ticket.assignedTo === req.user.userId;

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: ticket });
  } catch (error) {
    console.error('GetTicket error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create new ticket
// @route   POST /api/v1/tickets
// @access  Private
exports.createTicket = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { title, description, categoryId, priority, location, assetTag } = req.body;

    // Calculate SLA due time based on priority
    const slaHours = {
      low: 72,
      medium: 48,
      high: 24,
      critical: 4
    };
    const slaDue = dayjs().add(slaHours[priority] || 48, 'hour').toDate();

    const ticket = await Ticket.create({
      title,
      description,
      requesterId: req.user.userId,
      categoryId,
      priority: priority || 'medium',
      location,
      assetTag,
      slaDue
    }, { transaction });

    // Create history entry
    await TicketHistory.create({
      ticketId: ticket.id,
      userId: req.user.userId,
      fieldName: 'created',
      newValue: 'Ticket created'
    }, { transaction });

    await transaction.commit();

    // Fetch complete ticket with relations
    const ticketWithRelations = await Ticket.findByPk(ticket.id, {
      include: [
        { model: User, as: 'requester', attributes: ['id', 'fullName', 'department'] },
        { model: Category, attributes: ['id', 'name', 'color'] }
      ]
    });

    res.status(201).json({
      success: true,
      data: ticketWithRelations
    });
  } catch (error) {
    await transaction.rollback();
    console.error('CreateTicket error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update ticket
// @route   PUT /api/v1/tickets/:id
// @access  Private (Admin, IT Staff, or Assignee)
exports.updateTicket = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const ticket = await Ticket.findByPk(req.params.id);

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Check permission
    const isAuthorized = 
      req.user.role === 'admin' || 
      req.user.role === 'it_staff' ||
      ticket.assignedTo === req.user.userId;

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { title, description, categoryId, priority, location, assetTag } = req.body;
    const updates = {};

    if (title) updates.title = title;
    if (description) updates.description = description;
    if (categoryId) updates.categoryId = categoryId;
    if (priority) updates.priority = priority;
    if (location) updates.location = location;
    if (assetTag) updates.assetTag = assetTag;

    // Track changes
    for (const [field, newValue] of Object.entries(updates)) {
      const oldValue = ticket[field];
      if (oldValue !== newValue) {
        await TicketHistory.create({
          ticketId: ticket.id,
          userId: req.user.userId,
          fieldName: field,
          oldValue: String(oldValue),
          newValue: String(newValue)
        }, { transaction });
      }
    }

    await ticket.update(updates, { transaction });
    await transaction.commit();

    res.json({ success: true, data: ticket });
  } catch (error) {
    await transaction.rollback();
    console.error('UpdateTicket error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update ticket status
// @route   POST /api/v1/tickets/:id/status
// @access  Private
exports.updateStatus = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { status, comment } = req.body;
    const ticket = await Ticket.findByPk(req.params.id);

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const oldStatus = ticket.status;
    const updateData = { status };

    // Set timestamps based on status
    if (status === 'resolved' && !ticket.resolvedAt) {
      updateData.resolvedAt = new Date();
    }
    if (status === 'closed' && !ticket.closedAt) {
      updateData.closedAt = new Date();
    }

    await ticket.update(updateData, { transaction });

    // Create history entry
    await TicketHistory.create({
      ticketId: ticket.id,
      userId: req.user.userId,
      fieldName: 'status',
      oldValue: oldStatus,
      newValue: status
    }, { transaction });

    // Add comment if provided
    if (comment) {
      await TicketComment.create({
        ticketId: ticket.id,
        userId: req.user.userId,
        content: `[Status changed to ${status}] ${comment}`,
        isInternal: false
      }, { transaction });
    }

    await transaction.commit();

    res.json({
      success: true,
      data: { id: ticket.id, status: ticket.status }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('UpdateStatus error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Assign ticket
// @route   POST /api/v1/tickets/:id/assign
// @access  Private (Admin, IT Staff)
exports.assignTicket = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { userId } = req.body;
    const ticket = await Ticket.findByPk(req.params.id);

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const oldAssignee = ticket.assignedTo;
    
    await ticket.update({ 
      assignedTo: userId,
      status: oldAssignee ? ticket.status : 'in_progress'
    }, { transaction });

    // Create history entry
    await TicketHistory.create({
      ticketId: ticket.id,
      userId: req.user.userId,
      fieldName: 'assignedTo',
      oldValue: oldAssignee ? String(oldAssignee) : 'Unassigned',
      newValue: userId ? String(userId) : 'Unassigned'
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      data: { id: ticket.id, assignedTo: ticket.assignedTo }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('AssignTicket error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Add comment to ticket
// @route   POST /api/v1/tickets/:id/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { content, isInternal } = req.body;
    const ticket = await Ticket.findByPk(req.params.id);

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Only admin/it_staff can add internal comments
    if (isInternal && !['admin', 'it_staff'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const comment = await TicketComment.create({
      ticketId: ticket.id,
      userId: req.user.userId,
      content,
      isInternal: isInternal || false
    });

    const commentWithAuthor = await TicketComment.findByPk(comment.id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'fullName', 'role'] }]
    });

    res.status(201).json({ success: true, data: commentWithAuthor });
  } catch (error) {
    console.error('AddComment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get ticket comments
// @route   GET /api/v1/tickets/:id/comments
// @access  Private
exports.getComments = async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Check permission
    const isAuthorized = 
      req.user.role === 'admin' || 
      req.user.role === 'it_staff' ||
      ticket.requesterId === req.user.userId ||
      ticket.assignedTo === req.user.userId;

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const comments = await TicketComment.findAll({
      where: { ticketId: req.params.id },
      include: [{ model: User, as: 'author', attributes: ['id', 'fullName', 'role'] }],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, data: comments });
  } catch (error) {
    console.error('GetComments error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete ticket
// @route   DELETE /api/v1/tickets/:id
// @access  Private (Admin only)
exports.deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    await ticket.destroy();

    res.json({ success: true, message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error('DeleteTicket error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
