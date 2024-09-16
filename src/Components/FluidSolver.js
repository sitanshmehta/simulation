import React, { useRef, useEffect } from 'react';

export class FluidSolver {
    constructor(size) {
        this.size = size;
        this.N = size;
        this.iter = 4;
        const N = this.N;

        this.s = new Float32Array(N * N); // Temporary array for calculations
        this.density = new Float32Array(N * N);

        this.Vx = new Float32Array(N * N);
        this.Vy = new Float32Array(N * N);
        this.Vx0 = new Float32Array(N * N);
        this.Vy0 = new Float32Array(N * N);

        this.dt = 0.1;
        this.diff = 0.0001;
        this.visc = 0.0001;
    }

    IX(x, y) {
        const N = this.N;
        x = Math.max(0, Math.min(x, N - 1));
        y = Math.max(0, Math.min(y, N - 1));
        return x + y * N;
    }

    addDensity(x, y, amount) {
        const index = this.IX(x, y);
        this.density[index] += amount;
    }

    addVelocity(x, y, amountX, amountY) {
        const index = this.IX(x, y);
        this.Vx[index] += amountX;
        this.Vy[index] += amountY;
    }

    step() {
        const N = this.N;
        const visc = this.visc;
        const diff = this.diff;
        const dt = this.dt;
        const Vx = this.Vx;
        const Vy = this.Vy;
        const Vx0 = this.Vx0;
        const Vy0 = this.Vy0;
        const s = this.s;
        const density = this.density;

        // Velocity diffusion
        this.diffuse(1, Vx0, Vx, visc, dt);
        this.diffuse(2, Vy0, Vy, visc, dt);

        // Project to make velocity field mass conserving
        this.project(Vx0, Vy0, Vx, Vy);

        // Advect velocity
        this.advect(1, Vx, Vx0, Vx0, Vy0, dt);
        this.advect(2, Vy, Vy0, Vx0, Vy0, dt);

        // Project again
        this.project(Vx, Vy, Vx0, Vy0);

        // Diffuse density
        this.diffuse(0, s, density, diff, dt);

        // Advect density
        this.advect(0, density, s, Vx, Vy, dt);
    }

    set_bnd(b, x) {
        const N = this.N;
        for (let i = 1; i < N - 1; i++) {
            x[this.IX(i, 0)] = b === 2 ? -x[this.IX(i, 1)] : x[this.IX(i, 1)];
            x[this.IX(i, N - 1)] = b === 2 ? -x[this.IX(i, N - 2)] : x[this.IX(i, N - 2)];
        }
        for (let j = 1; j < N - 1; j++) {
            x[this.IX(0, j)] = b === 1 ? -x[this.IX(1, j)] : x[this.IX(1, j)];
            x[this.IX(N - 1, j)] = b === 1 ? -x[this.IX(N - 2, j)] : x[this.IX(N - 2, j)];
        }

        x[this.IX(0, 0)] = 0.5 * (x[this.IX(1, 0)] + x[this.IX(0, 1)]);
        x[this.IX(0, N - 1)] = 0.5 * (x[this.IX(1, N - 1)] + x[this.IX(0, N - 2)]);
        x[this.IX(N - 1, 0)] = 0.5 * (x[this.IX(N - 2, 0)] + x[this.IX(N - 1, 1)]);
        x[this.IX(N - 1, N - 1)] =
            0.5 * (x[this.IX(N - 2, N - 1)] + x[this.IX(N - 1, N - 2)]);
    }

    diffuse(b, x, x0, diff, dt) {
        const N = this.N;
        const a = dt * diff * (N - 2) * (N - 2);
        this.lin_solve(b, x, x0, a, 1 + 4 * a);
    }

    lin_solve(b, x, x0, a, c) {
        const N = this.N;
        const cRecip = 1.0 / c;
        for (let k = 0; k < this.iter; k++) {
            for (let i = 1; i < N - 1; i++) {
                for (let j = 1; j < N - 1; j++) {
                    x[this.IX(i, j)] =
                        (x0[this.IX(i, j)] +
                            a *
                            (x[this.IX(i + 1, j)] +
                                x[this.IX(i - 1, j)] +
                                x[this.IX(i, j + 1)] +
                                x[this.IX(i, j - 1)])) *
                        cRecip;
                }
            }
            this.set_bnd(b, x);
        }
    }

    project(velocX, velocY, p, div) {
        const N = this.N;
        for (let i = 1; i < N - 1; i++) {
            for (let j = 1; j < N - 1; j++) {
                div[this.IX(i, j)] =
                    (-0.5 *
                        (velocX[this.IX(i + 1, j)] -
                            velocX[this.IX(i - 1, j)] +
                            velocY[this.IX(i, j + 1)] -
                            velocY[this.IX(i, j - 1)])) /
                    N;
                p[this.IX(i, j)] = 0;
            }
        }
        this.set_bnd(0, div);
        this.set_bnd(0, p);

        this.lin_solve(0, p, div, 1, 4);

        for (let i = 1; i < N - 1; i++) {
            for (let j = 1; j < N - 1; j++) {
                velocX[this.IX(i, j)] -= 0.5 * (p[this.IX(i + 1, j)] - p[this.IX(i - 1, j)]) * N;
                velocY[this.IX(i, j)] -= 0.5 * (p[this.IX(i, j + 1)] - p[this.IX(i, j - 1)]) * N;
            }
        }
        this.set_bnd(1, velocX);
        this.set_bnd(2, velocY);
    }

    advect(b, d, d0, velocX, velocY, dt) {
        const N = this.N;
        const dt0 = dt * (N - 2);

        for (let i = 1; i < N - 1; i++) {
            for (let j = 1; j < N - 1; j++) {
                let x = i - dt0 * velocX[this.IX(i, j)];
                let y = j - dt0 * velocY[this.IX(i, j)];

                if (x < 0.5) x = 0.5;
                if (x > N - 1.5) x = N - 1.5;
                const i0 = Math.floor(x);
                const i1 = i0 + 1;

                if (y < 0.5) y = 0.5;
                if (y > N - 1.5) y = N - 1.5;
                const j0 = Math.floor(y);
                const j1 = j0 + 1;

                const s1 = x - i0;
                const s0 = 1 - s1;
                const t1 = y - j0;
                const t0 = 1 - t1;

                const i0i = i0;
                const i1i = i1;
                const j0i = j0;
                const j1i = j1;

                d[this.IX(i, j)] =
                    s0 * (t0 * d0[this.IX(i0i, j0i)] + t1 * d0[this.IX(i0i, j1i)]) +
                    s1 * (t0 * d0[this.IX(i1i, j0i)] + t1 * d0[this.IX(i1i, j1i)]);
            }
        }
        this.set_bnd(b, d);
    }
}

const FluidSimulator = () => {
    const canvasRef = useRef(null);
    const gridSize = 64; // Increased grid size for smoother simulation
    const cellSize = 5; // Adjust cell size accordingly
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
        const N = gridSize;
        const imageData = ctx.createImageData(N, N);
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
            sim.addDensity(x, y, 100);
            sim.addVelocity(x, y, 0.5, 0.5);
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

export default FluidSimulator;
