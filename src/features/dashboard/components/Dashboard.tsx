import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Clock, AlertCircle, TrendingUp, DollarSign, FileText } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const [stats, setStats] = useState({ revenue: 0, overdueInvoices: 0, drafts: 0 });
    const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
    const [settings, setSettings] = useState<any>(null);
    const [chartData, setChartData] = useState<any[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (window.api) {
            loadDashboardData();
        } else {
            // Mock data for development if API is missing (e.g. browser dev)
            setStats({ revenue: 125000.50, overdueInvoices: 3, drafts: 2 });
            setRecentInvoices([
                { id: 1, invoice_number: 'INV-001', client_name: 'Acme Corp', grand_total: 1200.00, status: 'paid', issue_date: new Date().toISOString(), type: 'invoice' },
                { id: 2, invoice_number: 'INV-002', client_name: 'Stark Ind', grand_total: 3500.50, status: 'sent', issue_date: new Date().toISOString(), type: 'invoice' },
                { id: 3, invoice_number: 'QT-005', client_name: 'Wayne Ent', grand_total: 10000.00, status: 'draft', issue_date: new Date().toISOString(), type: 'quote' }
            ]);
            setSettings({ currency_symbol: '$', primary_color: '#0071e3' });
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

            // Process chart data from backend
            if ((statsData as any).revenueTrend) {
                // Backend returns { month: 'YYYY-MM', amount: number }
                // We map this to { name: 'MMM', revenue: number }
                // We should ensure we show last 6 months even if gaps exist?
                // For simplicity, we just map what we have.
                // Or better: Merge with empty months logic?
                // Let's stick to the mapped data for now.
                const trend = (statsData as any).revenueTrend;
                const formattedData = trend.map((t: any) => {
                    const [year, month] = t.month.split('-');
                    const d = new Date(Number(year), Number(month) - 1, 1);
                    return {
                        name: d.toLocaleString('default', { month: 'short' }),
                        fullDate: t.month,
                        revenue: t.amount
                    };
                });
                setChartData(formattedData);
            } else {
                // Fallback to manual calculation (from previous logic)
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
                if (invoices) {
                    invoices.forEach((inv: any) => {
                        if (inv.status === 'paid') {
                            const d = new Date(inv.issue_date);
                            const monthData = last6Months.find(m => m.monthIndex === d.getMonth() && m.year === d.getFullYear());
                            if (monthData) monthData.revenue += inv.grand_total;
                        }
                    });
                }
                setChartData(last6Months);
            }

        } catch (error) {
            console.error("Failed to load dashboard data", error);
        }
    };

    const currency = settings?.currency_symbol || '$';
    const primaryColor = settings?.primary_color || '#0071e3';

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                        {getGreeting()}
                    </h1>
                    <p className="text-slate-500 font-medium">Overview</p>
                </div>
                <Link
                    to="/invoices/new"
                    className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-full hover:bg-slate-800 transition-all font-medium shadow-lg shadow-slate-900/10 active:scale-95"
                >
                    <Plus size={18} /> New Invoice
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card-apple p-6 relative overflow-hidden group">
                    {/* Decorative background blob */}
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all duration-500"></div>

                    <div className="flex items-start justify-between mb-4 relative z-10">
                        <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                            <DollarSign size={20} />
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                            <TrendingUp size={12} /> +12%
                        </span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 mb-1">Total Revenue</p>
                        <h3 className="text-3xl font-bold text-slate-900 tracking-tight">
                            {currency}{stats.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h3>
                    </div>
                </div>

                <div className="card-apple p-6 relative overflow-hidden group">
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl group-hover:bg-orange-500/10 transition-all duration-500"></div>

                    <div className="flex items-start justify-between mb-4 relative z-10">
                        <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600">
                            <AlertCircle size={20} />
                        </div>
                        {stats.overdueInvoices > 0 && (
                            <span className="text-xs font-semibold px-2.5 py-1 bg-red-100 text-red-700 rounded-full">
                                Action Needed
                            </span>
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 mb-1">Overdue Invoices</p>
                        <h3 className="text-3xl font-bold text-slate-900 tracking-tight">
                            {stats.overdueInvoices}
                        </h3>
                    </div>
                </div>

                <div className="card-apple p-6 relative overflow-hidden group">
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all duration-500"></div>

                    <div className="flex items-start justify-between mb-4 relative z-10">
                        <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                            <Clock size={20} />
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 mb-1">Drafts</p>
                        <h3 className="text-3xl font-bold text-slate-900 tracking-tight">
                            {stats.drafts}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Charts & Recent Activity Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart */}
                <div className="lg:col-span-2 card-apple p-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Revenue Trend</h2>
                            <p className="text-sm text-slate-500">Past 6 months performance</p>
                        </div>
                    </div>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={primaryColor} stopOpacity={0.1} />
                                        <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                                    tickFormatter={(value: number) => `${currency}${value / 1000}k`}
                                />
                                <Tooltip
                                    cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                                    contentStyle={{
                                        borderRadius: '16px',
                                        border: 'none',
                                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                                        padding: '16px',
                                        fontFamily: 'Inter, sans-serif'
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
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Invoices List */}
                <div className="card-apple p-0 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
                        <Link to="/invoices" className="text-sm text-blue-600 font-medium hover:text-blue-700">See All</Link>
                    </div>
                    <div className="flex-1 overflow-auto">
                        {recentInvoices.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                                <FileText size={32} className="mb-2 opacity-50" />
                                <p className="text-sm">No recent activity</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {recentInvoices.map((inv: any) => (
                                    <div
                                        key={inv.id}
                                        onClick={() => navigate(`/invoices/${inv.id}`)}
                                        className="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border ${inv.status === 'paid' ? 'bg-green-50 text-green-700 border-green-100' :
                                                inv.status === 'sent' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                    'bg-slate-50 text-slate-600 border-slate-100'
                                                }`}>
                                                {inv.type === 'invoice' ? 'IN' : 'QT'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">{inv.client_name || 'Unknown'}</p>
                                                <p className="text-xs text-slate-500">{inv.invoice_number}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-slate-900">{currency}{inv.grand_total.toFixed(2)}</p>
                                            <p className="text-xs text-slate-500 capitalize">{inv.status}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
