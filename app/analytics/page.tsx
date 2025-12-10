import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AnalyticsPage() {
    return (
        <main>
            <div style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 10 }}>
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
                        backgroundColor: 'rgba(255, 255, 255, 0.5)',
                        backdropFilter: 'blur(8px)',
                        color: 'var(--color-text-main)',
                        border: '1px solid rgba(255, 255, 255, 0.5)',
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
