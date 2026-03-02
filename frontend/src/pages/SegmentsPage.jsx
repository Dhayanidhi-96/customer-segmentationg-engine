import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend,
} from 'chart.js';
import { segmentationAPI } from '../services/api';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#ec4899', '#14b8a6'];

export default function SegmentsPage() {
    const [profiles, setProfiles] = useState(null);
    const [modelInfo, setModelInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const [p, m] = await Promise.all([
                    segmentationAPI.getProfiles(),
                    segmentationAPI.getModelInfo(),
                ]);
                setProfiles(p.data);
                setModelInfo(m.data);
            } catch {
                toast.error('Failed to load segment data');
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading) return <div className="loading-container"><div className="spinner"></div><p>Loading segments...</p></div>;
    if (!profiles) return <div className="empty-state"><h3>No Segments</h3><p>Run batch prediction to create segments.</p></div>;

    const keys = Object.keys(profiles);
    const labels = keys.map(k => `Segment ${profiles[k].segment_id}`);

    const comparisonData = {
        labels,
        datasets: [
            {
                label: 'Avg Recency (days)',
                data: keys.map(k => profiles[k].avg_recency),
                backgroundColor: '#6366f1cc', borderColor: '#6366f1', borderWidth: 2, borderRadius: 6,
            },
            {
                label: 'Avg Frequency',
                data: keys.map(k => profiles[k].avg_frequency),
                backgroundColor: '#06b6d4cc', borderColor: '#06b6d4', borderWidth: 2, borderRadius: 6,
            },
            {
                label: 'Avg Monetary ($)',
                data: keys.map(k => profiles[k].avg_monetary),
                backgroundColor: '#10b981cc', borderColor: '#10b981', borderWidth: 2, borderRadius: 6,
            },
        ],
    };

    const chartOpts = {
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top', labels: { usePointStyle: true, font: { family: 'Inter', size: 12 }, padding: 16 } },
        },
        scales: {
            y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { family: 'Inter' } } },
            x: { grid: { display: false }, ticks: { font: { family: 'Inter' } } },
        },
    };

    return (
        <div className="segments-page">
            {/* Model Info */}
            {modelInfo && (
                <div className="card" style={{ marginBottom: 24 }}>
                    <h3 className="card-title">Model Information</h3>
                    <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                        <div className="metric-item">
                            <span className="metric-icon">🤖</span>
                            <span className="metric-value">{modelInfo.model_name}</span>
                            <span className="metric-label">Algorithm</span>
                        </div>
                        <div className="metric-item">
                            <span className="metric-icon">🎯</span>
                            <span className="metric-value">{modelInfo.n_clusters}</span>
                            <span className="metric-label">Clusters</span>
                        </div>
                        <div className="metric-item">
                            <span className="metric-icon">📊</span>
                            <span className="metric-value">{modelInfo.features?.length || 0}</span>
                            <span className="metric-label">Features</span>
                        </div>
                        <div className="metric-item">
                            <span className="metric-icon">✅</span>
                            <span className="metric-value">{modelInfo.is_trained ? 'Yes' : 'No'}</span>
                            <span className="metric-label">Trained</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Segment Cards */}
            <div className="segment-cards">
                {keys.map((k, i) => {
                    const p = profiles[k];
                    const color = COLORS[i % COLORS.length];
                    return (
                        <div className="segment-stat-card" key={k} style={{ animationDelay: `${i * 0.05}s` }}>
                            <div className="accent-bar" style={{ backgroundColor: color }}></div>
                            <h4 style={{ color }}>Segment {p.segment_id}</h4>
                            <p className="seg-count">{p.size.toLocaleString()} customers ({p.percentage}%)</p>
                            <div className="seg-metrics">
                                <div className="seg-metric">
                                    <span className="seg-metric-label">Avg Recency</span>
                                    <span className="seg-metric-value">{p.avg_recency.toFixed(1)}d</span>
                                </div>
                                <div className="seg-metric">
                                    <span className="seg-metric-label">Avg Frequency</span>
                                    <span className="seg-metric-value">{p.avg_frequency.toFixed(1)}</span>
                                </div>
                                <div className="seg-metric">
                                    <span className="seg-metric-label">Avg Monetary</span>
                                    <span className="seg-metric-value">${p.avg_monetary.toFixed(0)}</span>
                                </div>
                                <div className="seg-metric">
                                    <span className="seg-metric-label">Total Revenue</span>
                                    <span className="seg-metric-value">${(p.total_revenue / 1000).toFixed(0)}k</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Comparison Chart */}
            <div className="chart-card">
                <h3 className="card-title">Segment Comparison — RFM Metrics</h3>
                <div className="chart-container" style={{ height: 350 }}>
                    <Bar data={comparisonData} options={chartOpts} />
                </div>
            </div>
        </div>
    );
}
