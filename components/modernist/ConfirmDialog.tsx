'use client';

import { useEffect, useRef } from 'react';

interface Props {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

/**
 * Modernist-styled stand-in for window.confirm.
 *
 * The native dialog carries the browser chrome (its own font, its own
 * "example.com says" header) rather than the app's — this is the same
 * overlay/panel shell QuickAddSpontaneous uses, so every custom dialog in
 * the app reads as one system instead of some being native and some not.
 */
export default function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmLabel = 'Remove',
    cancelLabel = 'Cancel',
    onConfirm,
    onCancel,
}: Props) {
    const confirmRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (isOpen) {
            const id = setTimeout(() => confirmRef.current?.focus(), 0);
            return () => clearTimeout(id);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                display: 'grid',
                placeItems: 'center',
                background: 'color-mix(in srgb, #201e1d 50%, transparent)',
                zIndex: 50,
            }}
            onClick={onCancel}
        >
            <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="m-confirm-title"
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: 400,
                    maxWidth: '90vw',
                    background: 'var(--m-bg)',
                    border: '2px solid var(--m-divider)',
                    padding: 28,
                }}
            >
                <div id="m-confirm-title" className="m-label" style={{ marginBottom: 10 }}>
                    {title}
                </div>
                <p style={{ fontSize: 15, color: 'var(--m-text)', margin: '0 0 22px', lineHeight: 1.5 }}>
                    {message}
                </p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button className="m-btn m-btn-secondary" onClick={onCancel}>
                        {cancelLabel}
                    </button>
                    <button ref={confirmRef} className="m-btn m-btn-primary" onClick={onConfirm}>
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
