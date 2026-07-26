'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import GoogleAuthButton from './GoogleAuthButton';

export default function LoginBoard() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login({ email, password });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to sign in');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                display: 'grid',
                placeItems: 'center',
                background: 'var(--m-surface)',
                padding: 16,
                overflowY: 'auto',
            }}
        >
            <form
                onSubmit={handleSubmit}
                style={{
                    width: 440,
                    maxWidth: '100%',
                    background: 'var(--m-bg)',
                    border: '2px solid var(--m-divider)',
                    padding: 40,
                    margin: '24px 0',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                    <div
                        style={{
                            width: 56,
                            height: 56,
                            borderRadius: 14,
                            background: '#1a1a1a',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Zap size={26} fill="currentColor" />
                    </div>
                </div>

                <h1
                    style={{
                        fontFamily: 'var(--m-heading)',
                        fontWeight: 800,
                        fontSize: 32,
                        letterSpacing: '-0.02em',
                        textAlign: 'center',
                        margin: '0 0 8px',
                    }}
                >
                    Welcome back
                </h1>
                <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--m-neutral-600)', margin: '0 0 28px' }}>
                    Enter your details to access your tasks.
                </p>

                {error && (
                    <div
                        style={{
                            border: '1px solid var(--m-accent)',
                            color: 'var(--m-accent)',
                            fontSize: 13,
                            padding: '10px 14px',
                            marginBottom: 20,
                        }}
                    >
                        {error}
                    </div>
                )}

                <div style={{ marginBottom: 18 }}>
                    <label className="m-label" htmlFor="m-login-email" style={{ marginBottom: 8 }}>Email address</label>
                    <input
                        id="m-login-email"
                        type="email"
                        className="m-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        autoComplete="email"
                    />
                </div>

                <div style={{ marginBottom: 24 }}>
                    <label className="m-label" htmlFor="m-login-password" style={{ marginBottom: 8 }}>Password</label>
                    <input
                        id="m-login-password"
                        type="password"
                        className="m-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        autoComplete="current-password"
                    />
                </div>

                <button
                    type="submit"
                    className="m-btn m-btn-primary m-btn-block"
                    style={{ justifyContent: 'center' }}
                    disabled={loading}
                >
                    {loading ? 'Signing in…' : 'Sign in'}
                </button>

                <div style={{ position: 'relative', textAlign: 'center', margin: '24px 0' }}>
                    <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'var(--m-divider)' }} />
                    <span style={{ position: 'relative', background: 'var(--m-bg)', padding: '0 12px', fontSize: 13, color: 'var(--m-neutral-600)' }}>
                        Or continue with
                    </span>
                </div>

                <GoogleAuthButton text="Sign in with Google" />

                <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--m-neutral-600)', margin: '28px 0 0' }}>
                    Don&apos;t have an account?{' '}
                    <Link href="/signup" style={{ color: 'var(--m-accent)', fontWeight: 800 }}>
                        Sign up
                    </Link>
                </p>
            </form>
        </div>
    );
}
