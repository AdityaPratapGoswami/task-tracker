'use client';

import Logo from './Logo';

/**
 * Shown below the desktop breakpoint.
 *
 * Balance is a laptop-only web app: the week grid is seven columns of dense
 * data and the day board is a two-column split, neither of which reduces
 * honestly to a phone. Rather than ship a degraded layout, this says so.
 */
export default function NarrowScreenNotice() {
    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 20,
                padding: 32,
                textAlign: 'center',
                background: 'var(--m-bg)',
                color: 'var(--m-text)',
            }}
        >
            <Logo size={56} />

            <div>
                <div className="m-brand" style={{ fontSize: 21, marginBottom: 12 }}>BALANCE</div>
                <h1
                    style={{
                        fontFamily: 'var(--m-heading)',
                        fontWeight: 800,
                        fontSize: 24,
                        letterSpacing: '-0.02em',
                        margin: '0 0 10px',
                        textWrap: 'pretty',
                    }}
                >
                    Open this on a laptop
                </h1>
                <p
                    style={{
                        fontSize: 15,
                        color: 'var(--m-neutral-600)',
                        margin: 0,
                        maxWidth: 380,
                        lineHeight: 1.5,
                        textWrap: 'pretty',
                    }}
                >
                    Balance is built for a wide screen — the week grid needs the room.
                    Come back on a desktop or widen this window.
                </p>
            </div>
        </div>
    );
}
