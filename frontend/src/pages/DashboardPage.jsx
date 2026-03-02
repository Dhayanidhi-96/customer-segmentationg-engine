import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Pie, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS, ArcElement, CategoryScale, LinearScale,
    BarElement, Tooltip, Legend,
} from 'chart.js';
import { customerAPI, segmentationAPI } from '../services/api';
import toast from 'react-hot-toast';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#ec4899', '#14b8a6'];

export default function DashboardPage() {
    const [stats, setStats] = useState(null);
    const [profiles, setProfiles] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [modelInfo, setModelInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const [s, p, c, m] = await Promise.all([
                    customerAPI.getStats(),
                    segmentationAPI.getProfiles(),
                    customerAPI.getAll({ limit: 10 }),
                    segmentationAPI.getModelInfo(),
                ]);
                setStats(s.data);
                setProfiles(p.data);
                setCustomers(c.data.customers);
                setModelInfo(m.data);
            } catch (err) {
                toast.error('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    const keys = profiles ? Object.keys(profiles) : [];
    const labels = keys.map(k => `Segment ${profiles[k].segment_id}`);
    const sizes = keys.map(k => profiles[k].size);
    const revenues = keys.map(k => profiles[k].total_revenue);

    const pieData = {
        labels,
        datasets: [{
            data: sizes,
            backgroundColor: COLORS.slice(0, labels.length),
            borderWidth: 2, borderColor: '#fff', hoverOffset: 8,
        }],
    };

    const barData = {
        labels,
        datasets: [{
            label: 'Total Revenue ($)',
            data: revenues,
            backgroundColor: COLORS.slice(0, labels.length).map(c => c + 'cc'),
            borderColor: COLORS.slice(0, labels.length),
            borderWidth: 2, borderRadius: 8,
        }],
    };

    const chartOpts = {
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { padding: 16, usePointStyle: true, font: { family: 'Inter', size: 12 } },
            },
        },
    };

    const barOpts = {
        ...chartOpts,
        scales: {
            y: {
                beginAtZero: true,
                ticks: { callback: v => `$${(v / 1000).toFixed(0)}k`, font: { family: 'Inter' } },
                grid: { color: '#f1f5f9' },
            },
            x: { ticks: { font: { family: 'Inter' } }, grid: { display: false } },
        },
    };

    return (
        <div className="dashboard-page">
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>👥</div>
                    <div className="stat-info">
                        <span className="stat-value">{stats?.total_customers?.toLocaleString() || 0}</span>
                        <span className="stat-label">Total Customers</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>💰</div>
                    <div className="stat-info">
                        <span className="stat-value">${((stats?.total_revenue || 0) / 1e6).toFixed(2)}M</span>
                        <span className="stat-label">Total Revenue</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>📈</div>
                    <div className="stat-info">
                        <span className="stat-value">${(stats?.avg_monetary_value || 0).toFixed(0)}</span>
                        <span className="stat-label">Avg Monetary Value</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)' }}>🎯</div>
                    <div className="stat-info">
                        <span className="stat-value">{modelInfo?.n_clusters || 0}</span>
                        <span className="stat-label">Active Segments</span>
                    </div>
                </div>
            </div>

            <div className="charts-grid">
                <div className="chart-card">
                    <h3 className="card-title">Segment Distribution</h3>
                    <div className="chart-container">
                        {keys.length > 0 ? <Pie data={pieData} options={chartOpts} /> : <p>No data</p>}
                    </div>
                </div>
                <div className="chart-card">
                    <h3 className="card-title">Revenue by Segment</h3>
                    <div className="chart-container">
                        {keys.length > 0 ? <Bar data={barData} options={barOpts} /> : <p>No data</p>}
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Recent Customers</h3>
                    <Link to="/customers" className="card-link">View All →</Link>
                </div>
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Customer ID</th><th>Name</th><th>Email</th>
                                <th>Segment</th><th>Monetary Value</th><th>Confidence</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.map(c => (
                                <tr key={c.customer_id}>
                                    <td><Link to={`/customers/${c.customer_id}`} className="table-link">{c.customer_id}</Link></td>
                                    <td className="font-medium">{c.name || '—'}</td>
                                    <td className="text-secondary">{c.email || '—'}</td>
                                    <td>
                                        <span className="segment-badge" style={{
                                            backgroundColor: COLORS[c.segment_id || 0] + '20',
                                            color: COLORS[c.segment_id || 0],
                                            borderColor: COLORS[c.segment_id || 0] + '40',
                                        }}>
                                            {c.segment_name || 'Unassigned'}
                                        </span>
                                    </td>
                                    <td>${(c.monetary_value || 0).toFixed(2)}</td>
                                    <td>
                                        <div className="confidence-bar-small">
                                            <div className="confidence-bar-wrap">
                                                <div className="fill" style={{
                                                    width: `${(c.segment_confidence || 0) * 100}%`,
                                                    backgroundColor: COLORS[c.segment_id || 0],
                                                }}></div>
                                            </div>
                                            <span>{((c.segment_confidence || 0) * 100).toFixed(0)}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
