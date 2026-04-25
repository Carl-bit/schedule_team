import React from 'react';
import Header from '../../components/UI/Header';

export default function LiderLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative min-h-screen font-sans" style={{ background: 'var(--pr-bg)', color: 'var(--pr-fg)' }}>
            <div className="relative z-10 flex flex-col h-screen">
                <Header titulo="Panel del Líder" empresa="Empresa Demo" />
                <main className="flex-1 overflow-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
}
