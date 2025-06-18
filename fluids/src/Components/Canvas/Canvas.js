import React, { useEffect, useRef } from 'react';

const Canvas = () => {
    const canvasRef = useRef(null);
    const gridSize = 20;  // Small grid for simplicity
    const cellSize = 30;  // Size of each cell in pixels

    // Use useRef instead of useState to avoid unnecessary re-renders
    const gridRef = useRef(
        Array(gridSize)
            .fill()
            .map(() => Array(gridSize).fill(255))
    );

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Draw the initial grid once
        drawGrid(ctx, gridRef.current);
    }, []);

    const drawGrid = (ctx, grid) => {
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const value = grid[i][j];
                ctx.fillStyle = `rgb(${value}, ${value}, ${value})`; // Set color based on value
                ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
                ctx.strokeRect(i * cellSize, j * cellSize, cellSize, cellSize); // Add border to cells
            }
        }
    };

    const handleMouseMove = (event) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((event.clientX - rect.left) / cellSize);
        const y = Math.floor((event.clientY - rect.top) / cellSize);

        if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
            const grid = gridRef.current;
            if (grid[x][y] !== 100) { // Only update if the value has changed
                grid[x][y] = 100; // Darken the color for this cell
                const ctx = canvas.getContext('2d');

                // Redraw only the affected cell
                ctx.fillStyle = `rgb(100, 100, 100)`;
                ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize); // Add border to cells
            }
        }
    };

    return (
        <div className='main-canvas'>
            <canvas
                ref={canvasRef}
                width={gridSize * cellSize}
                height={gridSize * cellSize}
                onMouseMove={handleMouseMove}
                style={{ border: '1px solid black' }}
            />
        </div>
    );
};

export default Canvas;
