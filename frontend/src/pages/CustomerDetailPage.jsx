import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Radar } from 'react-chartjs-2';
import {
    Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip as ChartTooltip, Legend,
} from 'chart.js';
import { customerAPI, segmentationAPI } from '../services/api';
import toast from 'react-hot-toast';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, ChartTooltip, Legend);
ChartJS.defaults.color = '#64748b';
ChartJS.defaults.font.family = 'Inter, sans-serif';

const COLORS = ['#f43f5e', '#8b5cf6', '#10b981', '#f59e0b', '#0ea5e9', '#d946ef'];

export default function CustomerDetailPage() {
    const { customerId } = useParams();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState(null);
    const [explanation, setExplanation] = useState(null);
    const [emailData, setEmailData] = useState(null);
    const [emailLoading, setEmailLoading] = useState(false);
    const [loading, setLoading] = useState(true);

    const handleGenerateEmail = () => {
        setEmailLoading(true);
        segmentationAPI.generateEmail(customerId)
            .then(res => setEmailData(res.data))
            .catch(() => toast.error('Failed to generate email'))
            .finally(() => setEmailLoading(false));
    };

    useEffect(() => {
        Promise.all([
            customerAPI.getById(customerId),
            segmentationAPI.explain(customerId).catch(() => ({ data: null }))
        ])
            .then(([custRes, expRes]) => {
                setCustomer(custRes.data);
                setExplanation(expRes.data);
            })
            .catch(() => toast.error('Failed to load customer profile'))
            .finally(() => setLoading(false));
    }, [customerId]);

    if (loading) return <div className="py-32 text-center"><div className="spinner"></div><p className="text-slate-500 mt-4 font-bold tracking-wide">Loading Customer Profile...</p></div>;
    if (!customer) return <div className="py-20 text-center text-slate-500 font-bold border border-dashed border-slate-300 rounded-xl bg-slate-50/50">Customer not found.</div>;

    const segColor = COLORS[customer.segment_id || 0];

    // Radar Chart Data
    const rData = {
        labels: ['Recency (inv)', 'Frequency', 'Monetary', 'Avg Order', 'Account Age', 'Items'],
        datasets: [{
            label: customer.name || 'Profile',
            data: [
                100 - Math.min(customer.recency_days, 100),
                Math.min(customer.frequency, 100),
                Math.min(customer.monetary_value / 100, 100),
                Math.min(customer.avg_order_value / 10, 100),
                Math.min(customer.account_age_days / 10, 100),
                Math.min(customer.total_items_purchased, 100)
            ],
            backgroundColor: 'rgba(56, 189, 248, 0.2)',
            borderColor: '#0ea5e9',
            borderWidth: 2,
            pointBackgroundColor: '#0284c7',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#0ea5e9',
        }],
    };

    const rOpts = {
        scales: {
            r: {
                angleLines: { color: 'rgba(0,0,0,0.05)' },
                grid: { color: 'rgba(0,0,0,0.05)' },
                pointLabels: { color: '#64748b', font: { family: 'Inter', size: 12, weight: 'bold' } },
                ticks: { display: false },
            },
        },
        plugins: { legend: { display: false } },
    };

    return (
        <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
            <button className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors mb-2 group px-2 py-1 bg-blue-50 w-max rounded-lg shadow-sm" onClick={() => navigate('/customers')}>
                <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Directory
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Profile Detail Card */}
                <div className="card shadow-sm border-slate-200 row-span-2">
                    <div className="flex items-center gap-5 pb-6 mb-6 border-b border-slate-100">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-md bg-gradient-to-br from-sky-400 to-blue-600">
                            {customer.name ? customer.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">{customer.name || 'Unknown Profile'}</h2>
                            <p className="text-xs font-mono font-semibold text-slate-400 mt-1">{customer.customer_id}</p>
                        </div>
                    </div>

                    <div className="space-y-5">
                        {[
                            { label: 'Email Address', value: customer.email || '—' },
                            { label: 'Recency', value: `${customer.recency_days.toFixed(1)} days ago` },
                            { label: 'Frequency', value: `${customer.frequency} purchases` },
                            { label: 'Monetary Value', value: `$${customer.monetary_value.toFixed(2)}` },
                            { label: 'Avg Order Value', value: `$${customer.avg_order_value.toFixed(2)}` },
                            { label: 'Total Items', value: customer.total_items_purchased },
                            { label: 'Account Age', value: `${customer.account_age_days} days` },
                        ].map((d, i) => (
                            <div key={i} className="flex justify-between items-center group border-b border-transparent hover:border-slate-100 pb-1 cursor-default transition-colors">
                                <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">{d.label}</span>
                                <span className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{d.value}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                        <div className="inline-flex flex-col items-center justify-center p-6 border-2 border-slate-200 rounded-xl bg-slate-50 w-full hover:shadow-md transition-shadow">
                            <span className="text-4xl mb-3 drop-shadow-sm">🎯</span>
                            <span className="text-2xl font-black tracking-tight text-blue-700">{customer.segment_name ?? 'Unclassified'}</span>
                            <div className="w-full mt-5">
                                <div className="flex justify-between text-xs font-bold mb-2">
                                    <span className="text-slate-500 uppercase tracking-widest">Match Confidence</span>
                                    <span className="text-blue-600">{(customer.segment_confidence * 100).toFixed(1)}%</span>
                                </div>
                                <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden shadow-inner">
                                    <div className="h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-sky-400 to-blue-500"
                                         style={{ width: `${customer.segment_confidence * 100}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Radar Chart Card */}
                <div className="card shadow-sm border-slate-200">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Omnichannel Behavioral Profile</h3>
                    <div className="h-[280px] relative">
                        <Radar data={rData} options={rOpts} />
                    </div>
                </div>

                {/* SHAP Explanation Card */}
                <div className="card shadow-sm border-slate-200">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">AI Decision Explanation (SHAP)</h3>
                    <p className="text-xs font-bold text-slate-400 mb-6 border-b border-slate-100 pb-4">
                        How features mathematically pull the customer towards <strong className="text-blue-600 bg-blue-50 px-1 rounded">{customer.segment_name ?? 'their segment'}</strong>:
                    </p>
                    
                    {explanation && explanation.feature_explanations ? (
                        <div className="space-y-4">
                            {explanation.feature_explanations.map((feat, idx) => {
                                const isPos = feat.contribution >= 0;
                                const barWidth = Math.min(Math.abs(feat.contribution) * 100, 100);
                                return (
                                    <div key={idx} className="flex relative items-center text-xs h-6">
                                        <div className="w-[120px] font-bold text-slate-600 z-10">{feat.feature}</div>
                                        <div className="flex-1 relative flex items-center justify-center border-l-2 border-slate-200 h-full">
                                            {isPos ? (
                                                <div className="absolute left-[2px] h-3 bg-blue-500 rounded-sm shadow-sm transition-all" style={{ width: `${barWidth}%` }}></div>
                                            ) : (
                                                <div className="absolute right-[50%] mr-[-1px] h-3 bg-rose-500 rounded-sm shadow-sm transition-all" style={{ width: `${barWidth}%` }}></div>
                                            )}
                                        </div>
                                        <div className={`w-[50px] text-right font-mono font-black ${isPos ? 'text-blue-600' : 'text-rose-500'}`}>
                                            {isPos ? '+' : ''}{feat.contribution.toFixed(2)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm font-bold text-slate-400 italic text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">No SHAP analysis available for this model architecture.</p>
                    )}
                </div>

                {/* AI Email Generation Card */}
                <div className="card lg:col-span-2 shadow-md border-sky-200">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <div>
                            <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-sky-500 tracking-tight">Generative AI Marketing Engine</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase mt-1">LLaMA-3 Powered Personalization</p>
                        </div>
                        <button className="btn-primary shadow-md w-full md:w-auto" onClick={handleGenerateEmail} disabled={emailLoading}>
                            {emailLoading ? <span className="animate-pulse">⏳ Synthesizing...</span> : '✨ Generate Campaign'}
                        </button>
                    </div>
                    
                    {emailData && (
                        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-sky-400 to-blue-600"></div>
                            
                            {emailData.is_simulated && (
                                <div className="text-xs font-bold text-amber-600 flex items-center gap-2 mb-4 bg-amber-50 px-3 py-1.5 rounded-md border border-amber-200 inline-flex shadow-sm">
                                    <span className="animate-pulse">⚠️</span> Using Smart Simulated AI (Add GROQ_API_KEY to .env for real LLaMA-3 generation)
                                </div>
                            )}
                            
                            <div className="mb-4 pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-2">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">Subject</span>
                                <span className="text-lg font-black text-slate-800 tracking-tight">{emailData.subject}</span>
                            </div>
                            
                            <div className="whitespace-pre-wrap text-sm text-slate-600 leading-relaxed font-medium">
                                {emailData.body}
                            </div>
                        </div>
                    )}
                    
                    {!emailData && !emailLoading && (
                        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                            <span className="text-4xl opacity-50 block mb-3 grayscale">✉️</span>
                            <p className="text-sm font-bold text-slate-500">Click generate to dynamically write a personalized marketing email based on<br/>this customer's ML segment and RFM metrics.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
