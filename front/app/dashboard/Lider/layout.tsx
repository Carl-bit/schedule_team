import React from 'react';
import Header from './Header';
import Square from "../../components/Backgrounds/Square";

export default function LiderLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="relative min-h-screen bg-gray-900 text-white font-sans">
            <div className="absolute inset-0 z-0 h-full w-full">
                <Square
                    direction="diagonal"
                    speed={0.3}
                    borderColor="#1e3a8aff"
                    hoverFillColor="#06b6d4"
                    squareSize={63}
                />
            </div>

            <div className="relative z-10 flex flex-col h-screen">
                <Header />
                <main className="flex-1 overflow-auto p-4">
                    {children}
                </main>
            </div>
        </div>
    );
}
