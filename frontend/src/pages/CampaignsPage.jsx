import { useState } from 'react';
import { segmentationAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function CampaignsPage() {
    const [form, setForm] = useState({
        segment_name: 'Champions',
        discount_percent: 15,
        discount_code: 'VIP15',
        campaign_id: '',
        limit: 250,
        dry_run: true,
        force_resend: false,
    });
    const [result, setResult] = useState(null);
    const [statusFilter, setStatusFilter] = useState({ campaign_id: '', email: '' });
    const [status, setStatus] = useState(null);
    const [loadingSend, setLoadingSend] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState(false);

    const onChange = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const sendCampaign = async (e) => {
        e.preventDefault();
        setLoadingSend(true);
        try {
            const payload = {
                ...form,
                discount_percent: Number(form.discount_percent),
                limit: form.limit ? Number(form.limit) : null,
                campaign_id: form.campaign_id || null,
                segment_name: form.segment_name || null,
                discount_code: form.discount_code || null,
            };
            const res = await segmentationAPI.sendDiscountCampaign(payload);
            setResult(res.data);
            setStatusFilter((prev) => ({ ...prev, campaign_id: res.data.campaign_id }));
            toast.success('Campaign processed successfully');
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Campaign send failed');
        } finally {
            setLoadingSend(false);
        }
    };

    const fetchStatus = async () => {
        setLoadingStatus(true);
        try {
            const params = {};
            if (statusFilter.campaign_id) params.campaign_id = statusFilter.campaign_id;
            if (statusFilter.email) params.email = statusFilter.email;
            const res = await segmentationAPI.getCampaignStatus(params);
            setStatus(res.data);
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to fetch status');
        } finally {
            setLoadingStatus(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="hero-panel">
                <p className="eyebrow">Campaign Orchestrator</p>
                <h2 className="hero-title">Segmented Discount Mail Engine</h2>
                <p className="hero-subtitle">
                    Send targeted discount emails, prevent duplicates, and verify dispatch status by campaign or recipient.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="panel">
                    <h3 className="panel-title">Create Campaign</h3>
                    <form className="mt-4 space-y-4" onSubmit={sendCampaign}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className="form-field">
                                <span>Target Segment</span>
                                <input value={form.segment_name} onChange={(e) => onChange('segment_name', e.target.value)} />
                            </label>
                            <label className="form-field">
                                <span>Discount %</span>
                                <input
                                    type="number"
                                    min="1"
                                    max="90"
                                    value={form.discount_percent}
                                    onChange={(e) => onChange('discount_percent', e.target.value)}
                                />
                            </label>
                            <label className="form-field">
                                <span>Discount Code</span>
                                <input value={form.discount_code} onChange={(e) => onChange('discount_code', e.target.value)} />
                            </label>
                            <label className="form-field">
                                <span>Max Recipients</span>
                                <input type="number" min="1" value={form.limit} onChange={(e) => onChange('limit', e.target.value)} />
                            </label>
                            <label className="form-field md:col-span-2">
                                <span>Campaign ID (optional)</span>
                                <input
                                    value={form.campaign_id}
                                    onChange={(e) => onChange('campaign_id', e.target.value)}
                                    placeholder="leave empty for auto-id"
                                />
                            </label>
                        </div>

                        <div className="flex flex-wrap gap-4 pt-2">
                            <label className="checkbox-field">
                                <input
                                    type="checkbox"
                                    checked={form.dry_run}
                                    onChange={(e) => onChange('dry_run', e.target.checked)}
                                />
                                <span>Dry run (simulate, do not actually send)</span>
                            </label>
                            <label className="checkbox-field">
                                <input
                                    type="checkbox"
                                    checked={form.force_resend}
                                    onChange={(e) => onChange('force_resend', e.target.checked)}
                                />
                                <span>Force resend even if already sent</span>
                            </label>
                        </div>

                        <button type="submit" className="btn-elite" disabled={loadingSend}>
                            {loadingSend ? 'Processing...' : 'Run Campaign'}
                        </button>
                    </form>

                    {result && (
                        <div className="mt-5 result-grid">
                            <div><strong>Campaign ID</strong><span>{result.campaign_id}</span></div>
                            <div><strong>Segment</strong><span>{result.target_segment}</span></div>
                            <div><strong>Candidates</strong><span>{result.total_candidates}</span></div>
                            <div><strong>Valid Emails</strong><span>{result.valid_emails}</span></div>
                            <div><strong>Sent</strong><span>{result.sent}</span></div>
                            <div><strong>Simulated</strong><span>{result.simulated}</span></div>
                            <div><strong>Duplicates</strong><span>{result.skipped_duplicates}</span></div>
                            <div><strong>Failed</strong><span>{result.failed}</span></div>
                        </div>
                    )}
                </div>

                <div className="panel">
                    <h3 className="panel-title">Check Send Status</h3>
                    <div className="mt-4 grid grid-cols-1 gap-4">
                        <label className="form-field">
                            <span>Campaign ID</span>
                            <input
                                value={statusFilter.campaign_id}
                                onChange={(e) => setStatusFilter((prev) => ({ ...prev, campaign_id: e.target.value }))}
                            />
                        </label>
                        <label className="form-field">
                            <span>Email (optional)</span>
                            <input
                                value={statusFilter.email}
                                onChange={(e) => setStatusFilter((prev) => ({ ...prev, email: e.target.value }))}
                            />
                        </label>
                        <button type="button" className="btn-elite" onClick={fetchStatus} disabled={loadingStatus}>
                            {loadingStatus ? 'Loading...' : 'Fetch Status'}
                        </button>
                    </div>

                    {status && (
                        <>
                            <div className="mt-5 result-grid">
                                <div><strong>Total Logs</strong><span>{status.total_logs}</span></div>
                                <div><strong>Sent</strong><span>{status.sent}</span></div>
                                <div><strong>Simulated</strong><span>{status.simulated}</span></div>
                                <div><strong>Duplicates</strong><span>{status.skipped_duplicates}</span></div>
                                <div><strong>Failed</strong><span>{status.failed}</span></div>
                            </div>

                            <div className="mt-4 max-h-[260px] overflow-auto border border-slate-200 rounded-lg">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 sticky top-0">
                                        <tr>
                                            <th className="table-head">Email</th>
                                            <th className="table-head">Status</th>
                                            <th className="table-head">Message</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {status.items.map((item, idx) => (
                                            <tr key={`${item.email}-${idx}`} className="border-t border-slate-100">
                                                <td className="table-data">{item.email}</td>
                                                <td className="table-data">{item.delivery_status}</td>
                                                <td className="table-data">{item.provider_message || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
