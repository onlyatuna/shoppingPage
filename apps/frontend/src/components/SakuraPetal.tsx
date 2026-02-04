import { ComponentPropsWithoutRef } from 'react';

interface SakuraPetalProps extends ComponentPropsWithoutRef<'svg'> {
    size?: number;
    delay?: number;
    duration?: number;
    color?: string;
    animationType?: 'float' | 'fall';
}

export default function SakuraPetal({
    size = 24,
    delay = 0,
    duration = 3,
    color = "text-pink-300",
    animationType = 'float',
    className,
    ...props
}: SakuraPetalProps) {
    const animationName = animationType === 'fall' ? 'sakura-fall' : 'float';

    return (
        <svg
            viewBox="0 0 100 100" // Using a standard 0-100 viewBox for path simplicity
            width={size}
            height={size}
            fill="currentColor"
            className={`pointer-events-none opacity-20 ${color} ${className}`}
            style={{
                animation: `${animationName} ${duration}s ease-in-out infinite`,
                animationDelay: `${delay}s`,
            }}
            {...props}
        >
            {/* Authentic Petal Shape with Notch */}
            <path d="M50 15 C 60 5, 85 10, 85 40 C 85 70, 55 90, 50 95 C 45 90, 15 70, 15 40 C 15 10, 40 5, 50 15 Z" />

            {/* Additional inner details for illustrative look (optional, keeping it simple for now) */}
        </svg>
    );
}
