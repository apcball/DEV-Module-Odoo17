const { Ticket, User, Category, sequelize } = require('../models');
const { Op } = require('sequelize');
const dayjs = require('dayjs');

// @desc    Get dashboard statistics
// @route   GET /api/v1/reports/dashboard
// @access  Private (Admin, IT Staff, Manager)
exports.getDashboard = async (req, res) => {
  try {
    const today = dayjs().startOf('day');
    const thisMonth = dayjs().startOf('month');

    // Basic counts
    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedToday,
      highPriorityTickets,
      overdueTickets
    ] = await Promise.all([
      Ticket.count(),
      Ticket.count({ where: { status: 'open' } }),
      Ticket.count({ where: { status: 'in_progress' } }),
      Ticket.count({
        where: {
          status: 'resolved',
          resolvedAt: { [Op.gte]: today.toDate() }
        }
      }),
      Ticket.count({ where: { priority: 'high', status: { [Op.notIn]: ['closed', 'resolved'] } } }),
      Ticket.count({
        where: {
          slaDue: { [Op.lt]: new Date() },
          status: { [Op.notIn]: ['closed', 'resolved', 'cancelled'] }
        }
      })
    ]);

    // Tickets by status
    const ticketsByStatus = await Ticket.findAll({
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('status')), 'count']],
      group: ['status']
    });

    // Tickets by priority
    const ticketsByPriority = await Ticket.findAll({
      attributes: ['priority', [sequelize.fn('COUNT', sequelize.col('priority')), 'count']],
      group: ['priority']
    });

    // Tickets by category
    const ticketsByCategory = await Ticket.findAll({
      include: [{ model: Category, attributes: ['name', 'color'] }],
      attributes: ['Category.id', [sequelize.fn('COUNT', sequelize.col('Ticket.id')), 'count']],
      group: ['Category.id', 'Category.name', 'Category.color']
    });

    // Recent tickets
    const recentTickets = await Ticket.findAll({
      include: [
        { model: User, as: 'requester', attributes: ['fullName'] },
        { model: Category, attributes: ['name', 'color'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    // Top performers (IT Staff with most resolved tickets this month)
    const topPerformers = await Ticket.findAll({
      where: {
        status: 'resolved',
        resolvedAt: { [Op.gte]: thisMonth.toDate() }
      },
      include: [{ model: User, as: 'assignee', attributes: ['fullName'] }],
      attributes: ['assignedTo', [sequelize.fn('COUNT', sequelize.col('Ticket.id')), 'count']],
      group: ['assignedTo', 'assignee.id', 'assignee.fullName'],
      order: [[sequelize.fn('COUNT', sequelize.col('Ticket.id')), 'DESC']],
      limit: 5
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalTickets,
          openTickets,
          inProgressTickets,
          resolvedToday,
          highPriorityTickets,
          overdueTickets
        },
        ticketsByStatus,
        ticketsByPriority,
        ticketsByCategory,
        recentTickets,
        topPerformers
      }
    });
  } catch (error) {
    console.error('GetDashboard error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get ticket trends
// @route   GET /api/v1/reports/trends
// @access  Private (Admin, Manager)
exports.getTrends = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = dayjs().subtract(days, 'day').startOf('day');

    // Daily ticket creation trend
    const dailyTrends = await Ticket.findAll({
      where: {
        createdAt: { [Op.gte]: startDate.toDate() }
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.fn('DATE', sequelize.col('created_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
      raw: true
    });

    res.json({ success: true, data: { dailyTrends } });
  } catch (error) {
    console.error('GetTrends error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
