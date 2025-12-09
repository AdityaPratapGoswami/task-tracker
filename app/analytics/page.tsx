import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AnalyticsPage() {
    return (
        <main className="container">
            <div style={{ marginBottom: '1rem' }}>
                <Link
                    href="/"
                    className="btn"
                    title="Back to Week View"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0.5rem',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        backgroundColor: 'var(--color-white)',
                        color: 'var(--color-text-main)',
                        border: '1px solid var(--color-grey-200)',
                        boxShadow: 'var(--shadow-sm)'
                    }}
                >
                    <ArrowLeft size={20} />
                </Link>
            </div>
            <AnalyticsDashboard />
        </main>
    );
}
