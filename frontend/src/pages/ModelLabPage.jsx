import { useState, useEffect } from 'react';
import { segmentationAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Bar } from 'react-chartjs-2';

export default function ModelLabPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        segmentationAPI.compareModels()
            .then(res => setData(res.data))
            .catch(() => toast.error('Failed to run model comparison'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="py-32 flex flex-col items-center justify-center">
            <div className="spinner mb-6"></div>
            <p className="text-blue-600 font-bold font-mono text-sm animate-pulse">Running live benchmark suite...</p>
            <p className="text-slate-500 text-xs mt-2 font-medium">Training KMeans, DBSCAN, and GMM models dynamically.</p>
        </div>
    );

    if (!data || !data.models) return <div className="text-center py-20 text-slate-500 font-medium border border-dashed border-slate-300 rounded-xl bg-slate-50/50">No data available.</div>;

    const labels = data.models.map(m => m.model_name);
    const silData = data.models.map(m => m.silhouette_score);
    const dbData = data.models.map(m => m.davies_bouldin);
    
    const chartBgColors = ['rgba(14, 165, 233, 0.8)', 'rgba(59, 130, 246, 0.8)', 'rgba(99, 102, 241, 0.8)'];
    const chartBorderColors = ['#0ea5e9', '#3b82f6', '#6366f1'];

    const chartStyle = {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            y: { grid: { color: 'rgba(0,0,0,0.05)' }, border: { dash: [4, 4] } },
            x: { grid: { display: false } },
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-sky-50 to-blue-100 border border-sky-200 rounded-xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/40 rounded-full blur-3xl pointer-events-none"></div>
                <h3 className="text-2xl font-black text-blue-900 tracking-tight mb-2">Live Model Comparison Lab Component</h3>
                <p className="text-sm font-medium text-blue-800/80">
                    Auto-ML Engine spun up and benchmarked against <strong className="text-blue-700">{data.sample_size.toLocaleString()}</strong> live telemetry rows in parallel.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card shadow-sm border-slate-200">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Silhouette Score Graph<br/><span className="text-sky-600 font-medium text-xs normal-case tracking-normal">Optimal bounds: Higher is better</span></h3>
                    <div className="h-[280px] w-full">
                        <Bar 
                            data={{
                                labels,
                                datasets: [{
                                    data: silData,
                                    backgroundColor: chartBgColors,
                                    borderColor: chartBorderColors,
                                    borderWidth: 1,
                                    borderRadius: 6
                                }]
                            }} 
                            options={chartStyle} 
                        />
                    </div>
                </div>
                
                <div className="card shadow-sm border-slate-200">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Davies-Bouldin Index<br/><span className="text-blue-600 font-medium text-xs normal-case tracking-normal">Optimal bounds: Lower is better</span></h3>
                    <div className="h-[280px] w-full">
                        <Bar 
                            data={{
                                labels,
                                datasets: [{
                                    data: dbData,
                                    backgroundColor: chartBgColors,
                                    borderColor: chartBorderColors,
                                    borderWidth: 1,
                                    borderRadius: 6
                                }]
                            }} 
                            options={chartStyle} 
                        />
                    </div>
                </div>
            </div>

            <div className="card p-0 overflow-hidden border-slate-200 shadow-sm">
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-lg font-bold text-slate-800">Execution Metrics Trace</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr>
                                <th className="table-header">Algorithm Engine</th>
                                <th className="table-header">Clusters Derived</th>
                                <th className="table-header">Silhouette</th>
                                <th className="table-header">Davies-Bouldin</th>
                                <th className="table-header">Calinski-Harabasz</th>
                                <th className="table-header text-right">Compute Cost (ms)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {data.models.map((m, i) => (
                                <tr key={m.model_name} className="hover:bg-slate-50 transition-colors">
                                    <td className="table-cell font-bold text-slate-700 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full shadow-sm" style={{ background: chartBorderColors[i % 3] }}></div>
                                        {m.model_name}
                                    </td>
                                    <td className="table-cell font-mono text-slate-500">{m.n_clusters > 0 ? m.n_clusters : 'Noise'}</td>
                                    <td className="table-cell text-sky-600 font-bold">{m.silhouette_score.toFixed(4)}</td>
                                    <td className="table-cell text-blue-600 font-bold">{m.davies_bouldin.toFixed(4)}</td>
                                    <td className="table-cell text-indigo-500 font-bold">{m.calinski_harabasz.toFixed(1)}</td>
                                    <td className="table-cell text-right font-mono text-slate-400">{m.training_time_ms.toFixed(1)}ms</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
