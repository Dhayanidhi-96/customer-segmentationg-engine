import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerAPI } from '../services/api';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#ec4899', '#14b8a6'];
const PAGE_SIZE = 20;

export default function CustomersPage() {
    const [customers, setCustomers] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState('');
    const [segmentFilter, setSegmentFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        try {
            const params = { skip: page * PAGE_SIZE, limit: PAGE_SIZE };
            if (segmentFilter !== '') params.segment_id = parseInt(segmentFilter);
            const res = await customerAPI.getAll(params);
            setCustomers(res.data.customers);
            setTotal(res.data.total);
        } catch {
            toast.error('Failed to load customers');
        } finally {
            setLoading(false);
        }
    }, [page, segmentFilter]);

    useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

    const filtered = search
        ? customers.filter(c =>
            (c.customer_id || '').toLowerCase().includes(search.toLowerCase()) ||
            (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (c.email || '').toLowerCase().includes(search.toLowerCase())
        )
        : customers;

    const totalPages = Math.ceil(total / PAGE_SIZE);

    return (
        <div className="customers-page">
            <div className="filters-bar">
                <div className="search-container">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text" placeholder="Search by name, email, or ID..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        className="search-input"
                    />
                </div>
                <select
                    value={segmentFilter}
                    onChange={e => { setSegmentFilter(e.target.value); setPage(0); }}
                    className="filter-select"
                >
                    <option value="">All Segments</option>
                    {[0, 1, 2, 3, 4, 5].map(i => <option key={i} value={i}>Segment {i}</option>)}
                </select>
                <div className="results-count">
                    Showing {filtered.length} of {total.toLocaleString()} customers
                </div>
            </div>

            <div className="card">
                {loading ? (
                    <div className="loading-container"><div className="spinner"></div><p>Loading customers...</p></div>
                ) : (
                    <>
                        <div className="table-wrapper">
                            <table className="data-table clickable">
                                <thead>
                                    <tr>
                                        <th>Customer ID</th><th>Name</th><th>Email</th>
                                        <th>Segment</th><th>Recency</th><th>Frequency</th>
                                        <th>Monetary ($)</th><th>Confidence</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(c => (
                                        <tr key={c.customer_id} onClick={() => navigate(`/customers/${c.customer_id}`)}>
                                            <td className="font-mono">{c.customer_id}</td>
                                            <td className="font-medium">{c.name || '—'}</td>
                                            <td className="text-secondary">{c.email || '—'}</td>
                                            <td>
                                                <span className="segment-badge" style={{
                                                    backgroundColor: COLORS[c.segment_id || 0] + '20',
                                                    color: COLORS[c.segment_id || 0],
                                                    borderColor: COLORS[c.segment_id || 0] + '40',
                                                }}>{c.segment_name || 'Unassigned'}</span>
                                            </td>
                                            <td>{(c.recency_days || 0).toFixed(1)}d</td>
                                            <td>{c.frequency || 0}</td>
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

                        <div className="pagination">
                            <button className="pagination-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Previous</button>
                            <div className="pagination-info">Page {page + 1} of {totalPages || 1}</div>
                            <button className="pagination-btn" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next →</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
