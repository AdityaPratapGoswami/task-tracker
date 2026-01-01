'use client';

import { useState, useEffect } from 'react';
import { Target, Plus, Pencil, Trash2, CheckCircle2, Circle } from 'lucide-react';
import AddOKRModal from './AddOKRModal';
import { IOKR } from '@/types/okr';

interface OKRSectionProps {
    className?: string;
}

export default function OKRSection({ className }: OKRSectionProps) {
    const [okrs, setOkrs] = useState<IOKR[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [okrToEdit, setOkrToEdit] = useState<IOKR | null>(null);

    useEffect(() => {
        fetchOKRs();
    }, []);

    const fetchOKRs = async () => {
        try {
            const res = await fetch('/api/okrs');
            if (res.ok) {
                const data = await res.json();
                setOkrs(data);
            }
        } catch (error) {
            console.error('Failed to fetch OKRs', error);
        }
    };

    const handleSaveOKR = async (okrData: { objective: string; keyResults: { title: string; completed: boolean }[] }, id?: string) => {
        try {
            let res;
            if (id) {
                res = await fetch(`/api/okrs/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(okrData),
                });
            } else {
                res = await fetch('/api/okrs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(okrData),
                });
            }

            if (res.ok) {
                fetchOKRs();
                setOkrToEdit(null);
            }
        } catch (error) {
            console.error('Failed to save OKR', error);
        }
    };

    const handleDeleteOKR = async (id: string) => {
        try {
            const res = await fetch(`/api/okrs/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchOKRs();
            }
        } catch (error) {
            console.error('Failed to delete OKR', error);
        }
    };

    const toggleKeyResult = async (okr: IOKR, krIndex: number) => {
        const updatedKeyResults = [...okr.keyResults];
        updatedKeyResults[krIndex].completed = !updatedKeyResults[krIndex].completed;

        await handleSaveOKR({ objective: okr.objective, keyResults: updatedKeyResults }, okr._id);
    };

    return (
        <div className={className} style={{ marginBottom: '2rem' }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1rem',
                color: '#1e293b',
                fontWeight: 600,
                fontSize: '1.25rem'
            }}>
                <Target size={24} />
                OKRs (Objectives & Key Results)
            </div>

            <p style={{ marginBottom: '1.5rem', color: '#64748b' }}>
                Set ambitious objectives and track them with measurable key results.
            </p>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {okrs.map(okr => (
                    <div key={okr._id} style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '1rem',
                        border: '1px solid #e2e8f0'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                                {okr.objective}
                            </h3>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => {
                                        setOkrToEdit(okr);
                                        setIsModalOpen(true);
                                    }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6' }}
                                >
                                    <Pencil size={18} />
                                </button>
                                <button
                                    onClick={() => handleDeleteOKR(okr._id)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {okr.keyResults.map((kr, index) => (
                                <div key={index}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        cursor: 'pointer',
                                        color: kr.completed ? '#94a3b8' : '#334155',
                                        textDecoration: kr.completed ? 'line-through' : 'none'
                                    }}
                                    onClick={() => toggleKeyResult(okr, index)}
                                >
                                    {kr.completed ? (
                                        <CheckCircle2 size={16} color="#10b981" />
                                    ) : (
                                        <Circle size={16} color="#cbd5e1" />
                                    )}
                                    <span style={{ fontSize: '0.95rem' }}>{kr.title}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={() => {
                    setOkrToEdit(null);
                    setIsModalOpen(true);
                }}
                className="btn"
                style={{
                    marginTop: '1rem',
                    width: '100%',
                    backgroundColor: 'var(--color-primary, #3b82f6)',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer'
                }}
            >
                <Plus size={18} />
                Add OKR
            </button>

            <AddOKRModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setOkrToEdit(null);
                }}
                onSave={handleSaveOKR}
                okrToEdit={okrToEdit}
            />
        </div>
    );
}
