import { useState } from 'react';
import { segmentationAPI } from '../services/api';
import toast from 'react-hot-toast';

const ObjectFieldInput = ({ icon, f, form, handleChange }) => (
    <div className="flex flex-col gap-1.5 group">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2" htmlFor={f.key}>
            <span>{icon}</span> {f.label}
        </label>
        <div className="relative">
            <input
                id={f.key}
                className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm"
                type="number"
                step={f.type === 'float' ? '0.01' : '1'}
                placeholder={f.placeholder}
                value={form[f.key]}
                onChange={e => handleChange(f.key, e.target.value)}
                required
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                {f.hint}
            </span>
        </div>
    </div>
);

const FIELDS = [
    { key: 'recency_days', label: 'Recency (days)', hint: 'Days since purchase', type: 'float', placeholder: '15.0', icon: '⏱️' },
    { key: 'frequency', label: 'Frequency', hint: 'Num purchases', type: 'int', placeholder: '12', icon: '🔁' },
    { key: 'monetary_value', label: 'Monetary ($)', hint: 'Total spend', type: 'float', placeholder: '2500.00', icon: '💵' },
    { key: 'avg_order_value', label: 'Avg Order ($)', hint: 'Average per order', type: 'float', placeholder: '208.33', icon: '🛍️' },
    { key: 'total_items_purchased', label: 'Items Bought', hint: 'Total units', type: 'int', placeholder: '35', icon: '📦' },
    { key: 'account_age_days', label: 'Account Age', hint: 'Days registered', type: 'int', placeholder: '730', icon: '📅' },
    { key: 'email_open_rate', label: 'Open Rate', hint: '0.0 to 1.0', type: 'float', placeholder: '0.65', icon: '📧' },
    { key: 'email_click_rate', label: 'Click Rate', hint: '0.0 to 1.0', type: 'float', placeholder: '0.22', icon: '🖱️' },
];

const INITIAL = Object.fromEntries(FIELDS.map(f => [f.key, '']));

export default function PredictionPage() {
    const [form, setForm] = useState(INITIAL);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setResult(null);

        for (const f of FIELDS) {
            if (form[f.key] === '' || isNaN(Number(form[f.key]))) {
                toast.error(`Please enter a valid number for ${f.label}`);
                return;
            }
        }

        const payload = {};
        for (const f of FIELDS) {
            payload[f.key] = f.type === 'int' ? parseInt(form[f.key]) : parseFloat(form[f.key]);
        }

        setLoading(true);
        try {
            const res = await segmentationAPI.predict(payload);
            setResult(res.data);
            toast.success('Prediction successful!');
        } catch (err) {
            toast.error('Prediction failed: ' + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleFillSample = () => {
        setForm({
            recency_days: '15.0', frequency: '12', monetary_value: '2500.00',
            avg_order_value: '208.33', total_items_purchased: '35', account_age_days: '730',
            email_open_rate: '0.65', email_click_rate: '0.22',
        });
        setResult(null);
    };

    const conf = result ? (result.confidence * 100) : 0;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="card border-slate-200 p-8 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 pb-6 border-b border-slate-100">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">AI Prediction Engine</h3>
                        <p className="text-xs text-slate-500 mt-1 font-medium">Input raw telemetry to forecast target segment</p>
                    </div>
                    <button className="btn-secondary text-xs w-full md:w-auto p-2" onClick={handleFillSample} type="button">
                        <span className="text-blue-500">⚡</span> Inject Mock Data
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {FIELDS.map(f => <ObjectFieldInput key={f.key} f={f} form={form} handleChange={handleChange} icon={f.icon} />)}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-100">
                        <button className="btn-primary w-full sm:w-2/3 py-3 shadow-md" type="submit" disabled={loading}>
                            {loading ? <span className="animate-pulse">🔮 Analyzing tensor...</span> : '🔮 Generate Prediction'}
                        </button>
                        <button className="btn-secondary w-full sm:w-1/3 py-3 shadow-sm" type="button" onClick={() => { setForm(INITIAL); setResult(null); }}>
                            Reset Form
                        </button>
                    </div>
                </form>
            </div>

            {result && (
                <div className="animate-[slideIn_0.4s_ease-out]">
                    <div className="bg-gradient-to-br from-sky-50 to-white border border-sky-100 rounded-2xl p-8 text-center shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-100 rounded-full blur-3xl opacity-50"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
                        
                        <span className="text-6xl block mb-4 drop-shadow-sm">🎯</span>
                        <h4 className="text-xs font-bold text-sky-600 uppercase tracking-widest mb-2">Algorithm Match Identified</h4>
                        <div className="text-4xl font-black text-blue-900 tracking-tight drop-shadow-sm">{result.segment_name || `Segment ${result.segment_id}`}</div>
                        
                        <div className="max-w-md mx-auto mt-8 bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative z-10">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Confidence Score</span>
                                <span className="text-2xl font-black text-sky-500">{conf.toFixed(1)}%</span>
                            </div>
                            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                <div className="h-full bg-gradient-to-r from-blue-400 to-sky-400 rounded-full transition-all duration-1000 ease-out" 
                                     style={{ width: `${conf}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
