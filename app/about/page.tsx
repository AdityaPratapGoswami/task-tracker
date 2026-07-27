import Link from 'next/link';
import Logo from '@/components/modernist/Logo';

export const metadata = {
    title: 'Balance — Personal task tracker',
    description: 'Balance is a personal task tracker for weekly pillars, daily tasks, objectives and key results.',
};

export default function AboutPage() {
    return (
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '64px 24px 96px' }}>
            <div style={{ marginBottom: 32 }}>
                <Logo size={56} />
            </div>

            <div className="m-kicker" style={{ marginBottom: 10 }}>Personal task tracker</div>
            <h1 className="m-title" style={{ fontSize: 40, marginBottom: 24 }}>Balance</h1>

            <p style={{ fontSize: 18, marginBottom: 32, lineHeight: 1.6 }}>
                Balance helps you organise your week around the things that actually matter to you.
                You define your own pillars — the areas of life you want to stay consistent in — and
                track daily tasks, objectives and key results, and one-off spontaneous tasks against
                them.
            </p>

            <section style={{ marginBottom: 32 }}>
                <h2 className="m-h2" style={{ marginBottom: 12 }}>What you can do</h2>
                <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
                    <li>Track recurring tasks across a weekly grid, organised by your own categories.</li>
                    <li>Log one-off spontaneous tasks for the day, tagged by urgency and importance.</li>
                    <li>Set quarterly objectives and key results, and track progress toward them.</li>
                    <li>See completion streaks and analytics on how consistent you&apos;ve been.</li>
                </ul>
            </section>

            <section style={{ marginBottom: 40 }}>
                <h2 className="m-h2" style={{ marginBottom: 12 }}>Getting started</h2>
                <p style={{ marginBottom: 20 }}>
                    Sign in to start tracking your own pillars, or read how your data is handled in the{' '}
                    <Link href="/privacy" style={{ color: 'var(--m-accent)' }}>privacy policy</Link>.
                </p>
                <Link href="/login" className="m-btn m-btn-primary" style={{ display: 'inline-flex' }}>
                    Sign in
                </Link>
            </section>
        </div>
    );
}
