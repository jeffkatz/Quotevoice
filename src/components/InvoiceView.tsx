import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, FileDown, Printer, Edit2, CheckCircle, Send } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function InvoiceView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const previewRef = useRef<HTMLDivElement>(null);
    const [invoice, setInvoice] = useState<any>(null);
    const [settings, setSettings] = useState<any>(null);
    const [logo, setLogo] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        if (window.api && id) {
            try {
                const [invoiceData, settingsData, logoData] = await Promise.all([
                    window.api.getInvoice(Number(id)),
                    window.api.getSettings(),
                    window.api.getLogo()
                ]);
                setInvoice(invoiceData);
                setSettings(settingsData);
                setLogo(logoData);
            } catch (e) {
                console.error('Failed to load invoice:', e);
            }
        }
        setLoading(false);
    };

    const handleDownloadPDF = async () => {
        if (!previewRef.current) return;

        const canvas = await html2canvas(previewRef.current, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${invoice.invoice_number}.pdf`);
    };

    const handleStatusChange = async (status: string) => {
        if (window.api && id) {
            await window.api.updateInvoiceStatus(Number(id), status);
            loadData();
        }
    };

    const currency = settings?.currency_symbol || 'R';

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center">
                <div className="text-slate-500">Loading...</div>
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="p-8 text-center">
                <div className="text-slate-500 mb-4">Invoice not found</div>
                <Link to="/invoices" className="text-brand-600 hover:underline">
                    Back to Invoices
                </Link>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto flex gap-8">
            {/* Sidebar Controls */}
            <div className="w-64 space-y-4 shrink-0">
                <button
                    onClick={() => navigate('/invoices')}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                >
                    <ArrowLeft size={20} /> Back to List
                </button>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="text-sm text-slate-500 mb-1">Document</div>
                    <div className="text-xl font-bold text-slate-800">{invoice.invoice_number}</div>
                    <div className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium capitalize ${invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                        invoice.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-600'
                        }`}>
                        {invoice.status}
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3">
                    <button
                        onClick={handleDownloadPDF}
                        className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white py-3 rounded-lg hover:bg-brand-700 transition font-medium"
                    >
                        <FileDown size={18} /> Download PDF
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="w-full flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-300 py-3 rounded-lg hover:bg-slate-50 transition font-medium"
                    >
                        <Printer size={18} /> Print
                    </button>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-2">
                    <div className="text-sm font-medium text-slate-700 mb-3">Quick Actions</div>
                    {invoice.status === 'draft' && (
                        <button
                            onClick={() => handleStatusChange('sent')}
                            className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm hover:bg-slate-50 rounded-lg"
                        >
                            <Send size={16} className="text-blue-500" /> Mark as Sent
                        </button>
                    )}
                    {invoice.status !== 'paid' && (
                        <button
                            onClick={() => handleStatusChange('paid')}
                            className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm hover:bg-green-50 rounded-lg text-green-600"
                        >
                            <CheckCircle size={16} /> Mark as Paid
                        </button>
                    )}
                    <button
                        onClick={() => navigate(`/invoices/edit/${invoice.id}`)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm hover:bg-slate-50 rounded-lg"
                    >
                        <Edit2 size={16} className="text-slate-500" /> Edit Document
                    </button>
                </div>
            </div>

            {/* Invoice Preview */}
            <div className="flex-1 bg-slate-200 p-8 rounded-xl overflow-auto flex justify-center">
                <div
                    ref={previewRef}
                    className="bg-white w-[210mm] min-h-[297mm] p-12 shadow-2xl text-slate-800 relative"
                    style={{ fontFamily: settings?.font_family || 'Inter, system-ui, sans-serif' }}
                >
                    {/* Background Image Layer */}
                    {settings?.background_image && (
                        <div
                            className="absolute inset-0 z-0 pointer-events-none bg-center bg-no-repeat bg-contain"
                            style={{
                                backgroundImage: `url(${settings.background_image})`,
                                opacity: settings.background_opacity ?? 0.1
                            }}
                        />
                    )}

                    <div className="relative z-10">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                {logo ? (
                                    <img src={logo} alt="Logo" className="h-16 w-auto object-contain mb-4" />
                                ) : (
                                    <div className="text-2xl font-bold mb-4" style={{ color: settings?.primary_color || '#0ea5e9' }}>
                                        {settings?.company_name || 'Your Company'}
                                    </div>
                                )}
                                {logo && (
                                    <div className="text-xl font-bold text-slate-800">
                                        {settings?.company_name}
                                    </div>
                                )}
                                {settings?.company_address && (
                                    <div className="text-sm text-slate-500 whitespace-pre-line mt-1">
                                        {settings.company_address}
                                    </div>
                                )}
                                {settings?.company_email && (
                                    <div className="text-sm text-slate-500">{settings.company_email}</div>
                                )}
                                {settings?.company_phone && (
                                    <div className="text-sm text-slate-500">{settings.company_phone}</div>
                                )}
                            </div>
                            <div className="text-right">
                                <h1 className="text-4xl font-bold text-slate-900 uppercase tracking-tight">
                                    {invoice.type}
                                </h1>
                                <div className="text-lg font-mono text-slate-600 mt-1">
                                    {invoice.invoice_number}
                                </div>
                                {settings?.header_text && (
                                    <div className="mt-2 text-xs text-slate-400 whitespace-pre-line max-w-[200px] ml-auto">
                                        {settings.header_text}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bill To & Details */}
                        <div className="flex justify-between mb-10 pb-8 border-b border-slate-200">
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Bill To</div>
                                {invoice.client ? (
                                    <>
                                        <div className="font-bold text-lg text-slate-800">{invoice.client.name}</div>
                                        {invoice.client.address && (
                                            <div className="text-sm text-slate-600 whitespace-pre-line">{invoice.client.address}</div>
                                        )}
                                        {invoice.client.email && (
                                            <div className="text-sm text-slate-600">{invoice.client.email}</div>
                                        )}
                                        {invoice.client.tax_id && (
                                            <div className="text-sm text-slate-500 mt-1">VAT: {invoice.client.tax_id}</div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-slate-400 italic">Client not found</div>
                                )}
                            </div>
                            <div className="text-right">
                                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                    <span className="text-slate-500">Issue Date:</span>
                                    <span className="font-medium text-slate-800">{invoice.issue_date}</span>
                                    <span className="text-slate-500">Due Date:</span>
                                    <span className="font-medium text-slate-800">{invoice.due_date || '-'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <table className="w-full mb-8">
                            <thead>
                                <tr className="border-b-2 border-slate-900">
                                    <th className="text-left py-3 font-bold text-slate-700 text-sm">Description</th>
                                    <th className="text-center py-3 font-bold text-slate-700 text-sm w-20">Qty</th>
                                    <th className="text-right py-3 font-bold text-slate-700 text-sm w-28">Rate</th>
                                    <th className="text-right py-3 font-bold text-slate-700 text-sm w-28">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoice.items?.map((item: any, i: number) => (
                                    <tr key={i} className="border-b border-slate-100">
                                        <td className="py-4 text-slate-700">{item.description}</td>
                                        <td className="py-4 text-center text-slate-600">{item.quantity}</td>
                                        <td className="py-4 text-right text-slate-600">{currency}{(item.unit_price || 0).toFixed(2)}</td>
                                        <td className="py-4 text-right font-medium text-slate-800">
                                            {currency}{(item.total_price || 0).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Totals */}
                        <div className="flex justify-end mb-8">
                            <div className="w-72">
                                <div className="flex justify-between py-2 text-slate-600">
                                    <span>Subtotal</span>
                                    <span>{currency}{(invoice.subtotal || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between py-2 text-slate-600">
                                    <span>VAT ({invoice.tax_rate || 0}%)</span>
                                    <span>{currency}{(invoice.tax_total || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between py-3 border-t-2 border-slate-900 font-bold text-lg">
                                    <span>Total</span>
                                    <span style={{ color: settings?.primary_color || '#0ea5e9' }}>
                                        {currency}{(invoice.grand_total || 0).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        {invoice.notes && (
                            <div className="mb-8 p-4 bg-slate-50 rounded-lg">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Notes / Terms</div>
                                <div className="text-sm text-slate-600 whitespace-pre-line">{invoice.notes}</div>
                            </div>
                        )}

                        {/* Banking Details */}
                        {settings?.bank_details && (
                            <div className="border-t border-slate-200 pt-6">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Payment Details</div>
                                <div className="text-sm text-slate-600 whitespace-pre-line font-mono">{settings.bank_details}</div>
                            </div>
                        )}

                        {/* Footer */}
                        {settings?.footer_text ? (
                            <div className="absolute bottom-12 left-12 right-12 text-center text-xs text-slate-500 whitespace-pre-line">
                                {settings.footer_text}
                            </div>
                        ) : (
                            <div className="absolute bottom-12 left-12 right-12 text-center text-xs text-slate-400">
                                Thank you for your business!
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
