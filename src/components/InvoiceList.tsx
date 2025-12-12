import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Trash2, CheckCircle, Send, FileText, Edit } from 'lucide-react';
import { Invoice as DbInvoice } from '../types';

type Invoice = DbInvoice & {
    client_name?: string;
};

export default function InvoiceList() {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [settings, setSettings] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        if (window.api) {
            const [invoicesData, settingsData] = await Promise.all([
                window.api.getInvoices(),
                window.api.getSettings()
            ]);
            setInvoices(invoicesData as Invoice[]);
            setSettings(settingsData);
        } else {
            // Mock data
            setInvoices([
                { id: 1, invoice_number: 'INV-001', client_id: 1, client_name: 'Acme Corp', type: 'invoice', status: 'paid', issue_date: new Date().toISOString(), due_date: new Date().toISOString(), grand_total: 1200, items: [], payments: [], balance_due: 0, amount_paid: 1200, tax_rate: 10, tax_total: 120, subtotal: 1080, created_at: new Date().toISOString(), invoice_name: 'Consulting' },
                { id: 2, invoice_number: 'INV-002', client_id: 2, client_name: 'Stark Ind', type: 'invoice', status: 'sent', issue_date: new Date().toISOString(), due_date: new Date().toISOString(), grand_total: 3500, items: [], payments: [], balance_due: 3500, amount_paid: 0, tax_rate: 10, tax_total: 350, subtotal: 3150, created_at: new Date().toISOString(), invoice_name: 'Reactor Parts' },
            ]);
        }
    };

    const currency = settings?.currency_symbol || '$';

    const filteredInvoices = invoices.filter(inv => {
        const invNumber = inv.invoice_number || '';
        const clientName = inv.client_name || '';
        const matchesSearch = invNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            clientName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || inv.type === filterType;
        const matchesStatus = filterStatus === 'all' || inv.status === filterStatus;
        return matchesSearch && matchesType && matchesStatus;
    });

    const handleStatusChange = async (id: number, status: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.api) {
            await window.api.updateInvoiceStatus(id, status);
            loadData();
        }
    };

    const handleDelete = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
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
            case 'partially_paid': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'sent': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'draft': return 'bg-slate-100 text-slate-600 border-slate-200';
            case 'void': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    const getTypeColor = (type: string) => {
        return type === 'invoice'
            ? 'bg-purple-100/50 text-purple-700 border border-purple-200/50'
            : 'bg-amber-100/50 text-amber-700 border border-amber-200/50';
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto animate-fade-in space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Invoices</h1>
                    <p className="text-slate-500 mt-1 font-medium">Manage your invoices and quotations</p>
                </div>
                <Link
                    to="/create"
                    className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-full hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 font-medium active:scale-95"
                >
                    <Plus size={18} /> Create New
                </Link>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 relative w-full md:w-auto">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search invoices..."
                        className="w-full pl-11 pr-4 py-3 rounded-2xl border-0 bg-white shadow-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all placeholder:text-slate-400"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <select
                        value={filterType}
                        onChange={e => setFilterType(e.target.value)}
                        className="px-4 py-3 rounded-2xl border-0 bg-white shadow-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-600 font-medium min-w-[140px]"
                    >
                        <option value="all">All Types</option>
                        <option value="invoice">Invoices</option>
                        <option value="quotation">Quotations</option>
                    </select>
                    <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="px-4 py-3 rounded-2xl border-0 bg-white shadow-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-600 font-medium min-w-[140px]"
                    >
                        <option value="all">All Status</option>
                        <option value="draft">Draft</option>
                        <option value="sent">Sent</option>
                        <option value="paid">Paid</option>
                        <option value="partially_paid">Partially Paid</option>
                        <option value="void">Void</option>
                    </select>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card-apple p-5 flex flex-col justify-center">
                    <div className="text-3xl font-bold text-slate-900 mb-1">{invoices.length}</div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Invoices</div>
                </div>
                <div className="card-apple p-5 flex flex-col justify-center">
                    <div className="text-3xl font-bold text-green-600 mb-1">
                        {invoices.filter(i => i.status === 'paid').length}
                    </div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Paid</div>
                </div>
                <div className="card-apple p-5 flex flex-col justify-center">
                    <div className="text-3xl font-bold text-blue-600 mb-1">
                        {invoices.filter(i => i.status === 'sent').length}
                    </div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sent</div>
                </div>
                <div className="card-apple p-5 flex flex-col justify-center">
                    <div className="text-3xl font-bold text-slate-600 mb-1">
                        {invoices.filter(i => i.status === 'draft').length}
                    </div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Drafts</div>
                </div>
            </div>

            {/* Invoice Table */}
            <div className="card-apple overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Document</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Client</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredInvoices.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-24 text-center">
                                    <div className="flex flex-col items-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                            <FileText size={32} className="text-slate-300" />
                                        </div>
                                        <h3 className="text-slate-900 font-medium mb-1">No invoices found</h3>
                                        <p className="text-slate-500 text-sm mb-4">Try adjusting your filters or search terms</p>
                                        <Link to="/create" className="text-blue-600 font-medium hover:text-blue-700 transition-colors text-sm">
                                            Create your first invoice &rarr;
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredInvoices.map(invoice => (
                                <tr key={invoice.id} className="hover:bg-slate-50/80 transition-colors group cursor-default">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900 text-sm">{invoice.invoice_name || 'Untitled Document'}</span>
                                            <span className="font-mono text-[10px] text-slate-400 mt-0.5">{invoice.invoice_number}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-medium text-slate-700 text-sm">{invoice.client_name}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide ${getTypeColor(invoice.type)}`}>
                                            {invoice.type === 'invoice' ? 'INV' : 'QT'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide border ${getStatusColor(invoice.status)}`}>
                                            {invoice.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-sm">
                                        {new Date(invoice.issue_date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-900 text-sm">
                                        {currency}{invoice.grand_total.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {invoice.status === 'draft' && (
                                                <button
                                                    onClick={(e) => handleStatusChange(invoice.id, 'sent', e)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Mark as Sent"
                                                >
                                                    <Send size={18} />
                                                </button>
                                            )}
                                            {invoice.status !== 'paid' && (
                                                <button
                                                    onClick={(e) => handleStatusChange(invoice.id, 'paid', e)}
                                                    className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                    title="Mark as Paid"
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => navigate(`/invoices/${invoice.id}`)}
                                                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                                                title="Edit Document"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={(e) => handleDelete(invoice.id, e)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
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
