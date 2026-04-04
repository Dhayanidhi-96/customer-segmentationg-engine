import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import SegmentsPage from './pages/SegmentsPage';
import PredictionPage from './pages/PredictionPage';
import ModelLabPage from './pages/ModelLabPage';
import AiAnalystPage from './pages/AiAnalystPage';
import CampaignsPage from './pages/CampaignsPage';

const navItems = [
    { path: '/', label: 'Overview' },
    { path: '/customers', label: 'Customers' },
    { path: '/segments', label: 'Segments' },
    { path: '/predict', label: 'Predict' },
    { path: '/lab', label: 'Model Lab' },
    { path: '/ai-analyst', label: 'AI Analyst' },
    { path: '/campaigns', label: 'Campaigns' },
];

const pageTitles = {
    '/': 'Executive Dashboard',
    '/customers': 'Customer Management',
    '/segments': 'Segment Intelligence',
    '/predict': 'Segment Prediction',
    '/lab': 'Model Laboratory',
    '/ai-analyst': 'AI Analyst Workspace',
    '/campaigns': 'Campaign Control Center',
};

function App() {
    const location = useLocation();
    const currentTitle = pageTitles[location.pathname] || 'Customer Detail View';

    return (
        <div className="app-shell min-h-screen text-slate-800 selection:bg-teal-100">
            <Toaster position="top-right" toastOptions={{
                style: { background: '#ffffff', color: '#1e293b', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }
            }} />

            <aside className="w-72 fixed inset-y-0 left-0 z-50 flex flex-col glass-sidebar border-r border-slate-200/60">
                <div className="h-20 flex items-center px-6 border-b border-slate-200/50">
                    <div className="w-10 h-10 rounded-xl bg-teal-700 flex items-center justify-center text-white shadow-md mr-3 font-black">
                        SI
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tight text-slate-900 leading-tight">SegmentIQ</h1>
                        <p className="text-[11px] text-teal-700 font-bold uppercase tracking-[0.18em]">Revenue Intelligence</p>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
                    <div className="px-3 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Navigation</div>
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                                    isActive 
                                    ? 'bg-teal-700 text-white shadow-lg' 
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                                }`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-200/50">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 py-2.5 px-3 rounded-lg border border-emerald-200 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        Intelligence Online
                    </div>
                </div>
            </aside>

            <div className="flex-1 flex flex-col ml-72 min-w-0">
                <header className="h-20 flex items-center justify-between px-8 bg-white/70 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-40">
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-bold">Workspace</p>
                        <h2 className="page-title">{currentTitle}</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-xs font-bold text-slate-700 bg-white py-2 px-3 rounded-full border border-slate-300">
                            Q1 2026
                        </div>
                        <div className="text-xs font-black text-teal-800 bg-teal-100 py-2 px-3 rounded-full border border-teal-200">
                            Elite Suite
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-8 overflow-x-hidden animate-[fadeIn_0.35s_ease-out]">
                    <div className="max-w-7xl mx-auto">
                        <Routes>
                            <Route path="/" element={<DashboardPage />} />
                            <Route path="/customers" element={<CustomersPage />} />
                            <Route path="/customers/:customerId" element={<CustomerDetailPage />} />
                            <Route path="/segments" element={<SegmentsPage />} />
                            <Route path="/predict" element={<PredictionPage />} />
                            <Route path="/lab" element={<ModelLabPage />} />
                            <Route path="/ai-analyst" element={<AiAnalystPage />} />
                            <Route path="/campaigns" element={<CampaignsPage />} />
                        </Routes>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default App;
