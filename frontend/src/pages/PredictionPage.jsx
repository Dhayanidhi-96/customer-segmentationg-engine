import { useState } from 'react';
import { segmentationAPI } from '../services/api';
import toast from 'react-hot-toast';

const FIELDS = [
    { key: 'recency_days', label: 'Recency (days)', hint: 'Days since last purchase', type: 'float', placeholder: '15.0' },
    { key: 'frequency', label: 'Frequency', hint: 'Number of purchases', type: 'int', placeholder: '12' },
    { key: 'monetary_value', label: 'Monetary Value ($)', hint: 'Total spend', type: 'float', placeholder: '2500.00' },
    { key: 'avg_order_value', label: 'Avg Order Value ($)', hint: 'Average per order', type: 'float', placeholder: '208.33' },
    { key: 'total_items_purchased', label: 'Items Purchased', hint: 'Total items bought', type: 'int', placeholder: '35' },
    { key: 'account_age_days', label: 'Account Age (days)', hint: 'Days since registration', type: 'int', placeholder: '730' },
    { key: 'email_open_rate', label: 'Email Open Rate', hint: '0.0 to 1.0', type: 'float', placeholder: '0.65' },
    { key: 'email_click_rate', label: 'Email Click Rate', hint: '0.0 to 1.0', type: 'float', placeholder: '0.22' },
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

        // Validate
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

    const handleReset = () => {
        setForm(INITIAL);
        setResult(null);
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
        <div className="prediction-page">
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Enter Customer Features</h3>
                    <button className="btn btn-secondary" onClick={handleFillSample} type="button">
                        Fill Sample Data
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        {FIELDS.map(f => (
                            <div className="form-group" key={f.key}>
                                <label className="form-label" htmlFor={f.key}>{f.label}</label>
                                <input
                                    id={f.key}
                                    className="form-input"
                                    type="number"
                                    step={f.type === 'float' ? '0.01' : '1'}
                                    placeholder={f.placeholder}
                                    value={form[f.key]}
                                    onChange={e => handleChange(f.key, e.target.value)}
                                    required
                                />
                                <span className="form-hint">{f.hint}</span>
                            </div>
                        ))}
                        <div className="form-actions">
                            <button className="btn btn-primary" type="submit" disabled={loading}>
                                {loading ? '⏳ Predicting...' : '🔮 Predict Segment'}
                            </button>
                            <button className="btn btn-secondary" type="button" onClick={handleReset}>
                                Reset
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {result && (
                <div className="prediction-result">
                    <div className="result-card success">
                        <span style={{ fontSize: 48 }}>🎯</span>
                        <div className="result-segment">{result.segment_name}</div>
                        <div className="result-confidence">
                            Confidence: <strong>{conf.toFixed(1)}%</strong>
                        </div>
                        <div className="result-bar">
                            <div className="result-bar-fill" style={{ width: `${conf}%` }}></div>
                        </div>
                        <p style={{ marginTop: 20, color: 'var(--text-secondary)', fontSize: 13 }}>
                            Segment ID: {result.segment_id} · The model is {conf.toFixed(1)}% confident in this classification.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
