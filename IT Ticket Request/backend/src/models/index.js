const { sequelize } = require('../config/database');
const User = require('./User');
const Category = require('./Category');
const Ticket = require('./Ticket');
const TicketComment = require('./TicketComment');
const TicketHistory = require('./TicketHistory');
const SLAPolicy = require('./SLAPolicy');

// Define relationships

// User -> Ticket (Requester)
User.hasMany(Ticket, { foreignKey: 'requesterId', as: 'requestedTickets' });
Ticket.belongsTo(User, { foreignKey: 'requesterId', as: 'requester' });

// User -> Ticket (Assigned)
User.hasMany(Ticket, { foreignKey: 'assignedTo', as: 'assignedTickets' });
Ticket.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignee' });

// Category -> Ticket
Category.hasMany(Ticket, { foreignKey: 'categoryId' });
Ticket.belongsTo(Category, { foreignKey: 'categoryId' });

// Ticket -> Comments
Ticket.hasMany(TicketComment, { foreignKey: 'ticketId', as: 'comments' });
TicketComment.belongsTo(Ticket, { foreignKey: 'ticketId' });

// User -> Comments
User.hasMany(TicketComment, { foreignKey: 'userId' });
TicketComment.belongsTo(User, { foreignKey: 'userId', as: 'author' });

// Ticket -> History
Ticket.hasMany(TicketHistory, { foreignKey: 'ticketId', as: 'history' });
TicketHistory.belongsTo(Ticket, { foreignKey: 'ticketId' });

// User -> History
User.hasMany(TicketHistory, { foreignKey: 'userId' });
TicketHistory.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  sequelize,
  User,
  Category,
  Ticket,
  TicketComment,
  TicketHistory,
  SLAPolicy
};
