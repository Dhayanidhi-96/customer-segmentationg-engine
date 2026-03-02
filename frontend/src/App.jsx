import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import SegmentsPage from './pages/SegmentsPage';
import PredictionPage from './pages/PredictionPage';

const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/customers', label: 'Customers', icon: '👥' },
    { path: '/segments', label: 'Segments', icon: '🎯' },
    { path: '/predict', label: 'Predict', icon: '🔮' },
];

const pageTitles = {
    '/': 'Dashboard Overview',
    '/customers': 'Customer Management',
    '/segments': 'Segment Explorer',
    '/predict': 'Prediction Tool',
};

function App() {
    const location = useLocation();
    const path = location.pathname;
    const pageTitle = pageTitles[path] || (path.startsWith('/customers/') ? 'Customer Details' : 'Dashboard');

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <div className="logo-icon">🎯</div>
                    <div className="logo-text">
                        <h1>SegmentIQ</h1>
                        <span>Customer Intelligence</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/'}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-badge">
                        <span className="badge-dot"></span>
                        <span>Backend Connected</span>
                    </div>
                    <p className="sidebar-version">v1.0.0</p>
                </div>
            </aside>

            <div className="main-area">
                <header className="top-header">
                    <h2 className="page-title">{pageTitle}</h2>
                    <div className="header-actions">
                        <div className="header-badge">
                            <span className="pulse-dot"></span>
                            <span>Live</span>
                        </div>
                    </div>
                </header>

                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<DashboardPage />} />
                        <Route path="/customers" element={<CustomersPage />} />
                        <Route path="/customers/:customerId" element={<CustomerDetailPage />} />
                        <Route path="/segments" element={<SegmentsPage />} />
                        <Route path="/predict" element={<PredictionPage />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
}

export default App;
