const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TicketHistory = sequelize.define('TicketHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ticketId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'ticket_id'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id'
  },
  fieldName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'field_name'
  },
  oldValue: {
    type: DataTypes.TEXT,
    field: 'old_value'
  },
  newValue: {
    type: DataTypes.TEXT,
    field: 'new_value'
  }
}, {
  tableName: 'ticket_history',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = TicketHistory;
