/**
 * The Balance mark — "Pillars": four bars of rising height, rightmost solid
 * accent. Same motif as the week grid's filled-vs-empty cells, scaled down
 * to a mark. Flat by design (no radius, no gradient, no outline) per the
 * Modernist system's identity guidelines.
 */
function PillarBars({ size, tone }: { size: number; tone: 'normal' | 'reversed' }) {
    const barColor = tone === 'reversed' ? 'var(--m-bg)' : 'var(--m-text)';
    return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <rect x="0" y="36" width="8" height="12" fill={barColor} />
            <rect x="13" y="24" width="8" height="24" fill={barColor} />
            <rect x="26" y="12" width="8" height="36" fill={barColor} />
            <rect x="39" y="0" width="8" height="48" fill="var(--m-accent)" />
        </svg>
    );
}

interface LogoProps {
    /** Tile/icon size in px. */
    size?: number;
    /**
     * 'tile' — dark square with the mark reversed inside, for standalone use
     * (auth screens, loader, narrow-screen notice).
     * 'mark' — just the bars, colored for a light background, for pairing
     * next to the BALANCE wordmark (navbar).
     */
    variant?: 'tile' | 'mark';
    className?: string;
}

export default function Logo({ size = 40, variant = 'tile', className }: LogoProps) {
    if (variant === 'mark') {
        return <PillarBars size={size} tone="normal" />;
    }

    return (
        <div
            className={className}
            style={{
                width: size,
                height: size,
                background: 'var(--m-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
            }}
        >
            <PillarBars size={size * 0.6} tone="reversed" />
        </div>
    );
}
