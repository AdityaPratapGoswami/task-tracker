import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AnalyticsPage() {
    return (
        <main className="container">
            <div style={{ marginBottom: '1rem' }}>
                <Link href="/" className="btn btn-icon" style={{ width: 'fit-content', paddingRight: '1rem' }}>
                    <ArrowLeft size={18} style={{ marginRight: '0.5rem' }} />
                    Back to Tracker
                </Link>
            </div>
            <AnalyticsDashboard />
        </main>
    );
}
