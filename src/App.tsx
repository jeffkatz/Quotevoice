import { useEffect, useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import InvoiceEditor from './components/InvoiceEditor';
import InvoiceList from './components/InvoiceList';
import InvoiceView from './components/InvoiceView';
import Clients from './components/Clients';
import Settings from './components/Settings';
import DesignTemplates from './components/DesignTemplates';
import Sidebar from './components/Sidebar';
import { ArrowUpRight, Plus, Clock, AlertCircle, CheckCircle2, MoreHorizontal, TrendingUp, FileText, Users, Settings as SettingsIcon } from 'lucide-react';


function Dashboard() {
    const [stats, setStats] = useState({ revenue: 0, overdueInvoices: 0, drafts: 0 });
    const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
    const [settings, setSettings] = useState<any>(null);
    const [chartData, setChartData] = useState<any[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (window.api) {
            loadDashboardData();
        }
    }, []);

    const loadDashboardData = async () => {
        try {
            const [statsData, invoices, settingsData] = await Promise.all([
                window.api.getDashboardStats(),
                window.api.getInvoices(),
                window.api.getSettings()
            ]);

            setStats(statsData);
            setRecentInvoices(invoices.slice(0, 5));
            setSettings(settingsData);

            // Process chart data (Last 6 months)
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const today = new Date();
            const last6Months: any[] = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                last6Months.push({
                    name: months[d.getMonth()],
                    monthIndex: d.getMonth(),
                    year: d.getFullYear(),
                    revenue: 0
                });
            }

            invoices.forEach((inv: any) => {
                if (inv.status === 'paid') {
                    const d = new Date(inv.issue_date);
                    const monthData = last6Months.find(m => m.monthIndex === d.getMonth() && m.year === d.getFullYear());
                    if (monthData) {
                        monthData.revenue += inv.grand_total;
                    }
                }
            });

            setChartData(last6Months);

        } catch (error) {
            console.error("Failed to load dashboard data", error);
        }
    };

    const currency = settings?.currency_symbol || 'R';
    const primaryColor = settings?.primary_color || '#0ea5e9';

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Hero Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
                        {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-purple-600">Admin</span>
                    </h1>
                    <p className="text-slate-500 mt-1">Here's what's happening with your business today.</p>
                </div>
                <Link
                    to="/invoices/new"
                    className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 font-medium"
                >
                    <Plus size={18} /> New Document
                </Link>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Revenue Card - The "Star" */}
                <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-2xl shadow-xl shadow-indigo-500/20 text-white group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp size={80} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-indigo-100 mb-2">
                            <div className="p-1.5 rounded-lg bg-white/10 backdrop-blur-sm">
                                <TrendingUp size={16} />
                            </div>
                            <span className="text-sm font-medium">Total Revenue</span>
                        </div>
                        <div className="text-4xl font-bold tracking-tight mb-1">
                            {currency}{stats.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-indigo-200">
                            <CheckCircle2 size={14} />
                            <span>Lifetime earnings from paid invoices</span>
                        </div>
                    </div>
                </div>

                {/* Overdue Card - The "Alert" */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-red-200 transition-colors group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-slate-500">
                            <div className="p-1.5 rounded-lg bg-red-50 text-red-600 group-hover:bg-red-100 transition-colors">
                                <AlertCircle size={16} />
                            </div>
                            <span className="text-sm font-medium">Action Required</span>
                        </div>
                        <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded-full text-slate-600">Overdue</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-slate-800">{stats.overdueInvoices}</span>
                        <span className="text-sm text-slate-500">invoices</span>
                    </div>
                    <p className="text-sm text-slate-400 mt-2">
                        Needs attention immediately
                    </p>
                </div>

                {/* Drafts Card - The "Pipeline" */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-brand-200 transition-colors group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-slate-500">
                            <div className="p-1.5 rounded-lg bg-brand-50 text-brand-600 group-hover:bg-brand-100 transition-colors">
                                <Clock size={16} />
                            </div>
                            <span className="text-sm font-medium">In Pipeline</span>
                        </div>
                        <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded-full text-slate-600">Drafts</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-slate-800">{stats.drafts}</span>
                        <span className="text-sm text-slate-500">documents</span>
                    </div>
                    <p className="text-sm text-slate-400 mt-2">
                        Drafts waiting to be sent
                    </p>
                </div>
            </div>

            {/* Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart Area */}
                <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Financial Performance</h2>
                            <p className="text-sm text-slate-500">Revenue trend over the last 6 months</p>
                        </div>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={primaryColor} stopOpacity={0.2} />
                                        <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    tickFormatter={(value) => `${currency}${value}`}
                                />
                                <Tooltip
                                    cursor={{ stroke: '#e2e8f0' }}
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                        padding: '12px'
                                    }}
                                    itemStyle={{ color: primaryColor, fontWeight: 600 }}
                                    formatter={(value: number) => [`${currency}${value.toLocaleString()}`, 'Revenue']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke={primaryColor}
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Quick Actions / Mini Feed */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
                    <h2 className="text-lg font-bold text-slate-800 mb-4">Quick Links</h2>
                    <div className="space-y-3">
                        <Link to="/invoices/new" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-100">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors">
                                <FileText size={20} />
                            </div>
                            <div>
                                <div className="font-medium text-slate-700">Create Invoice</div>
                                <div className="text-xs text-slate-400">Bill a client</div>
                            </div>
                            <div className="ml-auto text-slate-400">
                                <ArrowUpRight size={16} />
                            </div>
                        </Link>
                        <Link to="/clients" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-100">
                            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-100 transition-colors">
                                <Users size={20} />
                            </div>
                            <div>
                                <div className="font-medium text-slate-700">Add Client</div>
                                <div className="text-xs text-slate-400">Expand your network</div>
                            </div>
                            <div className="ml-auto text-slate-400">
                                <ArrowUpRight size={16} />
                            </div>
                        </Link>
                        <Link to="/settings" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-100">
                            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-100 transition-colors">
                                <SettingsIcon size={20} />
                            </div>
                            <div>
                                <div className="font-medium text-slate-700">Settings</div>
                                <div className="text-xs text-slate-400">Update company info</div>
                            </div>
                            <div className="ml-auto text-slate-400">
                                <ArrowUpRight size={16} />
                            </div>
                        </Link>
                    </div>

                    <div className="mt-auto pt-6 border-t border-slate-100">
                        <div className="bg-slate-50 rounded-xl p-4">
                            <h4 className="text-sm font-semibold text-slate-700 mb-2">Pro Tip</h4>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Sending invoices immediately after work is completed increases the likelihood of getting paid on time by 20%.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-800">Recent Documents</h2>
                    <Link to="/invoices" className="text-sm text-brand-600 font-medium hover:text-brand-700">View All</Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-semibold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Document</th>
                                <th className="px-6 py-4">Client</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {recentInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center">
                                            <FileText size={48} className="mb-4 text-slate-200" />
                                            <p>No recent activity.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                recentInvoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-medium text-xs">
                                                    {inv.type === 'invoice' ? 'INV' : 'QT'}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-700">{inv.invoice_number}</div>
                                                    <div className="text-xs text-slate-400">{new Date(inv.issue_date).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-700">{inv.client_name || 'Unknown Client'}</td>
                                        <td className="px-6 py-4 text-right font-semibold text-slate-800">
                                            {currency}{inv.grand_total.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize border ${inv.status === 'paid' ? 'bg-green-50 text-green-700 border-green-200' :
                                                inv.status === 'sent' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                    inv.status === 'void' ? 'bg-red-50 text-red-700 border-red-200' :
                                                        'bg-slate-50 text-slate-600 border-slate-200'
                                                }`}>
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => navigate(`/invoices/${inv.id}`)}
                                                className="text-slate-400 hover:text-brand-600 transition-colors"
                                            >
                                                <MoreHorizontal size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}



function App() {
    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
            <Sidebar />
            <div className="flex-1 overflow-auto">
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/invoices" element={<InvoiceList />} />
                    <Route path="/invoices/new" element={<InvoiceEditor />} />
                    <Route path="/invoices/:id" element={<InvoiceView />} />
                    <Route path="/invoices/edit/:id" element={<InvoiceEditor />} />
                    <Route path="/clients" element={<Clients />} />
                    <Route path="/templates" element={<DesignTemplates />} />
                    <Route path="/settings" element={<Settings />} />
                </Routes>
            </div>
        </div>
    );
}

export default App;


