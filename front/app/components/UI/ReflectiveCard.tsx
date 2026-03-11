import React from 'react';

interface ReflectiveCardProps {
    blurStrength?: number;
    color?: string;
    metalness?: number;
    roughness?: number;
    overlayColor?: string;
    displacementStrength?: number;
    noiseScale?: number;
    specularConstant?: number;
    grayscale?: number;
    glassDistortion?: number;
    children?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}

const ReflectiveCard: React.FC<ReflectiveCardProps> = ({
    blurStrength = 12,
    color = 'white',
    metalness = 1,
    roughness = 0.4,
    overlayColor = 'rgba(255, 255, 255, 0.1)',
    displacementStrength = 20,
    noiseScale = 1,
    specularConstant = 1.2,
    grayscale = 1,
    glassDistortion = 0,
    children,
    className = '',
    style = {}
}) => {
    const baseFrequency = 0.03 / Math.max(0.1, noiseScale);
    const saturation = 1 - Math.max(0, Math.min(1, grayscale));

    const cssVariables = {
        '--blur-strength': `${blurStrength}px`,
        '--metalness': metalness,
        '--roughness': roughness,
        '--overlay-color': overlayColor,
        '--text-color': color,
        '--saturation': saturation
    } as React.CSSProperties;

    return (
        <div
            className={`relative w-full h-full rounded-[20px] overflow-hidden bg-[#1a1a2e] shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.1)_inset] isolate font-sans ${className}`}
            style={{ ...style, ...cssVariables }}
        >
            {/* Clean flat gradient background */}
            <div
                className="absolute top-0 left-0 w-full h-full z-0"
                style={{
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)',
                }}
            />

            {/* Subtle border glow */}
            <div className="absolute inset-0 rounded-[20px] p-[1px] bg-[linear-gradient(135deg,rgba(255,255,255,0.15)_0%,rgba(255,255,255,0.05)_50%,rgba(255,255,255,0.1)_100%)] [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [mask-composite:exclude] z-20 pointer-events-none" />

            <div className="relative z-10 w-full h-full flex flex-col text-[var(--text-color,white)] bg-[var(--overlay-color,rgba(255,255,255,0.05))]">
                {children}
            </div>
        </div>
    );
};

export default ReflectiveCard;
