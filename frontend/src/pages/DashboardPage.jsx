import { useState, useEffect } from 'react';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { 
    Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, 
    BarElement, PointElement, LineElement, Filler 
} from 'chart.js';
import { customerAPI, segmentationAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

ChartJS.register(
    ArcElement, Tooltip, Legend, CategoryScale, LinearScale, 
    BarElement, PointElement, LineElement, Filler
);
ChartJS.defaults.color = '#64748b'; // slate-500
ChartJS.defaults.font.family = 'Inter, sans-serif';

const COLORS = ['#f43f5e', '#8b5cf6', '#10b981', '#f59e0b', '#0ea5e9', '#d946ef'];

const compactNumber = (value) => {
    const num = Number(value || 0);
    return new Intl.NumberFormat('en-IN', {
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 1,
    }).format(num);
};

const compactCurrency = (value) => `$${compactNumber(value)}`;

export default function DashboardPage() {
    const [stats, setStats] = useState(null);
    const [profiles, setProfiles] = useState(null);
    const [recent, setRecent] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const [s, p, r] = await Promise.all([
                    customerAPI.getStats(),
                    segmentationAPI.getProfiles().catch(() => ({ data: null })),
                    customerAPI.getAll({ limit: 5 })
                ]);
                setStats(s.data);
                setProfiles(p?.data || null);
                setRecent(r.data.customers);
            } catch (err) {
                toast.error('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading) return <div className="py-32 text-center"><div className="spinner"></div><p className="mt-4 text-slate-500 font-medium">Initializing Ocean Engine...</p></div>;
    if (!stats) return <div className="py-32 text-center text-slate-500 font-medium">Failed to connect to backend.</div>;

    const hasProfiles = profiles && !profiles.message && Object.keys(profiles).length > 0;
    const segmentCount = hasProfiles ? Object.keys(profiles).length : 0;
    // Generate unique labels including ID to prevent duplicates like "Champions" appearing twice
    const labels = hasProfiles ? Object.keys(profiles).map(k => {
        const p = profiles[k];
        return p.segment_name ? `${p.segment_name} (S${p.segment_id})` : `Segment ${p.segment_id}`;
    }) : [];

    // Pie Data
    const pieData = hasProfiles ? {
        labels: labels,
        datasets: [{
            data: Object.keys(profiles).map(k => profiles[k].size),
            backgroundColor: Object.keys(profiles).map((_, i) => COLORS[i % COLORS.length] + 'ee'),
            borderColor: '#ffffff',
            borderWidth: 3,
        }]
    } : null;

    // Bar Data
    const barData = hasProfiles ? {
        labels: labels,
        datasets: [{
            label: 'Total Revenue ($)',
            data: Object.keys(profiles).map(k => profiles[k].total_revenue),
            backgroundColor: Object.keys(profiles).map((_, i) => COLORS[i % COLORS.length]),
            borderRadius: 6,
        }]
    } : null;

    // Mock Line Data for Trend
    const lineData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
            label: 'Acquired Customers',
            data: [120, 190, 300, 500, 800, 1200], // Mock exponential growth
            fill: true,
            borderColor: '#0284c7', // sky-600
            backgroundColor: 'rgba(2, 132, 199, 0.1)',
            tension: 0.4,
            pointRadius: 4,
        }]
    };

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { title: 'Total Customers', val: compactNumber(stats.total_customers), i: '👥', color: 'text-blue-600', bg: 'bg-blue-50' },
                    { title: 'Total Revenue', val: compactCurrency(stats.total_revenue), i: '💰', color: 'text-sky-600', bg: 'bg-sky-50' },
                    { title: 'Avg Monetary Value', val: compactCurrency(stats.avg_monetary_value), i: '🛍️', color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { title: 'Active Segments', val: segmentCount || 'None', i: '🎯', color: 'text-cyan-600', bg: 'bg-cyan-50' }
                ].map((k, idx) => (
                    <div key={idx} className="card card-hover flex items-center p-6 border-l-4" style={{borderLeftColor: '#0ea5e9'}}>
                        <div className={`p-4 rounded-xl ${k.bg} mr-4`}>
                            <span className="text-2xl">{k.i}</span>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{k.title}</p>
                            <h3 className={`text-2xl font-black ${k.color}`}>{k.val}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="card lg:col-span-1 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-6 text-center">Audience Breakdown</h3>
                    <div className="h-[250px] flex items-center justify-center">
                        {pieData ? <Pie data={pieData} options={{ maintainAspectRatio: false }} /> : <p className="text-slate-400 italic font-medium">No segmentation data.</p>}
                    </div>
                </div>

                <div className="card lg:col-span-2 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-6">Revenue Trajectory by Cohort</h3>
                    <div className="h-[250px] flex items-center justify-center">
                        {barData ? <Bar data={barData} options={{ maintainAspectRatio: false, scales: { x: { grid: { display: false } }, y: { border: { dash: [4, 4] } } } }} /> : <p className="text-slate-400 italic">No segmentation data.</p>}
                    </div>
                </div>
            </div>

            {/* Line Chart & Recent Customers Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="card lg:col-span-2 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Acquisition Velocity</h3>
                        <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2 py-1 rounded">Past 6 Months</span>
                    </div>
                    <div className="h-[250px]">
                        <Line data={lineData} options={{ maintainAspectRatio: false, scales: { x: { grid: { display: false } }, y: { beginAtZero: true, border: { dash: [4, 4] } } } }} />
                    </div>
                </div>

                <div className="card lg:col-span-1 shadow-sm p-0 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Newest Records</h3>
                        <Link to="/customers" className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors">View Directory →</Link>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <ul className="divide-y divide-slate-100">
                            {recent.map(c => (
                                <li key={c.customer_id} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{c.name}</p>
                                        <p className="text-xs font-medium text-slate-400">{c.email}</p>
                                    </div>
                                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 shadow-sm">${c.monetary_value.toFixed(0)}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
