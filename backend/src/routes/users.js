const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Routes
router.get('/', authorize('admin', 'it_staff'), userController.getUsers);
router.get('/staff', authorize('admin', 'it_staff'), userController.getITStaff);
router.get('/:id', userController.getUser);
router.put('/:id', userController.updateUser);
router.get('/:id/tickets', userController.getUserTickets);

module.exports = router;
