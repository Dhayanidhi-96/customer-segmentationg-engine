import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerAPI } from '../services/api';
import toast from 'react-hot-toast';

const COLORS = ['#f43f5e', '#8b5cf6', '#10b981', '#f59e0b', '#0ea5e9', '#d946ef'];
const PAGE_SIZE = 20;

export default function CustomersPage() {
    const [customers, setCustomers] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [segmentFilter, setSegmentFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Debounce manual search input
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(0); // Reset page on new search
        }, 400);
        return () => clearTimeout(handler);
    }, [search]);

    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        try {
            const params = { skip: page * PAGE_SIZE, limit: PAGE_SIZE };
            if (segmentFilter !== '') params.segment_id = parseInt(segmentFilter);
            if (debouncedSearch !== '') params.search = debouncedSearch;
            const res = await customerAPI.getAll(params);
            setCustomers(res.data.customers);
            setTotal(res.data.total);
        } catch {
            toast.error('Failed to load customers');
        } finally {
            setLoading(false);
        }
    }, [page, segmentFilter, debouncedSearch]);

    useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

    const totalPages = Math.ceil(total / PAGE_SIZE);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 mb-2 items-center justify-between">
                <div className="relative flex-1 w-full max-w-md">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                    <input
                        type="text" 
                        placeholder="Search by name or email (Server-side)..."
                        value={search} 
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-lg pl-12 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                    />
                </div>
                
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <select
                        value={segmentFilter}
                        onChange={e => { setSegmentFilter(e.target.value); setPage(0); }}
                        className="bg-white border border-slate-200 text-slate-700 font-medium text-sm rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    >
                        <option value="">All Segments</option>
                        {[0, 1, 2, 3, 4, 5].map(i => <option key={i} value={i}>Segment {i}</option>)}
                    </select>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wide bg-white px-4 py-2.5 rounded-lg border border-slate-200 whitespace-nowrap shadow-sm">
                        Total Records: <span className="text-blue-600">{total.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <div className="card p-0 overflow-hidden shadow-sm border-slate-200">
                {loading ? (
                    <div className="py-32 text-center"><div className="spinner"></div><p className="mt-4 font-medium text-slate-500">Querying database...</p></div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr>
                                        <th className="table-header">Customer ID</th>
                                        <th className="table-header">Name</th>
                                        <th className="table-header">Email</th>
                                        <th className="table-header">Segment</th>
                                        <th className="table-header">Recency</th>
                                        <th className="table-header">Freq.</th>
                                        <th className="table-header">Monetary ($)</th>
                                        <th className="table-header">Confidence</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {customers.length === 0 ? (
                                        <tr><td colSpan="8" className="text-center py-12 text-slate-400 font-medium">No customers found.</td></tr>
                                    ) : (
                                        customers.map(c => {
                                            const cColor = COLORS[c.segment_id || 0];
                                        return (
                                            <tr key={c.customer_id} 
                                                onClick={() => navigate(`/customers/${c.customer_id}`)}
                                                className="hover:bg-slate-50 transition-colors cursor-pointer group"
                                            >
                                                <td className="table-cell font-mono text-slate-400 text-xs">{c.customer_id}</td>
                                                <td className="table-cell font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{c.name || '—'}</td>
                                                <td className="table-cell text-slate-500 italic text-xs">{c.email || '—'}</td>
                                                <td className="table-cell">
                                                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold ring-1 ring-inset" style={{
                                                        color: cColor, 
                                                        background: `${cColor}15`,
                                                        boxShadow: `inset 0 0 0 1px ${cColor}40`
                                                    }}>
                                                        {c.segment_name || 'Unassigned'}
                                                    </span>
                                                </td>
                                                <td className="table-cell text-slate-600 font-medium">{(c.recency_days || 0).toFixed(0)}d</td>
                                                <td className="table-cell text-slate-600 font-medium">{c.frequency || 0}</td>
                                                <td className="table-cell text-slate-700 font-bold">${(c.monetary_value || 0).toFixed(0)}</td>
                                                <td className="table-cell">
                                                    <div className="flex items-center gap-3 w-32">
                                                        <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden flex">
                                                            <div className="h-full rounded-full transition-all" style={{
                                                                width: `${(c.segment_confidence || 0) * 100}%`,
                                                                backgroundColor: cColor,
                                                            }}></div>
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-500 w-8 text-right">
                                                            {((c.segment_confidence || 0) * 100).toFixed(0)}%
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex items-center justify-between px-6 py-4 bg-slate-50/80 border-t border-slate-100">
                            <button className="btn-secondary text-xs px-4 py-2" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                                ← Previous
                            </button>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                Page <span className="text-blue-600 font-black">{page + 1}</span> of <span className="text-slate-600">{totalPages || 1}</span>
                            </div>
                            <button className="btn-secondary text-xs px-4 py-2" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                                Next →
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
