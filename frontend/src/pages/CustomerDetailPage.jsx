import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Radar } from 'react-chartjs-2';
import {
    Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip,
} from 'chart.js';
import { customerAPI } from '../services/api';
import toast from 'react-hot-toast';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip);

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#10b981'];

export default function CustomerDetailPage() {
    const { customerId } = useParams();
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        customerAPI.getById(customerId)
            .then(res => setCustomer(res.data))
            .catch(() => toast.error('Customer not found'))
            .finally(() => setLoading(false));
    }, [customerId]);

    if (loading) return <div className="loading-container"><div className="spinner"></div><p>Loading...</p></div>;
    if (!customer) return (
        <div className="empty-state">
            <h3>Customer Not Found</h3>
            <p>"{customerId}" doesn't exist.</p>
            <Link to="/customers" className="btn btn-primary">Back to Customers</Link>
        </div>
    );

    const color = COLORS[customer.segment_id || 0];
    const conf = (customer.segment_confidence || 0) * 100;

    const radarData = {
        labels: ['Recency', 'Frequency', 'Monetary', 'Avg Order', 'Items', 'Account Age'],
        datasets: [{
            label: customer.customer_id,
            data: [
                Math.min((customer.recency_days || 0) / 730 * 100, 100),
                Math.min((customer.frequency || 0) / 50 * 100, 100),
                Math.min((customer.monetary_value || 0) / 5000 * 100, 100),
                Math.min((customer.avg_order_value || 0) / 1000 * 100, 100),
                Math.min((customer.total_items_purchased || 0) / 100 * 100, 100),
                Math.min((customer.account_age_days || 0) / 1095 * 100, 100),
            ],
            backgroundColor: color + '25',
            borderColor: color,
            borderWidth: 2,
            pointBackgroundColor: color,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
        }],
    };

    const radarOpts = {
        responsive: true, maintainAspectRatio: false,
        scales: { r: { beginAtZero: true, max: 100, ticks: { display: false }, pointLabels: { font: { family: 'Inter', size: 12 } }, grid: { color: '#e2e8f0' } } },
        plugins: { legend: { display: false } },
    };

    const details = [
        ['Email', customer.email], ['Phone', customer.phone],
        ['Age', customer.age], ['Gender', customer.gender],
        ['City', customer.city], ['Country', customer.country],
    ];

    const metrics = [
        ['🕐', 'Recency (days)', (customer.recency_days || 0).toFixed(1)],
        ['🔄', 'Frequency', customer.frequency || 0],
        ['💰', 'Monetary Value', `$${(customer.monetary_value || 0).toFixed(2)}`],
        ['🛒', 'Avg Order Value', `$${(customer.avg_order_value || 0).toFixed(2)}`],
        ['📦', 'Items Purchased', customer.total_items_purchased || 0],
        ['📅', 'Account Age', `${customer.account_age_days || 0}d`],
        ['📧', 'Email Open Rate', `${((customer.email_open_rate || 0) * 100).toFixed(1)}%`],
        ['🖱️', 'Email Click Rate', `${((customer.email_click_rate || 0) * 100).toFixed(1)}%`],
    ];

    return (
        <div className="detail-page">
            <Link to="/customers" className="back-link">← Back to Customers</Link>

            <div className="detail-grid">
                {/* Profile Card */}
                <div className="card profile-card">
                    <div className="profile-header" style={{ borderBottomColor: color }}>
                        <div className="profile-avatar" style={{ backgroundColor: color + '20', color }}>
                            {(customer.name || '?')[0].toUpperCase()}
                        </div>
                        <div>
                            <h3 className="profile-name">{customer.name || 'Unknown'}</h3>
                            <p className="profile-id">{customer.customer_id}</p>
                        </div>
                    </div>
                    <div className="profile-details">
                        {details.map(([label, val]) => (
                            <div className="detail-row" key={label}>
                                <span className="detail-label">{label}</span>
                                <span className="detail-value">{val || '—'}</span>
                            </div>
                        ))}
                        <div className="detail-row">
                            <span className="detail-label">Status</span>
                            <span className={`status-badge ${customer.is_active ? 'active' : 'inactive'}`}>
                                {customer.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Segment Card */}
                <div className="card">
                    <h3 className="card-title">Segment Assignment</h3>
                    <div className="segment-display">
                        <div className="segment-badge-large" style={{ backgroundColor: color + '10', borderColor: color }}>
                            <span className="segment-icon">🎯</span>
                            <span className="segment-name" style={{ color }}>{customer.segment_name || 'Unassigned'}</span>
                        </div>
                        <div className="confidence-section">
                            <div className="confidence-header">
                                <span>Confidence Score</span>
                                <span className="confidence-value">{conf.toFixed(1)}%</span>
                            </div>
                            <div className="confidence-bar">
                                <div className="confidence-fill" style={{ width: `${conf}%`, backgroundColor: color }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RFM Metrics */}
                <div className="card" style={{ gridColumn: 'span 2' }}>
                    <h3 className="card-title">Customer Metrics</h3>
                    <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                        {metrics.map(([icon, label, val]) => (
                            <div className="metric-item" key={label}>
                                <span className="metric-icon">{icon}</span>
                                <span className="metric-value">{val}</span>
                                <span className="metric-label">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Radar Chart */}
                <div className="card radar-card" style={{ gridColumn: 'span 2' }}>
                    <h3 className="card-title">Feature Profile</h3>
                    <div className="chart-container" style={{ height: 300 }}>
                        <Radar data={radarData} options={radarOpts} />
                    </div>
                </div>
            </div>
        </div>
    );
}
