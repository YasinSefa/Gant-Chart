const express = require('express');
const router = express.Router();
const workOrderController = require('../controllers/workOrderController');

// Get all work orders
router.get('/', workOrderController.getAllWorkOrders);

// Get work order by number
router.get('/:id', workOrderController.getWorkOrderByNumber);

module.exports = router; 