import React, { useRef, useEffect } from 'react';
import { FluidSolver } from './FluidSolver';


const FluidSimulation = () => {
    const canvasRef = useRef(null);
    const gridSize = 60; // Increased grid size for smoother simulation
    const cellSize = 10; // Adjust cell size accordingly
    const simulationRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Initialize simulation
        simulationRef.current = new FluidSolver(gridSize);

        // Start the simulation loop
        let animationFrameId;
        const render = () => {
            simulationRef.current.step();
            drawDensity(ctx, simulationRef.current.density);
            animationFrameId = requestAnimationFrame(render);
        };
        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    const drawDensity = (ctx, density) => {
        const imageData = ctx.createImageData(gridSize, gridSize);
        for (let i = 0; i < density.length; i++) {
            const value = density[i];
            const color = Math.min(255, value * 255);
            imageData.data[i * 4 + 0] = color; // R
            imageData.data[i * 4 + 1] = color; // G
            imageData.data[i * 4 + 2] = color; // B
            imageData.data[i * 4 + 3] = 255;   // A
        }
        ctx.putImageData(imageData, 0, 0);
        ctx.scale(cellSize, cellSize);
    };

    const handleMouseMove = (event) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((event.clientX - rect.left) / cellSize);
        const y = Math.floor((event.clientY - rect.top) / cellSize);

        if (x >= 1 && x < gridSize - 1 && y >= 1 && y < gridSize - 1) {
            const sim = simulationRef.current;
            sim.addDensity(x, y, 10);
            sim.addVelocity(x, y, 0.1, 0.1);
        }
    };

    return (
        <canvas
            ref={canvasRef}
            width={gridSize * cellSize}
            height={gridSize * cellSize}
            onMouseMove={handleMouseMove}
            style={{ border: '1px solid black' }}
        />
    );
};

export default FluidSimulation;
