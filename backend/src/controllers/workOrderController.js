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

    // Create a new work order
    createWorkOrder: async (req, res) => {
        try {
            const { customer, machineId, startTime, endTime, nextNumber } = req.body;

            // Get the latest work order number if nextNumber is not provided
            let orderNumber;
            if (nextNumber) {
                orderNumber = `MFG-${nextNumber}`;
            } else {
                const latestWorkOrder = await prisma.workOrder.findFirst({
                    orderBy: {
                        orderNumber: 'desc'
                    }
                });

                let autoNextNumber = 1;
                if (latestWorkOrder) {
                    const lastNumber = parseInt(latestWorkOrder.orderNumber.split('-')[1]);
                    autoNextNumber = lastNumber + 1;
                }
                orderNumber = `MFG-${autoNextNumber}`;
            }

            // Check if the same work order is already assigned to the same machine
            const existingAssignment = await prisma.machineWorkOrder.findFirst({
                where: {
                    machineId: machineId,
                    workOrder: {
                        orderNumber: orderNumber
                    }
                }
            });

            if (existingAssignment) {
                return res.status(400).json({
                    error: 'This work order is already assigned to this machine'
                });
            }

            // Check if the machine has any other work order at the given time
            const conflictingWorkOrder = await prisma.machineWorkOrder.findFirst({
                where: {
                    machineId: machineId,
                    OR: [
                        {
                            startTime: {
                                lte: endTime
                            },
                            endTime: {
                                gte: startTime
                            }
                        }
                    ]
                }
            });

            if (conflictingWorkOrder) {
                return res.status(400).json({
                    error: 'This machine already has a work order at the given time'
                });
            }

            // Check if another work order with the same `nextNumber` starts at the exact same minute
            const sameTimeConflict = await prisma.machineWorkOrder.findFirst({
                where: {
                    startTime: startTime,
                    workOrder: {
                        orderNumber: {
                            startsWith: `MFG-${nextNumber}`
                        }
                    }
                }
            });

            if (sameTimeConflict) {
                return res.status(400).json({
                    error: 'A work order with this nextNumber already starts at this exact minute'
                });
            }

            // Check if the work order exists, if not create it
            let workOrder = await prisma.workOrder.findUnique({
                where: {
                    orderNumber: orderNumber
                }
            });

            if (!workOrder) {
                workOrder = await prisma.workOrder.create({
                    data: {
                        orderNumber,
                        customer
                    }
                });
            }

            // Assign the work order to the machine
            const machineAssignment = await prisma.machineWorkOrder.create({
                data: {
                    workOrderId: workOrder.id,
                    machineId,
                    startTime,
                    endTime,
                    status: 'scheduled'
                }
            });

            res.status(201).json({
                message: 'Work order successfully assigned to machine',
                workOrder,
                machineAssignment
            });
        } catch (error) {
            console.error('Error creating work order:', error);
            if (error.code === 'P2002') {
                return res.status(400).json({
                    error: 'Work order cannot be assigned to multiple machines at the same time'
                });
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    }


};

module.exports = workOrderController; 