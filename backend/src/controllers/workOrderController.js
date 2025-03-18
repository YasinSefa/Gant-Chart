const prisma = require('../services/prisma');

const workOrderController = {
    // Get all work orders with their machine assignments
    getAllWorkOrders: async (req, res) => {
        try {
            const workOrders = await prisma.machineWorkOrder.findMany({
                include: {
                    machine: true,
                    workOrder: true,
                },
                orderBy: {
                    startTime: 'asc',
                },
            });
            res.json(workOrders);
        } catch (error) {
            console.error('Error fetching work orders:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Get a specific work order by order number
    getWorkOrderByNumber: async (req, res) => {
        try {
            const { id } = req.params;
            const workOrders = await prisma.machineWorkOrder.findMany({
                where: {
                    workOrder: {
                        orderNumber: id,
                    },
                },
                include: {
                    machine: true,
                    workOrder: true,
                },
                orderBy: {
                    startTime: 'asc',
                },
            });

            if (workOrders.length === 0) {
                return res.status(404).json({ error: 'Work order not found' });
            }

            res.json(workOrders);
        } catch (error) {
            console.error('Error fetching work order:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
};

module.exports = workOrderController; 