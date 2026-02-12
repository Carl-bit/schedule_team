"use client";

import React, { useRef, useEffect } from 'react';

type CanvasStrokeStyle = string | CanvasGradient | CanvasPattern;

interface GridOffset {
    x: number;
    y: number;
}

interface SquaresProps {
    direction?: 'diagonal' | 'up' | 'right' | 'down' | 'left';
    speed?: number;
    borderColor?: CanvasStrokeStyle;
    squareSize?: number;
    hoverFillColor?: CanvasStrokeStyle;
}

interface ActiveSquare {
    x: number;
    y: number;
    opacity: number; // Para que aparezca y desaparezca suavemente
}

const Squares: React.FC<SquaresProps> = ({
    direction = 'right',
    speed = 1,
    borderColor = '#999',
    squareSize = 40,
    hoverFillColor = '#222'
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number | null>(null);
    const numSquaresX = useRef<number>(0);
    const numSquaresY = useRef<number>(0);
    const gridOffset = useRef<GridOffset>({ x: 0, y: 0 });
    const hoveredSquareRef = useRef<GridOffset | null>(null);
    const activeSquares = useRef<ActiveSquare[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const resizeCanvas = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            numSquaresX.current = Math.ceil(canvas.width / squareSize) + 1;
            numSquaresY.current = Math.ceil(canvas.height / squareSize) + 1;
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        const drawGrid = () => {
            if (!ctx) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const startX = Math.floor(gridOffset.current.x / squareSize);
            const startY = Math.floor(gridOffset.current.y / squareSize);

            for (let i = 0; i <= numSquaresX.current + 2; i++) {
                for (let j = 0; j <= numSquaresY.current + 2; j++) {
                    const gridX = startX + i;
                    const gridY = startY + j;

                    const squareX = (gridX * squareSize) - gridOffset.current.x;
                    const squareY = (gridY * squareSize) - gridOffset.current.y;

                    // Buscamos si este cuadro específico es un "fantasma" activo
                    const activeSquare = activeSquares.current.find(
                        sq => sq.x === gridX && sq.y === gridY
                    );

                    // Verificamos si el mouse está encima
                    const isHovered = hoveredSquareRef.current &&
                        gridX === hoveredSquareRef.current.x &&
                        gridY === hoveredSquareRef.current.y;

                    if (isHovered) {
                        ctx.fillStyle = hoverFillColor;
                        ctx.fillRect(squareX, squareY, squareSize, squareSize);
                    } else if (activeSquare) {
                        ctx.globalAlpha = activeSquare.opacity;
                        ctx.fillStyle = hoverFillColor;
                        ctx.fillRect(squareX, squareY, squareSize, squareSize);
                        ctx.globalAlpha = 1;
                    }

                    ctx.strokeStyle = borderColor;
                    ctx.strokeRect(squareX, squareY, squareSize, squareSize);
                }
            }

            const gradient = ctx.createRadialGradient(
                canvas.width / 2,
                canvas.height / 2,
                0,
                canvas.width / 2,
                canvas.height / 2,
                Math.sqrt(canvas.width ** 2 + canvas.height ** 2) / 2
            );
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
            gradient.addColorStop(1, '#060010');

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        };

        const updateAnimation = () => {
            const effectiveSpeed = Math.max(speed, 0.1);
            switch (direction) {
                case 'right':
                    gridOffset.current.x -= effectiveSpeed;
                    break;
                case 'left':
                    gridOffset.current.x += effectiveSpeed;
                    break;
                case 'up':
                    gridOffset.current.y += effectiveSpeed;
                    break;
                case 'down':
                    gridOffset.current.y -= effectiveSpeed;
                    break;
                case 'diagonal':
                    gridOffset.current.x -= effectiveSpeed;
                    gridOffset.current.y -= effectiveSpeed;
                    break;
                default:
                    break;
            }

            activeSquares.current = activeSquares.current
                .map((sq) => ({ ...sq, opacity: sq.opacity - 0.009 }))
                .filter((sq) => sq.opacity > 0);

            for (let i = 0; i < 5; i++) {
                if (Math.random() < 0.3) {
                    const startX = Math.floor(gridOffset.current.x / squareSize);
                    const startY = Math.floor(gridOffset.current.y / squareSize);

                    const newX = startX + Math.floor(Math.random() * numSquaresX.current);
                    const newY = startY + Math.floor(Math.random() * numSquaresY.current);

                    if (!activeSquares.current.some(sq => sq.x === newX && sq.y === newY)) {
                        activeSquares.current.push({ x: newX, y: newY, opacity: 1 });
                    }
                }
            }

            drawGrid();
            requestRef.current = requestAnimationFrame(updateAnimation);
        };

        const handleMouseMove = (event: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            const hoveredSquareX = Math.floor((mouseX + gridOffset.current.x) / squareSize);
            const hoveredSquareY = Math.floor((mouseY + gridOffset.current.y) / squareSize);

            if (
                !hoveredSquareRef.current ||
                hoveredSquareRef.current.x !== hoveredSquareX ||
                hoveredSquareRef.current.y !== hoveredSquareY
            ) {
                hoveredSquareRef.current = { x: hoveredSquareX, y: hoveredSquareY };
            }
        };

        const handleMouseLeave = () => {
            hoveredSquareRef.current = null;
        };

        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseleave', handleMouseLeave);
        requestRef.current = requestAnimationFrame(updateAnimation);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [direction, speed, borderColor, hoverFillColor, squareSize]);

    return <canvas ref={canvasRef} className="w-full h-full border-none block"></canvas>;
};

export default Squares;
