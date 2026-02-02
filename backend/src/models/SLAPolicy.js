const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SLAPolicy = sequelize.define('SLAPolicy', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    allowNull: false,
    unique: true
  },
  responseTimeHours: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'response_time_hours'
  },
  resolutionTimeHours: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'resolution_time_hours'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'sla_policies',
  timestamps: false
});

module.exports = SLAPolicy;
