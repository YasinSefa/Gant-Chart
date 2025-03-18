import React, { useState, useRef } from 'react';

const formatDateTime = (dateTimeString) => {
    if (!dateTimeString || typeof dateTimeString !== 'string') return '';
    return dateTimeString.replace('T', ' ').replace('Z', '').substring(0, 19);
};

const formatUnixTime = (unixTime) => {
    try {
        const date = new Date(unixTime);
        const year = date.getUTCFullYear();
        const day = String(date.getUTCDate()).padStart(2, "0");
        const month = String(date.getUTCMonth() + 1).padStart(2, "0");
        const hours = String(date.getUTCHours()).padStart(2, "0");
        const minutes = String(date.getUTCMinutes()).padStart(2, "0");
        return `${year}-${day}-${month} ${hours}:${minutes}`;
    } catch (error) {
        return '';
    }
};

const CustomTooltip = ({ x, y, task, machineName, visible }) => {
    if (!visible || !task) return null;

    return (
        <div style={{
            position: 'absolute',
            left: `${x}px`,
            top: `${y}px`,
            backgroundColor: '#fff',
            padding: '15px',
            border: '1px solid #ccc',
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
            maxWidth: '300px',
            transform: 'translate(-50%, -100%)',
            marginTop: '250px',
            zIndex: 1000,
            pointerEvents: 'none'
        }}>
            <div style={{
                borderBottom: '2px solid #4169e1',
                marginBottom: '10px',
                paddingBottom: '5px'
            }}>
                <p style={{
                    margin: '0',
                    fontWeight: 'bold',
                    fontSize: '16px'
                }}>
                    {machineName}
                </p>
                <p style={{
                    margin: '5px 0 0 0',
                    color: '#4169e1',
                    fontWeight: '600'
                }}>
                    {task.workOrderNumber}
                </p>
            </div>
            <div style={{
                backgroundColor: '#f8f9fa',
                padding: '10px',
                borderRadius: '6px'
            }}>
                <p style={{ margin: '5px 0' }}>
                    <strong>Start:</strong> {task.startTimeISO}
                </p>
                <p style={{ margin: '5px 0' }}>
                    <strong>End:</strong> {task.endTimeISO}
                </p>
                <p style={{ margin: '5px 0' }}>
                    <strong>Customer:</strong> {task.customer || 'ATLAS'}
                </p>
            </div>
        </div>
    );
};

const GanttChart = ({ data, highlightedOrder }) => {
    const [hoveredTask, setHoveredTask] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const svgRef = useRef(null);
    const containerRef = useRef(null);

    // Sabit değerler
    const CHART_PADDING = 40;
    const LEFT_AXIS_WIDTH = 150;
    const BOTTOM_AXIS_HEIGHT = 60;
    const ROW_HEIGHT = 60;
    const BAR_HEIGHT = 40;

    // Unique machines ve work orders
    const machines = [...new Set(data.map(item => item.machine?.name))].filter(Boolean).sort();

    // Zaman aralığı hesaplama
    const allTimes = data.flatMap(item => [
        new Date(item.startTime).getTime(),
        new Date(item.endTime).getTime()
    ]);
    const minTime = Math.min(...allTimes);
    const maxTime = Math.max(...allTimes);
    const timeRange = maxTime - minTime;
    const padding = timeRange * 0.05;
    const domainMin = minTime - padding;
    const domainMax = maxTime + padding;

    // SVG boyutları
    const width = 1200;
    const height = machines.length * ROW_HEIGHT + 50 + BOTTOM_AXIS_HEIGHT + CHART_PADDING * 2;

    // Ölçekleme fonksiyonları
    const timeToX = (time) => {
        return LEFT_AXIS_WIDTH + ((time - domainMin) / (domainMax - domainMin)) * (width - LEFT_AXIS_WIDTH - CHART_PADDING);
    };

    // Task verilerini dönüştür
    const transformedData = machines.map((machineName, machineIndex) => {
        const machineTasks = data.filter(item => item.machine?.name === machineName);

        return {
            machineName,
            y: CHART_PADDING + machineIndex * ROW_HEIGHT + ROW_HEIGHT / 2,
            tasks: machineTasks.map(task => ({
                workOrderNumber: task.workOrder?.orderNumber,
                toolType: task.workOrder?.toolType || 'N/A',
                customer: task.workOrder?.customer || 'ATLAS',
                startTime: new Date(task.startTime).getTime(),
                endTime: new Date(task.endTime).getTime(),
                startTimeISO: formatDateTime(task.startTime),
                endTimeISO: formatDateTime(task.endTime)
            }))
        };
    });

    // İş emri numarasına göre highlight kontrolü
    const isHighlighted = (workOrderNumber) => {
        if (!highlightedOrder) return false;
        // Tam eşleşme kontrolü
        return workOrderNumber === highlightedOrder;
    };

    // X ekseni için zaman etiketleri
    const getTimeLabels = () => {
        const hourMs = 3600000;
        const labels = [];
        let currentTime = Math.floor(domainMin / hourMs) * hourMs;

        while (currentTime <= domainMax) {
            labels.push({
                time: currentTime,
                x: timeToX(currentTime),
                label: formatUnixTime(currentTime)
            });
            currentTime += hourMs;
        }
        return labels;
    };

    const handleMouseMove = (e) => {
        if (!svgRef.current || !containerRef.current) return;

        const svgRect = svgRef.current.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - svgRect.left;
        const mouseY = e.clientY - svgRect.top;

        // Hangi task'ın üzerinde olduğumuzu bul
        for (const machine of transformedData) {
            const machineY = machine.y;
            if (Math.abs(mouseY - machineY) <= BAR_HEIGHT / 2) {
                for (const task of machine.tasks) {
                    const taskStartX = timeToX(task.startTime);
                    const taskEndX = timeToX(task.endTime);

                    if (mouseX >= taskStartX && mouseX <= taskEndX) {
                        setHoveredTask({
                            ...task,
                            machineName: machine.machineName
                        });
                        setTooltipPos({
                            x: e.clientX - containerRect.left,
                            y: e.clientY - containerRect.top
                        });
                        return;
                    }
                }
            }
        }
        setHoveredTask(null);
    };

    const handleMouseLeave = () => {
        setHoveredTask(null);
    };

    return (
        <div ref={containerRef} style={{
            width: '100%',
            height: `${height}px`,
            backgroundColor: '#f8f9fa',
            padding: '20px',
            position: 'relative',
            overflow: 'auto'
        }}>
            <svg
                ref={svgRef}
                width={width}
                height={height}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                {/* Izgara çizgileri */}
                {transformedData.map((machine, index) => (
                    <line
                        key={`grid-${index}`}
                        x1={LEFT_AXIS_WIDTH}
                        y1={machine.y}
                        x2={width - CHART_PADDING}
                        y2={machine.y}
                        stroke="#e0e0e0"
                        strokeDasharray="3 3"
                    />
                ))}

                {/* Makine isimleri (Y ekseni) */}
                {transformedData.map((machine, index) => (
                    <text
                        key={`machine-${index}`}
                        x={LEFT_AXIS_WIDTH - 10}
                        y={machine.y}
                        textAnchor="end"
                        alignmentBaseline="middle"
                        fill="#666"
                        fontSize="14"
                    >
                        {machine.machineName}
                    </text>
                ))}

                {/* Zaman etiketleri (X ekseni) */}
                {getTimeLabels().map((label, index) => (
                    <g key={`time-${index}`}>
                        <line
                            x1={label.x}
                            y1={CHART_PADDING}
                            x2={label.x}
                            y2={height - BOTTOM_AXIS_HEIGHT}
                            stroke="#e0e0e0"
                            strokeDasharray="3 3"
                        />
                        <text
                            x={label.x}
                            y={height - BOTTOM_AXIS_HEIGHT / 2}
                            textAnchor="middle"
                            fill="#666"
                            fontSize="12"
                            transform={`rotate(-45, ${label.x}, ${height - BOTTOM_AXIS_HEIGHT / 2})`}
                        >
                            {label.label}
                        </text>
                    </g>
                ))}

                {/* Task barları */}
                {transformedData.map((machine) => (
                    machine.tasks.map((task, taskIndex) => {
                        const startX = timeToX(task.startTime);
                        const endX = timeToX(task.endTime);
                        return (
                            <g key={`task-${machine.machineName}-${taskIndex}`}>
                                <rect
                                    x={startX}
                                    y={machine.y - BAR_HEIGHT / 2}
                                    width={endX - startX}
                                    height={BAR_HEIGHT}
                                    fill={isHighlighted(task.workOrderNumber) ? '#ffeb3b' : '#4169e1'}
                                    rx={6}
                                    ry={6}
                                    opacity={hoveredTask?.workOrderNumber === task.workOrderNumber ? 0.8 : 1}
                                />
                            </g>
                        );
                    })
                ))}
            </svg>

            {/* Tooltip */}
            <CustomTooltip
                x={tooltipPos.x}
                y={tooltipPos.y}
                task={hoveredTask}
                machineName={hoveredTask?.machineName}
                visible={!!hoveredTask}
            />
        </div>
    );
};

export default GanttChart; 