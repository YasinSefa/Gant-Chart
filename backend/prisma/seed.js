const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // First, clean the database
    await prisma.machineWorkOrder.deleteMany();
    await prisma.workOrder.deleteMany();
    await prisma.machine.deleteMany();

    // Create machines
    const machines = await Promise.all([
        prisma.machine.create({ data: { name: 'SARDON', description: 'Sardon Machine' } }),
        prisma.machine.create({ data: { name: 'RAM 2', description: 'Ram 2 Machine' } }),
        prisma.machine.create({ data: { name: 'FINAL KALITE KONTROL', description: 'Final Quality Control' } }),
        prisma.machine.create({ data: { name: 'RAM 1', description: 'Ram 1 Machine' } }),
        prisma.machine.create({ data: { name: 'SARDON 1', description: 'Sardon 1 Machine' } }),
        prisma.machine.create({ data: { name: 'KURUTMA 2', description: 'Drying Machine 2' } }),
        prisma.machine.create({ data: { name: 'SARDON 2', description: 'Sardon 2 Machine' } }),
        prisma.machine.create({ data: { name: 'YIKAMA', description: 'Washing Machine' } }),
        prisma.machine.create({ data: { name: 'TUP ACMA', description: 'Tube Opening Machine' } }),
        prisma.machine.create({ data: { name: 'KURUTMA 1', description: 'Drying Machine 1' } }),
        prisma.machine.create({ data: { name: 'BALON', description: 'Balloon Machine' } }),
        prisma.machine.create({ data: { name: 'KON5', description: 'Kon5 Machine' } }),
        prisma.machine.create({ data: { name: 'KON3', description: 'Kon3 Machine' } }),
    ]);

    // Helper function to create DateTime objects
    const createDateTime = (dateStr, timeStr) => {
        const [year, month, day] = dateStr.split('-');
        const [hours, minutes] = timeStr.split(':');
        return new Date(year, month - 1, day, hours, minutes);
    };

    // Create work orders first
    const workOrders = await Promise.all([
        prisma.workOrder.create({
            data: {
                orderNumber: 'MFG-1',
                customer: 'ATLAS'
            }
        }),
        prisma.workOrder.create({
            data: {
                orderNumber: 'MFG-2',
                customer: 'ATLAS'
            }
        }),
        prisma.workOrder.create({
            data: {
                orderNumber: 'MFG-3',
                customer: 'ATLAS'
            }
        })
    ]);

    // Sample data based on the Gantt chart
    const assignments = [
        // MFG-1 assignments (multiple machines)
        {
            machine: 'KON3',
            workOrder: 'MFG-1',
            startTime: createDateTime('2024-12-18', '09:58'),
            endTime: createDateTime('2024-12-18', '10:28'),
        },
        {
            machine: 'YIKAMA',
            workOrder: 'MFG-1',
            startTime: createDateTime('2024-12-18', '11:00'),
            endTime: createDateTime('2024-12-18', '12:30'),
        },
        {
            machine: 'KURUTMA 1',
            workOrder: 'MFG-1',
            startTime: createDateTime('2024-12-18', '12:45'),
            endTime: createDateTime('2024-12-18', '14:15'),
        },
        {
            machine: 'RAM 2',
            workOrder: 'MFG-1',
            startTime: createDateTime('2024-12-18', '14:30'),
            endTime: createDateTime('2024-12-18', '16:00'),
        },
        // MFG-2 assignments (multiple machines)
        {
            machine: 'KON5',
            workOrder: 'MFG-2',
            startTime: createDateTime('2024-12-18', '10:30'),
            endTime: createDateTime('2024-12-18', '11:30'),
        },
        {
            machine: 'SARDON 1',
            workOrder: 'MFG-2',
            startTime: createDateTime('2024-12-18', '12:00'),
            endTime: createDateTime('2024-12-18', '13:30'),
        },
        {
            machine: 'KURUTMA 2',
            workOrder: 'MFG-2',
            startTime: createDateTime('2024-12-18', '14:00'),
            endTime: createDateTime('2024-12-18', '15:30'),
        },
        // MFG-3 assignments (multiple machines)
        {
            machine: 'BALON',
            workOrder: 'MFG-3',
            startTime: createDateTime('2024-12-18', '11:00'),
            endTime: createDateTime('2024-12-18', '13:00'),
        },
        {
            machine: 'TUP ACMA',
            workOrder: 'MFG-3',
            startTime: createDateTime('2024-12-18', '13:30'),
            endTime: createDateTime('2024-12-18', '15:00'),
        },
        {
            machine: 'FINAL KALITE KONTROL',
            workOrder: 'MFG-3',
            startTime: createDateTime('2024-12-18', '15:30'),
            endTime: createDateTime('2024-12-18', '17:00'),
        },
    ];

    // Create machine work order assignments
    for (const assignment of assignments) {
        const machine = machines.find(m => m.name === assignment.machine);
        const workOrder = workOrders.find(w => w.orderNumber === assignment.workOrder);

        if (!machine || !workOrder) {
            console.error(`Machine ${assignment.machine} or Work Order ${assignment.workOrder} not found`);
            continue;
        }

        try {
            await prisma.machineWorkOrder.create({
                data: {
                    machineId: machine.id,
                    workOrderId: workOrder.id,
                    startTime: assignment.startTime,
                    endTime: assignment.endTime,
                    status: 'scheduled'
                }
            });
        } catch (error) {
            console.error(`Error creating assignment for ${assignment.workOrder} on ${assignment.machine}:`, error);
        }
    }

    console.log('Database has been seeded with test data');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    }); 