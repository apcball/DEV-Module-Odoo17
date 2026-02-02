const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const ticketController = require('../controllers/ticketController');
const { authenticate, authorize } = require('../middleware/auth');

// Validation rules
const createTicketValidation = [
  body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Title must be 5-200 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('categoryId').optional().isInt().withMessage('Category ID must be a number'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
  body('location').optional().trim(),
  body('assetTag').optional().trim()
];

const commentValidation = [
  body('content').trim().notEmpty().withMessage('Comment content is required'),
  body('isInternal').optional().isBoolean()
];

const statusValidation = [
  body('status').isIn(['open', 'in_progress', 'waiting', 'resolved', 'closed', 'cancelled']).withMessage('Invalid status'),
  body('comment').optional().trim()
];

// All routes require authentication
router.use(authenticate);

// Routes
router.get('/', ticketController.getTickets);
router.post('/', createTicketValidation, ticketController.createTicket);
router.get('/:id', ticketController.getTicket);
router.put('/:id', authorize('admin', 'it_staff'), ticketController.updateTicket);
router.delete('/:id', authorize('admin'), ticketController.deleteTicket);

// Status and assignment
router.post('/:id/status', statusValidation, ticketController.updateStatus);
router.post('/:id/assign', authorize('admin', 'it_staff'), ticketController.assignTicket);

// Comments
router.get('/:id/comments', ticketController.getComments);
router.post('/:id/comments', commentValidation, ticketController.addComment);

module.exports = router;
