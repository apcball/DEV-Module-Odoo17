const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const dayjs = require('dayjs');

const Ticket = sequelize.define('Ticket', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ticketNumber: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    field: 'ticket_number'
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  requesterId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'requester_id'
  },
  categoryId: {
    type: DataTypes.INTEGER,
    field: 'category_id'
  },
  assignedTo: {
    type: DataTypes.INTEGER,
    field: 'assigned_to'
  },
  status: {
    type: DataTypes.ENUM('open', 'in_progress', 'waiting', 'resolved', 'closed', 'cancelled'),
    defaultValue: 'open'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium'
  },
  slaDue: {
    type: DataTypes.DATE,
    field: 'sla_due'
  },
  resolvedAt: {
    type: DataTypes.DATE,
    field: 'resolved_at'
  },
  closedAt: {
    type: DataTypes.DATE,
    field: 'closed_at'
  },
  location: {
    type: DataTypes.STRING(100)
  },
  assetTag: {
    type: DataTypes.STRING(50),
    field: 'asset_tag'
  }
}, {
  tableName: 'tickets',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeCreate: async (ticket) => {
      // Generate ticket number: IT-YYYYMMDD-XXX
      const date = dayjs().format('YYYYMMDD');
      const count = await Ticket.count({
        where: sequelize.where(
          sequelize.fn('DATE', sequelize.col('created_at')),
          dayjs().format('YYYY-MM-DD')
        )
      });
      ticket.ticketNumber = `IT-${date}-${String(count + 1).padStart(3, '0')}`;
    }
  }
});

module.exports = Ticket;
