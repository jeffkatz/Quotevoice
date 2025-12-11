import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Trash2, CheckCircle, Send, FileText, MoreHorizontal } from 'lucide-react';

type Invoice = {
    id: number;
    invoice_number: string;
    client_name: string;
    type: 'invoice' | 'quotation';
    status: 'draft' | 'sent' | 'paid' | 'void';
    issue_date: string;
    due_date: string;
    grand_total: number;
};

export default function InvoiceList() {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [settings, setSettings] = useState<any>(null);
    const [showMenu, setShowMenu] = useState<number | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        if (window.api) {
            const [invoicesData, settingsData] = await Promise.all([
                window.api.getInvoices(),
                window.api.getSettings()
            ]);
            setInvoices(invoicesData);
            setSettings(settingsData);
        }
    };

    const currency = settings?.currency_symbol || 'R';

    const filteredInvoices = invoices.filter(inv => {
        const invNumber = inv.invoice_number || '';
        const clientName = inv.client_name || '';
        const matchesSearch = invNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            clientName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || inv.type === filterType;
        const matchesStatus = filterStatus === 'all' || inv.status === filterStatus;
        return matchesSearch && matchesType && matchesStatus;
    });

    const handleStatusChange = async (id: number, status: string) => {
        if (window.api) {
            await window.api.updateInvoiceStatus(id, status);
            loadData();
            setShowMenu(null);
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this document?')) {
            if (window.api) {
                await window.api.deleteInvoice(id);
                loadData();
            }
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-700 border-green-200';
            case 'sent': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'draft': return 'bg-slate-100 text-slate-600 border-slate-200';
            case 'void': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    const getTypeColor = (type: string) => {
        return type === 'invoice'
            ? 'bg-purple-100 text-purple-700'
            : 'bg-amber-100 text-amber-700';
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Documents</h1>
                    <p className="text-slate-500">Manage your invoices and quotations</p>
                </div>
                <Link
                    to="/invoices/new"
                    className="flex items-center gap-2 bg-brand-600 text-white px-6 py-3 rounded-lg hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/25 font-medium"
                >
                    <Plus size={20} /> Create New
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
                <div className="flex gap-4 items-center">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by invoice number or client..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        value={filterType}
                        onChange={e => setFilterType(e.target.value)}
                        className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white focus:border-brand-500 outline-none"
                    >
                        <option value="all">All Types</option>
                        <option value="invoice">Invoices</option>
                        <option value="quotation">Quotations</option>
                    </select>
                    <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white focus:border-brand-500 outline-none"
                    >
                        <option value="all">All Status</option>
                        <option value="draft">Draft</option>
                        <option value="sent">Sent</option>
                        <option value="paid">Paid</option>
                        <option value="void">Void</option>
                    </select>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <div className="text-2xl font-bold text-slate-800">{invoices.length}</div>
                    <div className="text-sm text-slate-500">Total Documents</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <div className="text-2xl font-bold text-green-600">
                        {invoices.filter(i => i.status === 'paid').length}
                    </div>
                    <div className="text-sm text-slate-500">Paid</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <div className="text-2xl font-bold text-blue-600">
                        {invoices.filter(i => i.status === 'sent').length}
                    </div>
                    <div className="text-sm text-slate-500">Sent</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <div className="text-2xl font-bold text-slate-600">
                        {invoices.filter(i => i.status === 'draft').length}
                    </div>
                    <div className="text-sm text-slate-500">Drafts</div>
                </div>
            </div>

            {/* Invoice Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-sm font-semibold text-slate-600">Number</th>
                            <th className="px-6 py-4 text-sm font-semibold text-slate-600">Client</th>
                            <th className="px-6 py-4 text-sm font-semibold text-slate-600">Type</th>
                            <th className="px-6 py-4 text-sm font-semibold text-slate-600">Status</th>
                            <th className="px-6 py-4 text-sm font-semibold text-slate-600">Date</th>
                            <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">Amount</th>
                            <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredInvoices.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-16 text-center">
                                    <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                                    <div className="text-slate-500 mb-2">No documents found</div>
                                    <Link to="/invoices/new" className="text-brand-600 hover:underline">
                                        Create your first invoice
                                    </Link>
                                </td>
                            </tr>
                        ) : (
                            filteredInvoices.map(invoice => (
                                <tr key={invoice.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="font-mono font-medium text-slate-800">
                                            {invoice.invoice_number}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-medium text-slate-700">{invoice.client_name}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getTypeColor(invoice.type)}`}>
                                            {invoice.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium capitalize border ${getStatusColor(invoice.status)}`}>
                                            {invoice.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {new Date(invoice.issue_date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right font-semibold text-slate-800">
                                        {currency}{invoice.grand_total.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 relative">
                                            <button
                                                onClick={() => navigate(`/invoices/${invoice.id}`)}
                                                className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                                                title="View"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                onClick={() => setShowMenu(showMenu === invoice.id ? null : invoice.id)}
                                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                            >
                                                <MoreHorizontal size={18} />
                                            </button>

                                            {showMenu === invoice.id && (
                                                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10 min-w-[160px]">
                                                    {invoice.status === 'draft' && (
                                                        <button
                                                            onClick={() => handleStatusChange(invoice.id, 'sent')}
                                                            className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                                                        >
                                                            <Send size={16} /> Mark as Sent
                                                        </button>
                                                    )}
                                                    {invoice.status !== 'paid' && (
                                                        <button
                                                            onClick={() => handleStatusChange(invoice.id, 'paid')}
                                                            className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 text-green-600"
                                                        >
                                                            <CheckCircle size={16} /> Mark as Paid
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(invoice.id)}
                                                        className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600"
                                                    >
                                                        <Trash2 size={16} /> Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
