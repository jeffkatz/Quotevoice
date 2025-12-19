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

    const currency = settings?.currency_symbol || '$';

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen">
                <div className="text-slate-400 font-medium">Loading document...</div>
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="p-8 text-center min-h-screen flex flex-col items-center justify-center">
                <div className="text-slate-900 font-bold text-xl mb-2">Document not found</div>
                <p className="text-slate-500 mb-6">The invoice or quotation you are looking for does not exist.</p>
                <Link to="/invoices" className="text-blue-600 font-medium hover:underline">
                    Back to Documents
                </Link>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto flex gap-8 animate-fade-in">
            {/* Sidebar Controls */}
            <div className="w-72 space-y-6 shrink-0">
                <button
                    onClick={() => navigate('/invoices')}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium group pl-1"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Back to List
                </button>

                <div className="card-apple p-5">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Document Status</div>
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xl font-bold text-slate-900">{invoice.invoice_number}</div>
                    </div>
                    <div className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                        invoice.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-600'
                        }`}>
                        {invoice.status}
                    </div>
                </div>

                <div className="card-apple p-5 space-y-3">
                    <button
                        onClick={handleDownloadPDF}
                        className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl hover:bg-slate-800 transition font-medium shadow-lg shadow-slate-900/10 active:scale-95"
                    >
                        <FileDown size={18} /> Download PDF
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="w-full flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-200 py-3 rounded-xl hover:bg-slate-50 transition font-medium"
                    >
                        <Printer size={18} /> Print
                    </button>
                </div>

                <div className="card-apple p-5 space-y-2">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Actions</div>
                    {invoice.status === 'draft' && (
                        <button
                            onClick={() => handleStatusChange('sent')}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-slate-50 rounded-lg text-slate-700 font-medium transition-colors"
                        >
                            <Send size={16} className="text-slate-400" /> Mark as Sent
                        </button>
                    )}
                    {invoice.status !== 'paid' && (
                        <button
                            onClick={() => handleStatusChange('paid')}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-green-50 rounded-lg text-green-700 font-medium transition-colors"
                        >
                            <CheckCircle size={16} className="text-green-500" /> Mark as Paid
                        </button>
                    )}
                    <button
                        onClick={() => navigate(`/invoices/edit/${invoice.id}`)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-slate-50 rounded-lg text-slate-700 font-medium transition-colors"
                    >
                        <Edit2 size={16} className="text-slate-400" /> Edit Document
                    </button>
                </div>
            </div>

            {/* Invoice Preview */}
            <div className="flex-1 bg-slate-100/50 p-8 rounded-3xl overflow-auto flex justify-center border border-slate-200/50 shadow-inner">
                <div
                    ref={previewRef}
                    className="bg-white w-[210mm] min-h-[297mm] p-12 shadow-2xl text-slate-800 relative transition-all"
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
                        <div className="flex justify-between items-start mb-12">
                            <div>
                                {logo ? (
                                    <img src={logo} alt="Logo" className="h-20 w-auto object-contain mb-4" />
                                ) : (
                                    <div className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
                                        {settings?.company_name || 'Your Company'}
                                    </div>
                                )}
                                {logo && (
                                    <div className="text-xl font-bold text-slate-900">
                                        {settings?.company_name}
                                    </div>
                                )}
                                {settings?.company_address && (
                                    <div className="text-sm text-slate-500 whitespace-pre-line mt-2 leading-relaxed">
                                        {settings.company_address}
                                    </div>
                                )}
                                <div className="mt-4 space-y-1">
                                    {settings?.company_email && (
                                        <div className="text-sm text-slate-500">{settings.company_email}</div>
                                    )}
                                    {settings?.company_phone && (
                                        <div className="text-sm text-slate-500">{settings.company_phone}</div>
                                    )}
                                </div>
                            </div>
                            <div className="text-right">
                                <h1 className="text-5xl font-black text-slate-100 tracking-tight uppercase">
                                    {invoice.type}
                                </h1>
                                <div className="text-lg font-mono font-medium text-slate-600 mt-2">
                                    #{invoice.invoice_number}
                                </div>
                                {settings?.header_text && (
                                    <div className="mt-2 text-xs text-slate-400 whitespace-pre-line max-w-[200px] ml-auto">
                                        {settings.header_text}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bill To & Details */}
                        <div className="flex justify-between mb-12 pb-8 border-b border-slate-100">
                            <div>
                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Bill To</div>
                                {invoice.client ? (
                                    <>
                                        <div className="font-bold text-xl text-slate-900 mb-1">{invoice.client.name}</div>
                                        {invoice.client.address && (
                                            <div className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">{invoice.client.address}</div>
                                        )}
                                        {invoice.client.email && (
                                            <div className="text-sm text-slate-500 mt-2">{invoice.client.email}</div>
                                        )}
                                        {invoice.client.tax_id && (
                                            <div className="text-sm text-slate-400 mt-1">VAT: {invoice.client.tax_id}</div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-slate-400 italic">Client not found</div>
                                )}
                            </div>
                            <div className="text-right min-w-[200px]">
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Issue Date</div>
                                        <div className="font-semibold text-slate-900">{new Date(invoice.issue_date).toLocaleDateString(undefined, { dateStyle: 'long' })}</div>
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Due Date</div>
                                        <div className="font-semibold text-slate-900">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString(undefined, { dateStyle: 'long' }) : '-'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <table className="w-full mb-8">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="text-left py-4 font-bold text-slate-900 text-sm pl-2">Description</th>
                                    <th className="text-center py-4 font-bold text-slate-900 text-sm w-24">Qty</th>
                                    <th className="text-right py-4 font-bold text-slate-900 text-sm w-32">Rate</th>
                                    <th className="text-right py-4 font-bold text-slate-900 text-sm w-32 pr-2">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {invoice.items?.map((item: any, i: number) => (
                                    <tr key={i}>
                                        <td className="py-4 text-slate-700 pl-2 font-medium">{item.description}</td>
                                        <td className="py-4 text-center text-slate-500">{item.quantity}</td>
                                        <td className="py-4 text-right text-slate-500">{currency}{(item.unit_price || 0).toFixed(2)}</td>
                                        <td className="py-4 text-right font-bold text-slate-900 pr-2">
                                            {currency}{(item.total_price || 0).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Totals */}
                        <div className="flex justify-end mb-12">
                            <div className="w-80 bg-slate-50 rounded-xl p-6">
                                <div className="flex justify-between py-2 text-slate-500 text-sm">
                                    <span>Subtotal</span>
                                    <span className="font-medium text-slate-900">{currency}{(invoice.subtotal || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between py-2 text-slate-500 text-sm border-b border-slate-200 mb-2">
                                    <span>VAT ({invoice.tax_rate || 0}%)</span>
                                    <span className="font-medium text-slate-900">{currency}{(invoice.tax_total || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between pt-2 font-bold text-xl text-slate-900">
                                    <span>Total</span>
                                    <span style={{ color: settings?.primary_color || '#0071e3' }}>
                                        {currency}{(invoice.grand_total || 0).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        {invoice.notes && (
                            <div className="mb-8">
                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Notes / Terms</div>
                                <div className="text-sm text-slate-600 whitespace-pre-line leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">{invoice.notes}</div>
                            </div>
                        )}

                        {/* Banking Details */}
                        {settings?.bank_details && (
                            <div className="absolute bottom-12 left-12 right-12 border-t border-slate-100 pt-6">
                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Payment Details</div>
                                <div className="text-xs text-slate-500 whitespace-pre-line font-mono">{settings.bank_details}</div>
                            </div>
                        )}

                        {/* Footer */}
                        {settings?.footer_text ? (
                            <div className="absolute bottom-8 left-12 right-12 text-center text-xs text-slate-400 whitespace-pre-line">
                                {settings.footer_text}
                            </div>
                        ) : (
                            <div className="absolute bottom-8 left-12 right-12 text-center text-xs text-slate-400">
                                Thank you for your business!
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
