'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import styles from '../auth.module.css';
import Logo from '@/components/Logo';
import GoogleAuthButton from '@/components/GoogleAuthButton';

export default function SignupPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { signup } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await signup({ name, email, password });
        } catch (err: any) {
            setError(err.message);
        }
    };
    return (
        <div className={styles.container}>
            <div className={styles.authCard}>
                <div className={styles.header}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                        <Logo size="large" showText={false} />
                    </div>
                    <h1 className={styles.title}>Create Account</h1>
                    <p className={styles.subtitle}>Start organizing your life today.</p>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={styles.input}
                            placeholder="John Doe"
                            required
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={styles.input}
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={styles.input}
                            placeholder="Create a strong password"
                            required
                        />
                    </div>
                    <button type="submit" className={styles.submitBtn}>
                        Sign Up
                    </button>
                </form>

                <div className={styles.separator} style={{ margin: '1.5rem 0', textAlign: 'center', position: 'relative' }}>
                    <span style={{ backgroundColor: '#fff', padding: '0 10px', color: '#666', fontSize: '0.875rem', position: 'relative', zIndex: 1 }}>Or continue with</span>
                    <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', backgroundColor: '#eee', zIndex: 0 }}></div>
                </div>

                <GoogleAuthButton text="Sign up with Google" />

                <p className={styles.footer}>
                    Already have an account?{' '}
                    <Link href="/login" className={styles.link}>
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
}
