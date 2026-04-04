import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend,
} from 'chart.js';
import { segmentationAPI } from '../services/api';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);
ChartJS.defaults.color = '#64748b'; // slate-500
ChartJS.defaults.font.family = 'Inter, sans-serif';

const COLORS = ['#f43f5e', '#8b5cf6', '#10b981', '#f59e0b', '#0ea5e9', '#d946ef'];

export default function SegmentsPage() {
    const [profiles, setProfiles] = useState(null);
    const [modelInfo, setModelInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [retraining, setRetraining] = useState(false);

    const handleRetrain = async () => {
        setRetraining(true);
        const loadingToast = toast.loading('Initializing Live AutoML pipeline...');
        try {
            const res = await segmentationAPI.retrain();
            toast.success(`Success! Silhouette Score: ${res.data.optimization_metrics.silhouette_score} (${res.data.optimization_metrics.n_clusters_chosen} clusters deployed)`, { id: loadingToast, duration: 5000 });
            
            // Reload dashboard data
            const [p, m] = await Promise.all([
                segmentationAPI.getProfiles(),
                segmentationAPI.getModelInfo(),
            ]);
            setProfiles(p.data);
            setModelInfo(m.data);
        } catch (err) {
            toast.error(err.response?.data?.detail || 'AutoML Retraining failed.', { id: loadingToast });
        } finally {
            setRetraining(false);
        }
    };

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

    if (loading) return <div className="py-32 text-center"><div className="spinner"></div><p className="mt-4 text-slate-500 font-medium">Aggregating cluster data...</p></div>;

    const hasProfiles = profiles && !profiles.message && Object.keys(profiles).length > 0;
    const keys = hasProfiles ? Object.keys(profiles) : [];
    const labels = hasProfiles ? keys.map(k => profiles[k].segment_name || `Segment ${profiles[k].segment_id}`) : [];

    const comparisonData = hasProfiles ? {
        labels,
        datasets: [
            {
                label: 'Avg Recency (days)',
                data: keys.map(k => profiles[k].avg_recency),
                backgroundColor: 'rgba(56, 189, 248, 0.8)', borderColor: '#0ea5e9', borderWidth: 1, borderRadius: 4,
            },
            {
                label: 'Avg Frequency',
                data: keys.map(k => profiles[k].avg_frequency),
                backgroundColor: 'rgba(59, 130, 246, 0.8)', borderColor: '#2563eb', borderWidth: 1, borderRadius: 4,
            },
            {
                label: 'Avg Monetary ($100s)',
                data: keys.map(k => profiles[k].avg_monetary / 100),
                backgroundColor: 'rgba(14, 165, 233, 0.8)', borderColor: '#0284c7', borderWidth: 1, borderRadius: 4,
            },
        ],
    } : null;

    const chartOpts = {
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top', labels: { usePointStyle: true, font: { family: 'Inter', size: 12 }, padding: 16 } },
        },
        scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, border: { dash: [4, 4] } },
            x: { grid: { display: false } },
        },
    };

    return (
        <div className="space-y-6">
            {/* Model Info */}
            {modelInfo && (
                <div className="card relative overflow-hidden ring-1 ring-slate-200">
                    <div className="flex justify-between items-center mb-6 relative z-10">
                        <h3 className="text-lg font-black text-slate-800">Production Algorithm Configuration</h3>
                        <button 
                            onClick={handleRetrain} 
                            disabled={retraining}
                            className={`flex items-center gap-2 text-sm px-5 py-2.5 rounded-lg font-bold text-white shadow-md transition-all ${retraining ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:shadow-lg hover:-translate-y-[1px]'}`}
                        >
                            {retraining ? (
                                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Re-calibrating...</>
                            ) : (
                                <><span>⚙️</span> Trigger Live AutoML Retraining</>
                            )}
                        </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center hover:shadow-md transition-shadow">
                            <span className="text-2xl block mb-2">🤖</span>
                            <span className="text-lg font-black text-blue-600 block">{modelInfo.model_name}</span>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Algorithm</span>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center hover:shadow-md transition-shadow">
                            <span className="text-2xl block mb-2">🎯</span>
                            <span className="text-lg font-black text-sky-600 block">{modelInfo.n_clusters}</span>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Clusters Deployments</span>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center hover:shadow-md transition-shadow">
                            <span className="text-2xl block mb-2">📊</span>
                            <span className="text-lg font-black text-indigo-600 block">{modelInfo.features?.length || 0}</span>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Features Tracked</span>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center hover:shadow-md transition-shadow">
                            <span className="text-2xl block mb-2">{modelInfo.is_trained ? '✅' : '❌'}</span>
                            <span className={`text-lg font-black block ${modelInfo.is_trained ? 'text-emerald-500' : 'text-rose-500'}`}>{modelInfo.is_trained ? 'Active Inference' : 'Offline'}</span>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global Status</span>
                        </div>
                    </div>
                </div>
            )}

            {!hasProfiles ? (
                 <div className="py-20 flex flex-col items-center justify-center text-center text-slate-500 font-bold border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <span className="text-4xl mb-4 opacity-50">🧭</span>
                    <p className="text-lg text-slate-600">No Segments Analyzed</p>
                    <p className="text-sm font-medium mt-2 max-w-md">The loaded database contains fresh unclassified telemetry. Click "Trigger Live AutoML Retraining" to dynamically assign segments.</p>
                 </div>
            ) : (
                <>
                    {/* Profiles Compare */}
                    <div className="card shadow-sm">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Global Segment Distribution</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {keys.map((k, i) => {
                                const p = profiles[k];
                                const color = COLORS[i % COLORS.length];
                                return (
                                    <div key={k} className="bg-white rounded-xl p-5 border border-slate-200 hover:shadow-lg transition-all duration-300 relative group overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: color }}></div>
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="font-extrabold text-lg text-slate-800 tracking-tight" style={{ color }}>{p.segment_name || `Segment ${p.segment_id}`}</h4>
                                                <p className="text-xs font-bold text-slate-400 uppercase">{p.size.toLocaleString()} customers ({p.percentage}%)</p>
                                            </div>
                                            <div className="px-2 py-1 bg-slate-50 text-slate-500 rounded text-xs font-bold ring-1 ring-inset ring-slate-200">
                                                ID: {p.segment_id}
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500 font-medium">Avg Recency</span>
                                                <span className="font-bold text-slate-700">{p.avg_recency.toFixed(0)} days</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500 font-medium">Avg Frequency</span>
                                                <span className="font-bold text-slate-700">{p.avg_frequency.toFixed(1)} orders</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500 font-medium">Avg Value</span>
                                                <span className="font-bold text-slate-700">${p.avg_monetary.toFixed(0)}</span>
                                            </div>
                                            <div className="pt-3 mt-3 border-t border-slate-100 flex justify-between items-center group-hover:bg-slate-50 -mx-5 px-5 -mb-5 pb-5 transition-colors">
                                                <span className="text-xs font-bold text-slate-400 uppercase">Gross Revenue</span>
                                                <span className="font-black text-blue-600">${p.total_revenue.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Radar/Bar Chart */}
                    <div className="card shadow-sm">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Comparative Feature Analysis</h3>
                        <div className="h-[400px]">
                            <Bar data={comparisonData} options={chartOpts} />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
